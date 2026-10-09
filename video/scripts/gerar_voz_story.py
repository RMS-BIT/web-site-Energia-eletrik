"""Locução feminina (tom de reportagem) de stories/reels, com Kokoro.

O texto e o ritmo vêm de um roteiro JSON (ex.: src/StoryMateria/roteiro.json):

  {
    "saida_audio": "public/story/voz",          # um WAV por cena
    "metadados": "src/StoryMateria/voz.json",   # tempos lidos pelo Remotion
    "cenas": {
      "titulo": {"ritmo": [atraso, sobra, sobreposicao], "frases": [["texto", pausa_s], ...]},
      ...
    }
  }

ritmo (quadros): atraso da voz após o início da cena, sobra depois da fala e
sobreposição com a cena seguinte. O voz.json traz a duração de cada cena, o
início de cada frase e a linha do tempo, usada pelas cenas e pela trilha
(gerar_trilha_story.py).

Uso:
  python scripts/gerar_voz_story.py <pasta_modelos> <roteiro.json> [voz] [velocidade]
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

FPS = 30

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
    roteiro = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
    voz = sys.argv[3] if len(sys.argv) > 3 else "pf_dora"
    velocidade = float(sys.argv[4]) if len(sys.argv) > 4 else 1.06
    saida = Path(roteiro["saida_audio"])
    saida.mkdir(parents=True, exist_ok=True)

    kokoro = Kokoro(str(modelos / "kokoro-v1.0.onnx"), str(modelos / "voices-v1.0.bin"))
    meta = {}
    for cena, dados in roteiro["cenas"].items():
        partes = []
        inicios = []
        sr = 24000
        for texto, pausa in dados["frases"]:
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
    for cena, dados in roteiro["cenas"].items():
        atraso, sobra, sobrepoe = dados["ritmo"]
        dur = atraso + round(meta[cena]["duracao"] * FPS) + sobra
        meta[cena].update({"de": ini, "dur": dur, "voz": ini + atraso})
        ini += dur - sobrepoe
    total = ini

    destino = Path(roteiro["metadados"])
    dados = {"voz": voz, "velocidade": velocidade, "fps": FPS, "total": total, "cenas": meta}
    destino.write_text(json.dumps(dados, indent=2) + "\n")
    print(f"total: {total} quadros ({total / FPS:.1f}s)")
    print("Metadados em", destino)


if __name__ == "__main__":
    main()
