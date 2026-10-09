"""Trilha do story de matéria: suspense que vira alegria (sintetizada).

0–4,9 s  suspense: pulso grave, tique-taque, cordas em trêmulo e riser
4,9 s    impacto na revelação da foto
4,9–9 s  tensão se resolve em acorde maior, arpejo começa
9–15 s   alegria: groove 120 BPM (bumbo, palmas, chocalho, arpejo, baixo)
15–18,5  acorde final brilhante e brilho de sinos

Uso: python3 scripts/gerar_trilha_story.py <saida.wav>
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

from gerar_audio import SR, add, env_adsr, one_pole_lowpass, save, soft_saw, t_axis

TOTAL = 18.5
REVELA = 4.87
GROOVE = 9.0
FINAL = 15.0
BEAT = 0.5
rng = np.random.default_rng(14)


def sine(f, dur):
    return np.sin(2 * np.pi * np.cumsum(np.broadcast_to(np.asarray(f, float), t_axis(dur).shape)) / SR)


def ruido(dur):
    return rng.normal(0, 1, len(t_axis(dur)))


def passa_alta(x, fc):
    return x - one_pole_lowpass(x, fc)


def eco(x, atraso=0.18, g=0.3, n=4):
    y = x.copy()
    for k in range(1, n + 1):
        i = int(atraso * k * SR)
        if i < len(x):
            y[i:] += one_pole_lowpass(x[: len(x) - i], 4000) * g**k
    return y


def bumbo(forca=1.0):
    t = t_axis(0.5)
    return sine(45 + 110 * np.exp(-t * 32), 0.5) * np.exp(-t * 7) * forca


def palma():
    t = t_axis(0.25)
    s = np.zeros_like(t)
    for d in (0.0, 0.012, 0.024):
        i = int(d * SR)
        s[i:] += passa_alta(ruido(0.25)[: len(t) - i], 1200) * np.exp(-t[: len(t) - i] * 30)
    return one_pole_lowpass(s, 6000) * 0.5


def chocalho():
    t = t_axis(0.07)
    return passa_alta(ruido(0.07), 7000) * np.exp(-t * 60) * 0.25


def pluck(f, dur=0.45):
    t = t_axis(dur)
    s = soft_saw(f, dur, 6)
    s = one_pole_lowpass(s, 1200 + 4000 * np.exp(-t * 14))
    return s * np.exp(-t * 7) * np.minimum(1, t / 0.003)


def sino(f, dur=2.0):
    t = t_axis(dur)
    s = sine(f, dur) + 0.4 * sine(f * 2.76, dur) * np.exp(-t * 3) + 0.2 * sine(f * 5.4, dur) * np.exp(-t * 6)
    return s * np.exp(-t * 2.2) * np.minimum(1, t / 0.002)


def main() -> None:
    out = Path(sys.argv[1])
    buf = np.zeros(int(TOTAL * SR))

    # ---- suspense (Lá menor) ----
    drone = soft_saw(55.0, REVELA + 0.4, 5) + 0.6 * soft_saw(82.41, REVELA + 0.4, 5)
    drone = one_pole_lowpass(drone, 300 + 500 * np.linspace(0, 1, len(drone)))
    add(buf, drone * env_adsr(len(drone), 0.8, 0.3), 0.0, 0.07)
    trem = sum(soft_saw(f, REVELA, 6) for f in (220.0, 261.63, 329.63))
    tt = t_axis(REVELA)
    trem = one_pole_lowpass(trem, 1500) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * tt)) * np.linspace(0.2, 1, len(tt)) ** 2
    add(buf, trem, 0.0, 0.03)
    for k in range(int(REVELA / 0.75)):  # batimento grave
        add(buf, bumbo(0.7), 0.3 + k * 0.75, 0.45)
    for k in range(int(REVELA / 0.25)):  # tique-taque
        t = t_axis(0.03)
        tick = sine(3200 if k % 2 else 2400, 0.03) * np.exp(-t * 150)
        add(buf, tick, k * 0.25, 0.05)
    # riser + impacto
    dur_r = 1.6
    tr = t_axis(dur_r)
    p = tr / dur_r
    riser = one_pole_lowpass(ruido(dur_r), 300 + 9000 * p**2) * p**2 + 0.3 * sine(300 + 1500 * p**2, dur_r) * p**3
    add(buf, riser / np.abs(riser).max(), REVELA - dur_r, 0.25)
    ti = t_axis(2.0)
    impacto = sine(32 + 70 * np.exp(-ti * 8), 2.0) * np.exp(-ti * 2) + one_pole_lowpass(ruido(2.0), 1500) * np.exp(-ti * 8)
    add(buf, eco(impacto / np.abs(impacto).max(), 0.2, 0.25), REVELA, 0.6)

    # ---- resolução em Ré maior + arpejo (foto) ----
    D = [146.83, 220.0, 293.66, 369.99, 440.0]
    pad = sum(soft_saw(f, GROOVE - REVELA + 0.6, 6) for f in D[:4])
    pad = one_pole_lowpass(pad, 1400) * env_adsr(len(pad), 0.4, 0.6)
    add(buf, pad, REVELA, 0.085)
    t = REVELA + 0.2
    i = 0
    while t < GROOVE:
        add(buf, pluck(D[[2, 3, 4, 3][i % 4]] * 1.0), t, 0.15)
        if t > REVELA + 2.0:
            add(buf, chocalho(), t + BEAT / 4, 0.7)
        t += BEAT / 2
        i += 1

    # ---- alegria: I–V–vi–IV em Ré (D A Bm G), 1 compasso cada ----
    acordes = [
        (73.42, [293.66, 369.99, 440.0, 587.33]),
        (55.0, [277.18, 329.63, 440.0, 554.37]),
        (61.74, [293.66, 369.99, 493.88, 587.33]),
        (49.0, [293.66, 392.0, 493.88, 587.33]),
    ]
    compasso = 4 * BEAT
    for c in range(int((FINAL - GROOVE) / compasso)):
        ini = GROOVE + c * compasso
        baixo, notas = acordes[c % 4]
        pad = sum(soft_saw(f, compasso + 0.2, 6) for f in notas[:3])
        add(buf, one_pole_lowpass(pad, 2200) * env_adsr(len(pad), 0.05, 0.2), ini, 0.03)
        for b in range(8):  # colcheias
            tb = ini + b * BEAT / 2
            add(buf, pluck(notas[[0, 2, 1, 3, 2, 1, 3, 2][b]] * 2, 0.35), tb, 0.1)
            add(buf, chocalho(), tb + BEAT / 4, 1.0)
            if b % 2 == 0:
                add(buf, bumbo(1.0), tb, 0.6)
                tbx = t_axis(BEAT * 0.9)
                add(buf, np.sin(2 * np.pi * baixo * tbx) * np.exp(-tbx * 4) * np.minimum(1, tbx / 0.01), tb, 0.22)
            if b in (2, 6):
                add(buf, palma(), tb, 0.9)

    # ---- final: acorde brilhante + sinos ----
    fim = sum(soft_saw(f, TOTAL - FINAL, 6) for f in (146.83, 220.0, 293.66, 369.99, 587.33))
    add(buf, one_pole_lowpass(fim, 2500) * env_adsr(len(fim), 0.05, 2.5), FINAL, 0.05)
    add(buf, bumbo(1.0), FINAL, 0.6)
    for k, f in enumerate((1174.66, 1479.98, 1760.0, 2349.32)):
        add(buf, eco(sino(f), 0.21, 0.3), FINAL + 0.12 * k, 0.07)

    fo = int(1.2 * SR)
    buf[-fo:] *= np.linspace(1, 0, fo)
    save(out, buf, -2.0)
    print("ok", out)


if __name__ == "__main__":
    main()
