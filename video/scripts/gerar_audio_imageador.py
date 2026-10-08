"""Trilha minimalista e efeitos do anúncio do imageador acústico.

Tudo sintetizado (sem samples de terceiros). 100 BPM, clima limpo:
pad suave, arpejo leve, pulso de subgrave discreto. Os efeitos (ping de
sonar, transição suave e "tick" de interface) são posicionados no Remotion.

Uso: python3 scripts/gerar_audio_imageador.py <duracao_s> [pasta_saida]
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

from gerar_audio import SR, add, env_adsr, one_pole_lowpass, save, soft_saw, t_axis

BEAT = 60 / 100
rng = np.random.default_rng(11)


def sine(freq: float, dur: float) -> np.ndarray:
    return np.sin(2 * np.pi * freq * t_axis(dur))


def bell(freq: float, dur: float = 1.6) -> np.ndarray:
    t = t_axis(dur)
    s = sine(freq, dur) + 0.35 * sine(freq * 2.01, dur) * np.exp(-t * 3) + 0.15 * sine(freq * 3.98, dur) * np.exp(-t * 6)
    return s * np.exp(-t * 2.6) * np.minimum(1, t / 0.004)


def musica(total: float, fim_groove: float) -> np.ndarray:
    buf = np.zeros(int(total * SR))
    # Fmaj7 - Am7 - Dm9 - Bbmaj7 (2 compassos cada)
    acordes = [
        (43.65, [174.61, 220.00, 261.63, 329.63]),
        (55.00, [220.00, 261.63, 329.63, 392.00]),
        (36.71, [146.83, 220.00, 261.63, 329.63]),
        (58.27, [233.08, 293.66, 349.23, 440.00]),
    ]
    dur_acorde = 8 * BEAT
    for ci in range(int(np.ceil(total / dur_acorde))):
        ini = ci * dur_acorde
        raiz, notas = acordes[ci % 4]
        d = min(dur_acorde + 0.8, total - ini)
        if d <= 0.05:
            break
        pad = sum(soft_saw(f, d, 6) for f in notas)
        pad = one_pole_lowpass(pad, 900) * env_adsr(len(pad), 0.8, 0.8)
        add(buf, pad, ini, 0.035)
        for b in range(16):  # colcheias
            tb = ini + b * BEAT / 2
            if tb >= min(total, fim_groove):
                break
            nota = notas[[0, 2, 1, 3, 2, 1, 3, 2][b % 8]] * 2
            add(buf, bell(nota, 0.9), tb, 0.045 if b % 2 == 0 else 0.028)
            if b % 2 == 0 and tb >= 1.2:
                tt = t_axis(BEAT * 0.9)
                sub = np.sin(2 * np.pi * raiz * 2 * tt) * np.exp(-tt * 3.5) * np.minimum(1, tt / 0.01)
                add(buf, sub, tb, 0.18)
            if b % 2 == 1 and tb >= 1.2:
                tt = t_axis(0.05)
                h = np.diff(rng.normal(0, 1, len(tt)), prepend=0) * np.exp(-tt * 90)
                add(buf, h, tb, 0.05)
    # acorde final
    final = sum(soft_saw(f, total - fim_groove, 6) for f in (174.61, 220.0, 261.63, 329.63, 523.25))
    final = one_pole_lowpass(final, 1200) * env_adsr(len(final), 0.1, 2.5)
    add(buf, final, fim_groove, 0.05)
    return buf


def ping_sonar() -> np.ndarray:
    t = t_axis(2.2)
    s = sine(1318.5, 2.2) * np.exp(-t * 2.2) + 0.4 * sine(1975.5, 2.2) * np.exp(-t * 4)
    eco = np.zeros_like(s)
    for k, g in ((0.32, 0.35), (0.64, 0.15)):
        i = int(k * SR)
        eco[i:] += s[: len(s) - i] * g
    return (s + eco) * np.minimum(1, t / 0.002)


def transicao_suave() -> np.ndarray:
    dur = 0.9
    t = t_axis(dur)
    forma = np.sin(np.pi * t / dur) ** 3
    s = one_pole_lowpass(rng.normal(0, 1, len(t)), 400 + 3500 * forma)
    s = s - one_pole_lowpass(s, 200)
    return s * forma / (np.abs(s).max() + 1e-9)


def tick() -> np.ndarray:
    t = t_axis(0.12)
    return (sine(2400, 0.12) * 0.6 + sine(3600, 0.12) * 0.3) * np.exp(-t * 60)


def main() -> None:
    total = float(sys.argv[1])
    out = Path(sys.argv[2] if len(sys.argv) > 2 else "public/audio")
    out.mkdir(parents=True, exist_ok=True)
    save(out / "imageador-trilha.wav", musica(total, total - 4.0), -3.0)
    save(out / "ping.wav", ping_sonar(), -3.0)
    save(out / "transicao.wav", transicao_suave(), -3.0)
    save(out / "tick.wav", tick(), -6.0)
    print("Áudios gerados em", out)


if __name__ == "__main__":
    main()
