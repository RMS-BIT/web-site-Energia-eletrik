"""Locução feminina (tom de reportagem) do story de matéria, com Kokoro.

Cada cena vira um WAV; dentro da cena, as frases são separadas por pausas
dramáticas. As durações, o início de cada frase e a linha do tempo das cenas
(em quadros) vão para src/StoryMateria/voz.json, lido pelo Remotion e pela
trilha (gerar_trilha_story.py).

Texto baseado na matéria do Campo Grande News (dados conferidos em 09/10/2026).

Uso:
  python scripts/gerar_voz_story.py <pasta_modelos> [voz] [velocidade]
  voz: pf_dora (feminina, padrão)
"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

# cena -> lista de (frase falada, pausa depois em s)
CENAS: dict[str, list[tuple[str, float]]] = {
    "titulo": [
        ("Atenção, Campo Grande.", 0.55),
        ("O Hospital de Câncer vai oferecer cento e oitenta exames gratuitos...", 0.25),
        ("por dia.", 0.5),
    ],
    "foto": [
        ("É a campanha de prevenção do Outubro Rosa, e do Novembro Azul.", 0.35),
        ("O lançamento é no dia catorze de outubro.", 0.5),
    ],
    "numeros": [
        ("São oitenta mamografias, para mulheres de quarenta a setenta e quatro anos.", 0.4),
        ("E cem exames de pê ésse á, para homens de quarenta e cinco a setenta e cinco.", 0.5),
        ("De quinze a vinte e sete de outubro, de segunda a sexta,", 0.15),
        ("com senhas por ordem de chegada.", 0.5),
    ],
    "final": [
        ("Prevenção salva vidas.", 0.35),
        ("Compartilhe com quem precisa.", 0.6),
    ],
}

FPS = 30
# por cena: atraso da voz após o início da cena, sobra depois da fala e
# sobreposição com a cena seguinte (quadros)
RITMO = {
    "titulo": (8, 6, 14),
    "foto": (12, 6, 10),
    "numeros": (40, 8, 8),
    "final": (14, 45, 0),
}

# cadeia de "voz de rádio/TV": limpa graves, presença, compressão e sala curta
CADEIA = (
    "highpass=f=90,"
    "equalizer=f=220:t=q:w=1.2:g=-2,"
    "equalizer=f=3200:t=q:w=1.0:g=3,"
    "equalizer=f=9000:t=q:w=1.0:g=1.5,"
    "acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=3,"
    "aecho=0.8:0.5:28|46:0.10|0.06,"
    "alimiter=limit=0.89"
)


def main() -> None:
    modelos = Path(sys.argv[1])
    voz = sys.argv[2] if len(sys.argv) > 2 else "pf_dora"
    velocidade = float(sys.argv[3]) if len(sys.argv) > 3 else 1.06
    saida = Path("public/story/voz")
    saida.mkdir(parents=True, exist_ok=True)

    kokoro = Kokoro(str(modelos / "kokoro-v1.0.onnx"), str(modelos / "voices-v1.0.bin"))
    meta = {}
    for cena, frases in CENAS.items():
        partes = []
        inicios = []
        sr = 24000
        for texto, pausa in frases:
            inicios.append(round(sum(len(x) for x in partes) / sr, 3))
            samples, sr = kokoro.create(texto, voice=voz, speed=velocidade, lang="pt-br")
            # apara silêncio das bordas para controlar as pausas com precisão
            idx = np.where(np.abs(samples) > 0.01)[0]
            samples = samples[max(0, idx[0] - 240) : idx[-1] + 1200]
            partes += [samples, np.zeros(int(pausa * sr), dtype=samples.dtype)]
        audio = np.concatenate(partes)
        with tempfile.TemporaryDirectory() as tmp:
            bruto = Path(tmp) / "bruto.wav"
            sf.write(bruto, audio, sr)
            destino = saida / f"{cena}.wav"
            subprocess.run(
                ["ffmpeg", "-y", "-loglevel", "error", "-i", str(bruto), "-af", CADEIA, "-ar", "48000", str(destino)],
                check=True,
            )
        meta[cena] = {"duracao": round(len(audio) / sr, 3), "frases": inicios}
        print(f"{cena}: {meta[cena]['duracao']:.2f}s")

    # linha do tempo (quadros)
    ini = 0
    for cena, (atraso, sobra, sobrepoe) in RITMO.items():
        dur = atraso + round(meta[cena]["duracao"] * FPS) + sobra
        meta[cena].update({"de": ini, "dur": dur, "voz": ini + atraso})
        ini += dur - sobrepoe
    total = ini

    destino = Path("src/StoryMateria/voz.json")
    dados = {"voz": voz, "velocidade": velocidade, "fps": FPS, "total": total, "cenas": meta}
    destino.write_text(json.dumps(dados, indent=2) + "\n")
    print(f"total: {total} quadros ({total / FPS:.1f}s)")
    print("Metadados em", destino)


if __name__ == "__main__":
    main()
