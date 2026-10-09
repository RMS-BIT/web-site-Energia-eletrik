"""Transcrição local (Whisper large-v3-turbo via sherpa-onnx) com tempos.

1. Detecta pausas com o silencedetect do ffmpeg.
2. Transcreve cada trecho de fala entre pausas (trechos curtos = tempos
   precisos) e também janelas maiores (mais contexto = texto mais confiável).
3. Distribui as palavras de cada trecho pelo número de letras.

Requisitos (fora do repositório):
  pip install sherpa-onnx soundfile numpy
  modelo: sherpa-onnx-whisper-turbo
  (https://github.com/k2-fsa/sherpa-onnx/releases/tag/asr-models)

Uso: python scripts/transcrever.py <audio_16k_mono.wav> <pasta_modelo> <saida.json>
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import sherpa_onnx
import soundfile as sf


def pausas(wav: str, limiar: str = "-35dB", minimo: float = 0.3) -> list[tuple[float, float]]:
    r = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", wav, "-af", f"silencedetect=n={limiar}:d={minimo}", "-f", "null", "-"],
        capture_output=True, text=True, check=True,
    )
    ini = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r.stderr)]
    fim = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r.stderr)]
    if len(fim) < len(ini):
        fim.append(1e9)
    return list(zip(ini, fim))


def trechos_de_fala(p: list[tuple[float, float]], dur: float) -> list[tuple[float, float]]:
    out, t = [], 0.0
    for a, b in p:
        if a - t > 0.15:
            out.append((t, a))
        t = b
    if dur - t > 0.15:
        out.append((t, dur))
    # junta trechos muito curtos ao seguinte
    juntos: list[tuple[float, float]] = []
    for a, b in out:
        if juntos and (juntos[-1][1] - juntos[-1][0] < 0.9 or a - juntos[-1][1] < 0.12):
            juntos[-1] = (juntos[-1][0], b)
        else:
            juntos.append((a, b))
    return juntos


def main() -> None:
    wav, pasta, saida = sys.argv[1], Path(sys.argv[2]), sys.argv[3]
    audio, sr = sf.read(wav, dtype="float32")
    dur = len(audio) / sr
    rec = sherpa_onnx.OfflineRecognizer.from_whisper(
        encoder=str(next(pasta.glob("*encoder*.onnx"))),
        decoder=str(next(pasta.glob("*decoder*.onnx"))),
        tokens=str(next(pasta.glob("*tokens.txt"))),
        language="pt",
        task="transcribe",
        num_threads=4,
    )

    def transcrever(a: float, b: float) -> str:
        s = rec.create_stream()
        trecho = audio[int(max(0, a - 0.08) * sr) : int(min(dur, b + 0.08) * sr)]
        s.accept_waveform(sr, np.concatenate([trecho, np.zeros(int(0.3 * sr), dtype=np.float32)]))
        rec.decode_stream(s)
        return s.result.text.strip()

    trechos = trechos_de_fala(pausas(wav), dur)
    resultado = []
    for a, b in trechos:
        texto = transcrever(a, b)
        palavras = texto.split()
        pesos = [max(2, len(re.sub(r"\W", "", w))) + 1.2 for w in palavras]
        tot = sum(pesos) or 1
        t = a
        ws = []
        for w, pz in zip(palavras, pesos):
            d = (b - a) * pz / tot
            ws.append({"palavra": w, "inicio": round(t, 3), "fim": round(t + d, 3)})
            t += d
        resultado.append({"inicio": round(a, 3), "fim": round(b, 3), "texto": texto, "palavras": ws})
        print(f"[{a:6.2f}-{b:6.2f}] {texto}")

    # janelas longas (até ~25 s, cortando em pausas) para conferência do texto
    janelas, ini = [], trechos[0][0]
    for i, (a, b) in enumerate(trechos):
        if b - ini > 25 or i == len(trechos) - 1:
            janelas.append((ini, b))
            if i + 1 < len(trechos):
                ini = trechos[i + 1][0]
    conferencia = [{"inicio": a, "fim": b, "texto": transcrever(a, b)} for a, b in janelas]
    print("\n--- conferência (janelas longas) ---")
    for c in conferencia:
        print(f"[{c['inicio']:6.2f}-{c['fim']:6.2f}] {c['texto']}")

    Path(saida).write_text(
        json.dumps({"duracao": dur, "trechos": resultado, "conferencia": conferencia}, ensure_ascii=False, indent=2)
    )


if __name__ == "__main__":
    main()
