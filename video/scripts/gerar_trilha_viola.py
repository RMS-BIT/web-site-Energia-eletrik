"""Trilha de viola caipira (toada) para o Reels do Dia do Produtor Rural.

Sintetizada: viola de 10 cordas (5 pares; graves em oitava, agudas em
uníssono levemente desafinado) com ponteado em terças, violão de base, baixo
e crescendo leve. Mi maior, I–IV–V–I (E, A, B, E), 90 BPM.

início   viola sozinha, ponteado em terças
baixo    entra o baixo
ritmo    violão de base em contratempo e bumbo bem leve
data     ponteado mais cheio (colcheias)
cheio    melodia uma oitava acima e cordas suaves
final    acorde rasgueado da viola, harmônicos e cauda

Marcas no linha.json da composição (as mesmas das cenas).

Uso: python3 scripts/gerar_trilha_viola.py <linha.json> <saida.wav>
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

from gerar_audio import SR, add, env_adsr, one_pole_lowpass, save, soft_saw, t_axis
from gerar_trilha_campo import bumbo, chocalho, corda, sino

# escala de Mi maior a partir de Si3
ESCALA = [246.94, 277.18, 311.13, 329.63, 369.99, 415.30, 440.00, 493.88, 554.37, 622.25, 659.25, 739.99, 830.61, 880.00]

# (baixo raiz, baixo quinta, acorde do violão de base)
ACORDES = {
    "E": (82.41, 123.47, [164.81, 246.94, 329.63, 415.30]),
    "A": (110.00, 164.81, [110.00, 164.81, 220.00, 277.18, 329.63]),
    "B": (123.47, 185.00, [123.47, 185.00, 246.94, 311.13, 369.99]),
}
PROGRESSAO = ["E", "A", "B", "E"]
# melodia (voz de cima) em índices da ESCALA, 8 colcheias por compasso; a voz
# de baixo é a terça diatônica abaixo (índice − 2) — as "terças caipiras"
MELODIA = [
    [12, 0, 11, 10, 11, 0, 10, 9],
    [12, 0, 13, 12, 11, 0, 10, 0],
    [11, 0, 10, 9, 8, 0, 9, 0],
    [10, 0, 0, 7, 10, 0, 0, 0],
]


def viola(f: float, dur: float = 2.2, forca: float = 1.0, decai: float = 0.9975) -> np.ndarray:
    """Par de cordas da viola: uníssono levemente desafinado + oitava nos graves."""
    s = corda(f, dur, 0.85, decai)
    par = corda(f * 1.0035, dur, 0.9, decai - 0.0003)
    n = len(s)
    atraso = int(0.004 * SR)
    s[atraso:] += 0.8 * par[: n - atraso]
    if f < 300:  # pares graves em oitava
        oit = corda(f * 2, dur, 0.95, 0.997)
        s[atraso * 2 :] += 0.45 * oit[: n - atraso * 2]
    s = s - one_pole_lowpass(s, 180)  # brilho metálico, menos "caixa"
    return s / (np.abs(s).max() + 1e-9) * forca


def main() -> None:
    linha = json.loads(Path(sys.argv[1]).read_text())
    out = Path(sys.argv[2])
    fps = linha["fps"]
    beat = 60 / linha["bpm"]
    bar = 4 * beat
    m = {k: v / fps for k, v in linha["marcas"].items()}
    total = linha["total"] / fps + 0.4
    buf = np.zeros(int(total * SR))

    n_bars = int(round(m["final"] / bar))
    for b in range(n_bars):
        t0 = b * bar
        nome = PROGRESSAO[b % 4]
        raiz, quinta, base = ACORDES[nome]
        cheio = t0 >= m["cheio"] - 0.01
        denso = t0 >= m["data"] - 0.01
        # ponteado em terças (no início só as notas dos tempos, mais espaçado)
        for e, idx in enumerate(MELODIA[b % 4]):
            if not idx or (not denso and e % 2):
                continue
            tb = t0 + e * beat / 2
            add(buf, viola(ESCALA[idx], 2.0), tb, 0.16)
            add(buf, viola(ESCALA[idx - 2], 2.0), tb + 0.006, 0.12)
            if cheio:  # dobra a melodia uma oitava acima, bem baixinho
                add(buf, viola(ESCALA[idx] * 2, 1.6), tb + 0.003, 0.05)
        # bordão da viola no tempo 1 (corda solta grave)
        add(buf, viola(raiz * 2, 2.4), t0, 0.12)
        if t0 >= m["baixo"] - 0.01:
            for k, f in ((0, raiz), (2, quinta)):
                tt = t_axis(beat * 2)
                corpo = np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)
                add(buf, corpo * np.exp(-tt * 2.2) * np.minimum(1, tt / 0.008), t0 + k * beat, 0.13)
        if t0 >= m["ritmo"] - 0.01:
            for k in range(4):  # violão de base nos contratempos
                tb = t0 + k * beat + beat / 2
                for j, f in enumerate(base[1:]):
                    add(buf, corda(f, 0.9, 0.5, 0.993), tb + j * 0.01, 0.03)
            add(buf, bumbo(), t0, 0.32)
            add(buf, bumbo(), t0 + 2 * beat, 0.22)
            for k in range(8):
                add(buf, chocalho(), t0 + k * beat / 2 + beat / 4, 0.45)
        if cheio:  # cordas suaves
            s = sum(soft_saw(f * 2, bar + 0.4, 5) for f in base[1:4])
            add(buf, one_pole_lowpass(s, 1100) * env_adsr(len(s), 0.6, 0.6), t0, 0.018)

    # final: rasgueado da viola (de cima para baixo), baixo e harmônicos
    fim = total - m["final"]
    acorde_final = [82.41, 123.47, 164.81, 246.94, 329.63, 415.30, 493.88, 659.25]
    for k, f in enumerate(acorde_final):
        add(buf, viola(f * (2 if f < 150 else 1), fim, 0.9, 0.9993), m["final"] + k * 0.022, 0.075)
        add(buf, viola(f * (2 if f < 150 else 1), fim - 2 * bar, 0.6, 0.9993), m["final"] + 2 * bar + k * 0.03, 0.04)
    s = sum(soft_saw(f, fim, 5) for f in (164.81, 246.94, 329.63, 415.30))
    add(buf, one_pole_lowpass(s, 1200) * env_adsr(len(s), 0.4, fim * 0.6), m["final"], 0.022)
    tt = t_axis(fim)
    add(buf, np.sin(2 * np.pi * 82.41 * tt) * np.exp(-tt * 0.8), m["final"], 0.2)
    add(buf, bumbo(), m["final"], 0.45)
    for k, f in enumerate((1318.5, 1661.2, 1975.5)):
        add(buf, sino(f, 3.0), m["final"] + 0.9 + 0.25 * k, 0.03)

    fo = int(2.0 * SR)
    buf[-fo:] *= np.linspace(1, 0, fo) ** 1.4
    save(out, buf, -1.5)
    print("ok", out)


if __name__ == "__main__":
    main()
