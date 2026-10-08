"""Estima o tempo de cada palavra da locução para as legendas.

Sem modelo de reconhecimento de fala: usa as pausas reais de cada WAV
(silencedetect do ffmpeg) como âncoras nas vírgulas/pontos, e distribui as
palavras de cada trecho proporcionalmente ao número de letras.

Uso: python3 scripts/alinhar_legendas.py   (lê e reescreve src/AnuncioImageador/voz.json)
"""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

META = Path("src/AnuncioImageador/voz.json")


def silencios(wav: Path) -> list[tuple[float, float]]:
    r = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(wav), "-af", "silencedetect=n=-38dB:d=0.09", "-f", "null", "-"],
        capture_output=True,
        text=True,
        check=True,
    )
    ini = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r.stderr)]
    fim = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r.stderr)]
    return list(zip(ini, fim))


def peso(palavra: str) -> float:
    letras = len(re.sub(r"[^\wÀ-ÿ₂]", "", palavra))
    return max(1.5, letras) + 1.2  # +1.2 ~ tempo de transição entre palavras


def alinhar(legenda: str, duracao: float, sil: list[tuple[float, float]]) -> list[dict]:
    palavras = legenda.split()
    # trechos separados por pontuação
    trechos: list[list[str]] = [[]]
    for p in palavras:
        trechos[-1].append(p)
        if re.search(r"[,.?!]$", p) and p is not palavras[-1]:
            trechos.append([])
    trechos = [t for t in trechos if t]

    inicio_fala = sil[0][1] if sil and sil[0][0] < 0.02 else 0.0
    fim_fala = sil[-1][0] if sil and sil[-1][1] >= duracao - 0.02 else duracao
    internos = [s for s in sil if s[0] > inicio_fala + 0.05 and s[1] < fim_fala - 0.05]
    # mantém as maiores pausas, uma por fronteira entre trechos
    n = len(trechos) - 1
    escolhidos = sorted(sorted(internos, key=lambda s: s[1] - s[0], reverse=True)[:n])
    if len(escolhidos) == n:
        janelas = []
        a = inicio_fala
        for s in escolhidos:
            janelas.append((a, s[0]))
            a = s[1]
        janelas.append((a, fim_fala))
    else:  # sem âncoras suficientes: proporcional no total
        tot = sum(sum(peso(p) for p in t) for t in trechos)
        janelas, a = [], inicio_fala
        for t in trechos:
            d = (fim_fala - inicio_fala) * sum(peso(p) for p in t) / tot
            janelas.append((a, a + d))
            a += d

    resultado = []
    for t, (a, b) in zip(trechos, janelas):
        tot = sum(peso(p) for p in t)
        x = a
        for p in t:
            d = (b - a) * peso(p) / tot
            resultado.append({"palavra": p, "inicio": round(x, 3), "fim": round(x + d, 3)})
            x += d
    return resultado


def main() -> None:
    meta = json.loads(META.read_text())
    for f in meta["frases"]:
        wav = Path("public") / f["arquivo"]
        sil = silencios(wav)
        f["palavras"] = alinhar(f["legenda"], f["duracao"], sil)
        print(wav.name, "pausas:", [(round(a, 2), round(b, 2)) for a, b in sil])
    META.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
