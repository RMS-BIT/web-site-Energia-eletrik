"""Gera a trilha sintetizada e os efeitos sonoros do anúncio.

Tudo é sintetizado aqui (sem samples de terceiros), então não há
questão de licença. A grade rítmica é 120 BPM, ou seja, 1 tempo = 15
quadros a 30 fps, alinhada com os cortes definidos em src/Anuncio/timeline.ts.

Uso: python3 scripts/gerar_audio.py [pasta_saida]
"""

from __future__ import annotations

import sys
import wave
from pathlib import Path

import numpy as np

SR = 48_000
BPM = 120
BEAT = 60 / BPM
DROP = 3.0  # entrada da bateria (quadro 90)
END_CARD = 22.0  # cartela final (quadro 660)
TOTAL = 27.5

rng = np.random.default_rng(7)


def t_axis(dur: float) -> np.ndarray:
    return np.arange(int(dur * SR)) / SR


def one_pole_lowpass(x: np.ndarray, cutoff: np.ndarray | float) -> np.ndarray:
    cutoff = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def soft_saw(freq: float, dur: float, harmonics: int = 10) -> np.ndarray:
    t = t_axis(dur)
    out = np.zeros_like(t)
    for detune in (-0.12, 0.0, 0.12):
        f = freq * (2 ** (detune / 12))
        for n in range(1, harmonics + 1):
            out += np.sin(2 * np.pi * f * n * t + rng.uniform(0, 6.28)) / (n**1.4)
    return out / 3


def add(buf: np.ndarray, sig: np.ndarray, start: float, gain: float = 1.0) -> None:
    i = int(start * SR)
    if i >= len(buf):
        return
    end = min(len(buf), i + len(sig))
    buf[i:end] += sig[: end - i] * gain


def env_adsr(n: int, a: float, r: float) -> np.ndarray:
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return e


def kick() -> np.ndarray:
    t = t_axis(0.45)
    f = 45 + 95 * np.exp(-t * 28)
    phase = 2 * np.pi * np.cumsum(f) / SR
    click = rng.normal(0, 1, len(t)) * np.exp(-t * 300) * 0.25
    return (np.sin(phase) * np.exp(-t * 7.5) + click) * 0.9


def hat() -> np.ndarray:
    t = t_axis(0.06)
    n = rng.normal(0, 1, len(t))
    n = np.diff(n, prepend=0)
    return n * np.exp(-t * 70) * 0.18


def pluck(freq: float) -> np.ndarray:
    t = t_axis(0.35)
    s = soft_saw(freq, 0.35, harmonics=6)
    s = one_pole_lowpass(s, 900 + 2500 * np.exp(-t * 18))
    return s * np.exp(-t * 9)


def whoosh(dur: float = 0.7) -> np.ndarray:
    t = t_axis(dur)
    n = rng.normal(0, 1, len(t))
    shape = np.sin(np.pi * t / dur) ** 2
    cutoff = 300 + 5000 * shape
    s = one_pole_lowpass(n, cutoff)
    s = s - one_pole_lowpass(s, 150)
    return s * shape / (np.abs(s).max() + 1e-9) * 0.8


def impact() -> np.ndarray:
    t = t_axis(1.8)
    f = 32 + 60 * np.exp(-t * 10)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    noise = one_pole_lowpass(rng.normal(0, 1, len(t)), 1800) * np.exp(-t * 9) * 2.5
    s = boom + noise
    return s / np.abs(s).max() * 0.9


def riser(dur: float = 2.6) -> np.ndarray:
    t = t_axis(dur)
    prog = t / dur
    n = rng.normal(0, 1, len(t))
    s = one_pole_lowpass(n, 200 + 7000 * prog**2)
    tone = np.sin(2 * np.pi * np.cumsum(220 + 660 * prog**2) / SR) * 0.15
    s = (s / (np.abs(s).max() + 1e-9) + tone) * prog**1.5
    return s * 0.7


def music() -> np.ndarray:
    buf = np.zeros(int(TOTAL * SR))
    # Am - F - C - G, 2 compassos (8 tempos = 4 s) cada
    chords = [
        (55.00, [220.00, 261.63, 329.63]),
        (43.65, [174.61, 220.00, 261.63]),
        (65.41, [196.00, 261.63, 329.63]),
        (49.00, [196.00, 246.94, 293.66]),
    ]
    chord_len = 8 * BEAT
    n_chords = int(np.ceil(TOTAL / chord_len))
    k, h = kick(), hat()
    for ci in range(n_chords):
        start = ci * chord_len
        root, tones = chords[ci % 4]
        dur = min(chord_len + 0.4, TOTAL - start)
        if dur <= 0:
            break
        pad = sum(soft_saw(f, dur, 8) for f in tones)
        pad = one_pole_lowpass(pad, 1400) * env_adsr(len(pad), 0.4, 0.4)
        add(buf, pad, start, 0.06)
        for b in range(16):  # colcheias
            tb = start + b * BEAT / 2
            if tb >= TOTAL:
                break
            in_groove = DROP <= tb < END_CARD
            if in_groove:
                bass_t = t_axis(BEAT / 2)
                bass = np.sin(2 * np.pi * root * bass_t) + 0.3 * np.sin(4 * np.pi * root * bass_t)
                bass *= env_adsr(len(bass), 0.01, 0.08) * np.minimum(1, bass_t / 0.12 + 0.2)
                add(buf, bass, tb, 0.30)
                note = tones[(b * 2 + ci) % 3] * (2 if b % 4 == 3 else 1)
                add(buf, pluck(note), tb, 0.10)
                if b % 2 == 0:
                    add(buf, k, tb, 0.85)
                else:
                    add(buf, h, tb, 1.0)
            elif tb < DROP and b % 4 == 0:
                add(buf, pluck(tones[0] * 2), tb, 0.07)
    # outro: acorde final sustentado
    final = sum(soft_saw(f, TOTAL - END_CARD, 8) for f in (220.0, 261.63, 329.63, 440.0))
    final = one_pole_lowpass(final, 1600) * env_adsr(len(final), 0.05, 2.5)
    add(buf, final, END_CARD, 0.07)
    add(buf, riser(), DROP - 2.6, 0.5)
    return buf


def save(path: Path, sig: np.ndarray, peak_db: float = -1.0) -> None:
    sig = sig / (np.abs(sig).max() + 1e-9) * (10 ** (peak_db / 20))
    stereo = np.stack([sig, sig], axis=1)
    data = (stereo * 32767).astype("<i2").tobytes()
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data)


def main() -> None:
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "public/audio")
    out.mkdir(parents=True, exist_ok=True)
    save(out / "trilha.wav", music(), -3.0)
    save(out / "whoosh.wav", whoosh(), -3.0)
    save(out / "impacto.wav", impact(), -1.0)
    print("Áudios gerados em", out)


if __name__ == "__main__":
    main()
