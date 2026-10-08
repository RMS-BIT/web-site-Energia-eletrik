"""Sound design do vídeo de 43 s (tudo sintetizado, sem samples de terceiros).

Gera em public/audio/r43/: impacto, beep, beep_duplo, click, scan, pulso,
whoosh, swish, hit, impacto_final e trilha (pulso cinematográfico de 120 BPM,
opcional no vídeo).

Uso: python3 scripts/gerar_audio_r43.py
"""

from __future__ import annotations

from pathlib import Path

import numpy as np

from gerar_audio import SR, add, env_adsr, one_pole_lowpass, save, soft_saw, t_axis

rng = np.random.default_rng(43)
OUT = Path("public/audio/r43")
TOTAL = 43.0
BEAT = 0.5  # 120 BPM: 1 tempo = 15 quadros


def sine(f, dur):
    return np.sin(2 * np.pi * np.cumsum(np.broadcast_to(f, t_axis(dur).shape)) / SR)


def ruido(dur):
    return rng.normal(0, 1, len(t_axis(dur)))


def passa_alta(x, fc):
    return x - one_pole_lowpass(x, fc)


def reverb(x, tempo=1.2, mix=0.25):
    # reverb simples: soma de ecos esparsos decaindo, filtrados
    y = x.copy()
    for k in range(1, 9):
        atraso = int(SR * (0.031 * k + 0.007 * (k % 3)))
        g = mix * np.exp(-k * 0.045 / tempo * 8)
        if atraso < len(x):
            y[atraso:] += one_pole_lowpass(x[: len(x) - atraso], 3500) * g
    return y


def impacto():
    t = t_axis(2.6)
    sub = sine(28 + 55 * np.exp(-t * 7), 2.6) * np.exp(-t * 1.6)
    corpo = one_pole_lowpass(ruido(2.6), 400) * np.exp(-t * 6) * 3
    ataque = passa_alta(ruido(2.6), 2000) * np.exp(-t * 60) * 0.4
    return reverb(sub + corpo + ataque, 1.8, 0.3)


def beep(f=1760, dur=0.11):
    t = t_axis(dur)
    s = (sine(f, dur) + 0.25 * sine(f * 2, dur)) * np.minimum(1, t / 0.004) * np.exp(-t * 18)
    return reverb(np.pad(s, (0, int(0.3 * SR))), 0.6, 0.18)


def beep_duplo():
    a = beep(1760, 0.08)
    out = np.zeros(int(0.5 * SR))
    add(out, a, 0.0)
    add(out, beep(2349, 0.09), 0.11)
    return out


def click():
    t = t_axis(0.06)
    trans = passa_alta(ruido(0.06), 1500) * np.exp(-t * 400)
    corpo = sine(2600, 0.06) * np.exp(-t * 140) * 0.5 + sine(900, 0.06) * np.exp(-t * 90) * 0.4
    return trans * 0.7 + corpo


def scan(dur=1.4):
    t = t_axis(dur)
    p = t / dur
    chirp = sine(380 + 2200 * p**1.6, dur) * 0.35
    banda = one_pole_lowpass(passa_alta(ruido(dur), 600 + 3000 * p), 1200 + 6000 * p)
    trem = 0.6 + 0.4 * np.sin(2 * np.pi * (14 + 20 * p) * t)
    env = np.sin(np.pi * p) ** 0.7
    return reverb((chirp + banda * 0.5) * trem * env, 1.0, 0.2)


def pulso():
    out = np.zeros(int(1.2 * SR))
    for k, g in enumerate((1.0, 0.7, 0.45)):
        t = t_axis(0.22)
        s = sine(110, 0.22) * np.exp(-t * 20) + 0.4 * sine(880, 0.22) * np.exp(-t * 45)
        add(out, s, k * 0.16, g)
    return reverb(out, 1.0, 0.25)


def whoosh(dur=0.7):
    t = t_axis(dur)
    forma = np.sin(np.pi * t / dur) ** 2.5
    s = one_pole_lowpass(ruido(dur), 300 + 5500 * forma)
    s = passa_alta(s, 180)
    return s * forma / (np.abs(s).max() + 1e-9)


def swish():
    dur = 0.4
    t = t_axis(dur)
    p = t / dur
    s = one_pole_lowpass(ruido(dur), 500 + 9000 * p**2) * p**2
    s = passa_alta(s, 300)
    tom = sine(300 + 1800 * p**2, dur) * p**3 * 0.3
    return s / (np.abs(s).max() + 1e-9) + tom


def hit():
    t = t_axis(0.8)
    k = sine(45 + 120 * np.exp(-t * 35), 0.8) * np.exp(-t * 6)
    n = one_pole_lowpass(ruido(0.8), 2500) * np.exp(-t * 25) * 0.8
    return reverb(k + n, 1.0, 0.22)


def impacto_final():
    t = t_axis(3.5)
    sub = sine(32 + 30 * np.exp(-t * 5), 3.5) * np.exp(-t * 1.1) * 0.8
    sino = sum(sine(f, 3.5) * np.exp(-t * d) * g for f, d, g in ((523.25, 1.4, 0.25), (783.99, 1.8, 0.15), (1046.5, 2.4, 0.08)))
    return reverb(sub + sino * np.minimum(1, t / 0.01), 2.2, 0.35)


def trilha():
    buf = np.zeros(int(TOTAL * SR))
    # drone escuro
    for f, g in ((55.0, 0.05), (82.41, 0.035), (110.0, 0.02)):
        d = soft_saw(f, TOTAL, 5)
        add(buf, one_pole_lowpass(d, 380) * env_adsr(len(d), 2.0, 2.5), 0.0, g)
    kick = sine(42 + 100 * np.exp(-t_axis(0.5) * 30), 0.5) * np.exp(-t_axis(0.5) * 7)
    hat_t = t_axis(0.04)
    hat = passa_alta(ruido(0.04), 6000) * np.exp(-hat_t * 120)
    n_beats = int(TOTAL / BEAT)
    for b in range(n_beats):
        tb = b * BEAT
        if 3 <= tb < 36 and b % 2 == 0:
            add(buf, kick, tb, 0.35)
        if 36 <= tb < 40:  # montagem: kick em todo tempo
            add(buf, kick, tb, 0.55)
        if 19 <= tb < 40:  # tensão no momento principal
            for s in range(4):
                add(buf, hat, tb + s * BEAT / 4, 0.05 if s else 0.09)
    # baixo pulsado
    for b in range(int(3 / BEAT), int(40 / BEAT)):
        tb = b * BEAT
        tt = t_axis(BEAT * 0.9)
        nota = 55.0 if (b // 8) % 2 == 0 else 49.0
        add(buf, sine(nota, BEAT * 0.9) * np.exp(-tt * 5), tb, 0.12)
    return buf


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    itens = {
        "impacto": (impacto(), -1.0),
        "beep": (beep(), -6.0),
        "beep_duplo": (beep_duplo(), -6.0),
        "click": (click(), -4.0),
        "scan": (scan(), -3.0),
        "pulso": (pulso(), -3.0),
        "whoosh": (whoosh(), -3.0),
        "swish": (swish(), -3.0),
        "hit": (hit(), -1.0),
        "impacto_final": (impacto_final(), -1.0),
        "trilha": (trilha(), -3.0),
    }
    for nome, (sig, pico) in itens.items():
        save(OUT / f"{nome}.wav", sig, pico)
    print("Áudios em", OUT)


if __name__ == "__main__":
    main()
