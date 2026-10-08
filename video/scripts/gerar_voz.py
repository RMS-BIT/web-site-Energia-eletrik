"""Gera a locução do anúncio do imageador acústico com Kokoro (TTS local).

Cada frase vira um WAV separado; as durações vão para um JSON usado pelo
Remotion para sincronizar legendas e cenas.

Requisitos (fora do repositório):
  pip install kokoro-onnx soundfile
  modelos: kokoro-v1.0.onnx e voices-v1.0.bin
  (https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0)

Uso:
  python scripts/gerar_voz.py <pasta_modelos> [voz] [velocidade]
  voz: pf_dora (feminina, padrão) | pm_alex | pm_santa
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

# texto falado | texto da legenda
FRASES: list[tuple[str, str]] = [
    (
        "Você sabia que um vazamento de ar comprimido pode estar custando caro pra sua empresa? E você nem consegue ouvir.",
        "você sabia que um vazamento de ar comprimido pode estar custando caro pra sua empresa? e você nem consegue ouvir.",
    ),
    (
        "Pra isso, a Sólver usa o imageador acústico.",
        "pra isso, a SOLVER usa o imageador acústico.",
    ),
    (
        "Ele transforma o som do vazamento em imagem, e mostra exatamente onde está o problema.",
        "ele transforma o som do vazamento em imagem e mostra exatamente onde está o problema.",
    ),
    (
        "Na hora, ele estima a taxa de vazamento, o custo por ano, e até a emissão de cê ó dois.",
        "na hora, ele estima a taxa de vazamento, o custo por ano e até a emissão de CO₂.",
    ),
    (
        "Menos desperdício, mais eficiência, e manutenção no ponto certo.",
        "menos desperdício, mais eficiência e manutenção no ponto certo.",
    ),
    (
        "Sólver, Manutenção Industrial. Definir e resolver.",
        "SOLVER Manutenção Industrial. definir & resolver.",
    ),
    (
        "Agende sua inspeção.",
        "agende sua inspeção.",
    ),
]

PAUSA = 0.25  # silêncio no fim de cada frase (s)


def main() -> None:
    modelos = Path(sys.argv[1])
    voz = sys.argv[2] if len(sys.argv) > 2 else "pf_dora"
    velocidade = float(sys.argv[3]) if len(sys.argv) > 3 else 1.05
    saida_audio = Path("public/voz")
    saida_audio.mkdir(parents=True, exist_ok=True)

    kokoro = Kokoro(str(modelos / "kokoro-v1.0.onnx"), str(modelos / "voices-v1.0.bin"))
    meta = []
    for i, (fala, legenda) in enumerate(FRASES):
        samples, sr = kokoro.create(fala, voice=voz, speed=velocidade, lang="pt-br")
        samples = np.concatenate([samples, np.zeros(int(PAUSA * sr), dtype=samples.dtype)])
        nome = f"frase{i:02d}.wav"
        sf.write(saida_audio / nome, samples, sr)
        meta.append({"arquivo": f"voz/{nome}", "duracao": round(len(samples) / sr, 3), "legenda": legenda})
        print(f"{nome}: {len(samples) / sr:.2f}s")

    destino = Path("src/AnuncioImageador/voz.json")
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(json.dumps({"voz": voz, "frases": meta}, ensure_ascii=False, indent=2) + "\n")
    print("Metadados em", destino)


if __name__ == "__main__":
    main()
