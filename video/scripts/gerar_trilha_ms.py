"""Trilha instrumental discreta para o vídeo "49 anos da divisão de MS".

Sintetizada (sem samples de terceiros): piano suave (sino com decaimento),
cama de cordas e um leve crescendo na parte central e no "Parabéns".
70 BPM, Ré maior: D – Bm – G – A.

Uso: python3 scripts/gerar_trilha_ms.py <duracao_s> <inicio_crescendo_s> <inicio_parabens_s> <saida.wav>
"""

from __future__ import annotations

import sys

import numpy as np

from gerar_audio import SR, add, env_adsr, one_pole_lowpass, save, soft_saw, t_axis

BEAT = 60 / 70
rng = np.random.default_rng(49)


def piano(freq: float, dur: float = 2.6) -> np.ndarray:
    t = t_axis(dur)
    s = np.zeros_like(t)
    for n, g in ((1, 1.0), (2, 0.42), (3, 0.18), (4, 0.08)):
        s += g * np.sin(2 * np.pi * freq * n * t * (1 + 0.0004 * n)) * np.exp(-t * (1.6 + n * 0.9))
    ataque = np.minimum(1, t / 0.006)
    return s * ataque


def cordas(freqs: list[float], dur: float) -> np.ndarray:
    s = sum(soft_saw(f, dur, 7) for f in freqs)
    s = one_pole_lowpass(s, 1100)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5 * t_axis(dur))
    return s * vib * env_adsr(len(s), 1.2, 1.2)


def main() -> None:
    total, cresc, parabens, saida = float(sys.argv[1]), float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
    buf = np.zeros(int(total * SR))
    acordes = [
        (73.42, [293.66, 369.99, 440.00], [146.83, 220.00, 293.66]),  # D
        (61.74, [246.94, 293.66, 369.99], [123.47, 185.00, 246.94]),  # Bm
        (49.00, [196.00, 246.94, 293.66], [98.00, 146.83, 196.00]),  # G
        (55.00, [220.00, 277.18, 329.63], [110.00, 164.81, 220.00]),  # A
    ]
    compasso = 4 * BEAT
    n = int(np.ceil(total / compasso))
    for c in range(n):
        ini = c * compasso
        baixo, notas, graves = acordes[c % 4]
        d = min(compasso + 1.5, total - ini)
        if d <= 0.2:
            break
        intensidade = 1.0 + (0.5 if cresc <= ini < parabens - 2 else 0) + (0.7 if ini >= parabens else 0)
        add(buf, cordas(graves, d), ini, 0.018 * intensidade)
        # baixo longo
        tt = t_axis(d)
        add(buf, np.sin(2 * np.pi * baixo * tt) * env_adsr(len(tt), 0.6, 1.0), ini, 0.09 * min(1.4, intensidade))
        # piano: arpejo espaçado (colcheias pontuadas)
        padrao = [0, 1, 2, 1] if c % 2 == 0 else [0, 2, 1, 2]
        for k, idx in enumerate(padrao):
            tb = ini + k * BEAT
            if tb >= total - 0.5:
                break
            oit = 2 if (k == 2 and intensidade > 1.2) else 1
            add(buf, piano(notas[idx] * oit), tb, 0.10)
    # final: acorde de Ré sustentado
    fim = total - 3.2
    if fim > 0:
        for f in (146.83, 220.0, 293.66, 369.99):
            add(buf, piano(f, 3.2), fim, 0.07)
    # fade in / out
    fi = int(1.5 * SR)
    buf[:fi] *= np.linspace(0, 1, fi)
    fo = int(2.5 * SR)
    buf[-fo:] *= np.linspace(1, 0, fo)
    save(__import__("pathlib").Path(saida), buf, -3.0)
    print("ok", saida)


if __name__ == "__main__":
    main()
