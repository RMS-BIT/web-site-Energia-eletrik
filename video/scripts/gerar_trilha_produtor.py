"""Trilha emocional do Reels do Dia do Produtor Rural (sintetizada).

90 BPM, Ré maior, I–V–vi–IV (D, A/C#, Bm, G), um compasso por acorde.

abertura  piano suave em acordes + pad quente
terra     entra o arpejo do piano e o baixo
cria      entra a percussão leve (bumbo, chocalho, palmas) — cresce
lei       respiro: sai a percussão, fica piano e pad; riser para o final
final     tutti com acorde brilhante, sinos e acorde final sustentado

Os tempos vêm de src/ReelProdutor/linha.json (o mesmo usado pelas cenas).

Uso: python3 scripts/gerar_trilha_produtor.py <linha.json> <saida.wav>
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

from gerar_audio import SR, add, env_adsr, one_pole_lowpass, save, soft_saw, t_axis

rng = np.random.default_rng(10)


def sine(f, dur):
    return np.sin(2 * np.pi * np.cumsum(np.broadcast_to(np.asarray(f, float), t_axis(dur).shape)) / SR)


def ruido(dur):
    return rng.normal(0, 1, len(t_axis(dur)))


def passa_alta(x, fc):
    return x - one_pole_lowpass(x, fc)


def piano(f, dur=2.4, forca=1.0):
    """Piano "felt": harmônicos com decaimento próprio e martelo abafado."""
    t = t_axis(dur)
    s = np.zeros_like(t)
    for k, (g, d) in enumerate([(1.0, 1.6), (0.45, 2.6), (0.22, 3.8), (0.1, 5.0), (0.05, 7.0)], start=1):
        s += g * sine(f * k * (1 + 0.0004 * k * k), dur) * np.exp(-t * d)
    s += one_pole_lowpass(ruido(dur), 1200) * np.exp(-t * 60) * 0.08
    s = one_pole_lowpass(s, 2600)
    return s * np.minimum(1, t / 0.004) * forca


def pad(freqs, dur):
    s = sum(soft_saw(f, dur, 6) for f in freqs)
    return one_pole_lowpass(s, 1100) * env_adsr(len(s), min(1.2, dur / 3), min(1.2, dur / 3))


def bumbo():
    t = t_axis(0.5)
    return sine(45 + 100 * np.exp(-t * 30), 0.5) * np.exp(-t * 7)


def chocalho():
    t = t_axis(0.07)
    return passa_alta(ruido(0.07), 7000) * np.exp(-t * 60) * 0.25


def palma():
    t = t_axis(0.25)
    s = np.zeros_like(t)
    for d in (0.0, 0.011, 0.023):
        i = int(d * SR)
        s[i:] += passa_alta(ruido(0.25)[: len(t) - i], 1200) * np.exp(-t[: len(t) - i] * 32)
    return one_pole_lowpass(s, 5000) * 0.4


def sino(f, dur=2.5):
    t = t_axis(dur)
    s = sine(f, dur) + 0.4 * sine(f * 2.76, dur) * np.exp(-t * 3) + 0.2 * sine(f * 5.4, dur) * np.exp(-t * 6)
    return s * np.exp(-t * 1.8) * np.minimum(1, t / 0.002)


def eco(x, atraso=0.333, g=0.3, n=4):
    y = x.copy()
    for k in range(1, n + 1):
        i = int(atraso * k * SR)
        if i < len(x):
            y[i:] += one_pole_lowpass(x[: len(x) - i], 3500) * g**k
    return y


# (baixo, acorde, arpejo)
ACORDES = [
    (73.42, [293.66, 369.99, 440.0], [293.66, 440.0, 587.33, 739.99]),  # D
    (69.30, [277.18, 329.63, 440.0], [277.18, 440.0, 554.37, 659.26]),  # A/C#
    (61.74, [246.94, 293.66, 369.99], [246.94, 369.99, 493.88, 587.33]),  # Bm
    (49.00, [246.94, 293.66, 392.0], [196.0, 293.66, 392.0, 493.88]),  # G
]
MELODIA = [739.99, 659.26, 587.33, 493.88]  # nota de topo de cada compasso


def main() -> None:
    linha = json.loads(Path(sys.argv[1]).read_text())
    out = Path(sys.argv[2])
    fps = linha["fps"]
    beat = 60 / linha["bpm"]
    bar = 4 * beat
    c = {k: v["de"] / fps for k, v in linha["cenas"].items()}
    total = linha["total"] / fps + 0.4
    buf = np.zeros(int(total * SR))

    n_bars = int(np.ceil(c["final"] / bar))
    for b in range(n_bars):
        ini = b * bar
        baixo, acorde, arpejo = ACORDES[b % 4]
        respiro = c["lei"] <= ini < c["final"]
        # pad quente o tempo todo (entra em fade no 1º compasso)
        add(buf, pad(acorde, bar + 0.4), ini, 0.028 if b else 0.018)
        # piano: acorde no tempo 1 e nota de melodia
        for f in acorde:
            add(buf, piano(f, 2.8, 0.8), ini, 0.07)
        add(buf, piano(MELODIA[b % 4], 2.4), ini + beat * 2, 0.08)
        if ini >= c["terra"] - 0.01:
            for k in range(8):  # arpejo em colcheias
                add(buf, piano(arpejo[[0, 1, 2, 3, 2, 1, 2, 3][k]], 1.2, 0.6), ini + k * beat / 2, 0.05)
            tb = t_axis(bar)
            add(buf, np.sin(2 * np.pi * baixo * tb) * env_adsr(len(tb), 0.02, 0.4), ini, 0.16)
        if ini >= c["cria"] - 0.01 and not respiro:
            for k in range(4):
                add(buf, bumbo(), ini + k * beat, 0.45 if k % 2 == 0 else 0.25)
                if k % 2:
                    add(buf, palma(), ini + k * beat, 0.6)
            for k in range(8):
                add(buf, chocalho(), ini + k * beat / 2 + beat / 4, 0.8)

    # riser leve para o final
    dur_r = c["final"] - c["lei"]
    tr = t_axis(dur_r)
    p = tr / dur_r
    riser = one_pole_lowpass(ruido(dur_r), 300 + 7000 * p**2) * p**2.5
    add(buf, riser / np.abs(riser).max(), c["lei"], 0.12)

    # final: tutti + acorde sustentado e sinos
    fim = total - c["final"]
    add(buf, bumbo(), c["final"], 0.7)
    D = [146.83, 220.0, 293.66, 369.99, 440.0, 587.33]
    add(buf, pad(D, fim), c["final"], 0.03)
    for f in D[1:]:
        add(buf, piano(f, fim, 0.9), c["final"], 0.07)
    tb = t_axis(fim)
    add(buf, np.sin(2 * np.pi * 73.42 * tb) * env_adsr(len(tb), 0.02, 1.5), c["final"], 0.18)
    for k, f in enumerate((1174.66, 1479.98, 1760.0, 2349.32)):
        add(buf, eco(sino(f), beat / 2, 0.3), c["final"] + 0.1 * k, 0.05)
    for k in range(4):  # mais um compasso de ritmo leve no final
        add(buf, chocalho(), c["final"] + bar + k * beat / 2, 0.6)

    fo = int(2.0 * SR)
    buf[-fo:] *= np.linspace(1, 0, fo) ** 1.5
    save(out, buf, -2.0)
    print("ok", out)


if __name__ == "__main__":
    main()
