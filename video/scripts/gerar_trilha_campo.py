"""Trilha "clima de campo" do Reels do Dia do Produtor Rural (sintetizada).

Violão dedilhado (síntese Karplus-Strong), 90 BPM, Sol maior, I–V–vi–IV
(G, D, Em, C), um compasso por acorde, crescendo aos poucos:

início   violão dedilhado sozinho, depois pad suave
baixo    entra o baixo
ritmo    bumbo leve, chocalho e palmas suaves
data     "abre": prato suave e violão passa a tocar em batida (rasgueado)
cheio    tudo junto, com melodia
final    acorde rasgueado longo, sinos e cauda

Marcas em src/ReelProdutorCampo/linha.json (as mesmas das cenas).

Uso: python3 scripts/gerar_trilha_campo.py <linha.json> <saida.wav>
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

from gerar_audio import SR, add, env_adsr, one_pole_lowpass, save, soft_saw, t_axis

rng = np.random.default_rng(7)

# (baixo, cordas do acorde do grave para o agudo)
ACORDES = [
    (98.00, [98.00, 146.83, 196.00, 246.94, 293.66, 392.00]),  # G
    (73.42, [146.83, 220.00, 293.66, 369.99]),  # D
    (82.41, [82.41, 123.47, 164.81, 196.00, 246.94, 329.63]),  # Em
    (65.41, [130.81, 164.81, 196.00, 261.63, 329.63]),  # C
]
MELODIA = [493.88, 440.00, 392.00, 329.63]  # nota longa por compasso (topo)


def ruido(n):
    return rng.normal(0, 1, n)


def corda(f, dur=2.2, brilho=0.5, decai=0.996):
    """Corda dedilhada (Karplus-Strong vetorizado por período)."""
    n = int(dur * SR)
    p = max(2, int(SR / f))
    out = np.zeros(n + p + 1)
    exc = ruido(p)
    exc = one_pole_lowpass(exc, 1500 + 6000 * brilho)
    out[1 : p + 1] = exc
    i = p + 1
    while i < len(out):
        j = min(i + p, len(out))
        k = j - i
        out[i:j] = decai * 0.5 * (out[i - p : i - p + k] + out[i - p - 1 : i - p - 1 + k])
        i = j
    s = out[1 : n + 1]
    s = s - one_pole_lowpass(s, 70)
    return s / (np.abs(s).max() + 1e-9) * np.minimum(1, np.arange(n) / (0.002 * SR))


def sine(f, dur):
    return np.sin(2 * np.pi * f * t_axis(dur))


def bumbo():
    t = t_axis(0.45)
    return np.sin(2 * np.pi * np.cumsum(45 + 80 * np.exp(-t * 30)) / SR) * np.exp(-t * 8)


def chocalho():
    t = t_axis(0.08)
    s = ruido(len(t))
    return (s - one_pole_lowpass(s, 6500)) * np.exp(-t * 50) * 0.25


def palma():
    t = t_axis(0.25)
    s = np.zeros_like(t)
    for d in (0.0, 0.012, 0.024):
        i = int(d * SR)
        r = ruido(len(t) - i)
        s[i:] += (r - one_pole_lowpass(r, 1100)) * np.exp(-t[: len(t) - i] * 30)
    return one_pole_lowpass(s, 5000) * 0.35


def prato(dur=3.0):
    t = t_axis(dur)
    s = ruido(len(t))
    s = s - one_pole_lowpass(s, 5000)
    return s * (np.minimum(1, t / (dur * 0.7)) ** 2) * np.exp(-np.maximum(0, t - dur * 0.7) * 6) * 0.3


def sino(f, dur=2.5):
    t = t_axis(dur)
    s = sine(f, dur) + 0.4 * sine(f * 2.76, dur) * np.exp(-t * 3)
    return s * np.exp(-t * 1.8) * np.minimum(1, t / 0.002)


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
        raiz, cordas = ACORDES[b % 4]
        rasgueado = t0 >= m["data"] - 0.01
        # violão: dedilhado em colcheias (baixo alternado + agudas)
        if not rasgueado:
            ordem = [0, 2, 3, 2, 1, 2, 3, 2]
            for e, idx in enumerate(ordem):
                f = cordas[min(idx, len(cordas) - 1)] * (1 if idx == 0 else 2)
                add(buf, corda(f, 1.8, 0.45), t0 + e * beat / 2, 0.17 if idx else 0.19)
        else:
            # batida: baixo no 1 e 3, rasgueado para baixo/cima nos contratempos
            padrao = [(0, "baixo"), (1, "d"), (1.5, "u"), (2, "baixo"), (2.5, "d"), (3, "u"), (3.5, "d")]
            for pos, tipo in padrao:
                tb = t0 + pos * beat
                if tipo == "baixo":
                    add(buf, corda(cordas[0] * 2, 1.6, 0.4), tb, 0.13)
                    continue
                cs = cordas[1:] if tipo == "d" else cordas[::-1][:4]
                for k, f in enumerate(cs):
                    add(buf, corda(f * 2, 1.2, 0.6, 0.994), tb + k * 0.012, 0.055)
        if t0 >= bar - 0.01:  # pad suave a partir do 2º compasso
            s = sum(soft_saw(f * 2, bar + 0.3, 5) for f in cordas[1:4])
            add(buf, one_pole_lowpass(s, 900) * env_adsr(len(s), 0.5, 0.5), t0, 0.02)
        if t0 >= m["baixo"] - 0.01:
            for k in (0, 2):
                tt = t_axis(beat * 2)
                add(buf, np.sin(2 * np.pi * raiz * tt) * np.exp(-tt * 1.6) * np.minimum(1, tt / 0.01), t0 + k * beat, 0.14)
        if t0 >= m["ritmo"] - 0.01:
            for k in range(4):
                add(buf, bumbo(), t0 + k * beat, 0.5 if k % 2 == 0 else 0.0)
                if k % 2:
                    add(buf, palma(), t0 + k * beat, 0.45 if t0 >= m["cheio"] - 0.01 else 0.3)
            for k in range(8):
                add(buf, chocalho(), t0 + k * beat / 2 + beat / 4, 0.7)
        if t0 >= m["cheio"] - 0.01:
            add(buf, corda(MELODIA[b % 4] * 2, 2.6, 0.7, 0.998), t0, 0.08)
            add(buf, corda(MELODIA[(b + 1) % 4] * 2, 2.0, 0.7, 0.998), t0 + beat * 2.5, 0.06)

    add(buf, prato(2.4), m["data"] - 2.0, 0.25)

    # final: rasgueado longo + baixo + sinos
    fim = total - m["final"]
    for rep, tb in enumerate([m["final"], m["final"] + beat * 1.5]):
        for k, f in enumerate(ACORDES[0][1]):
            add(buf, corda(f * 2, fim, 0.55, 0.9985), tb + k * 0.018, 0.07 if rep == 0 else 0.04)
    tt = t_axis(fim)
    add(buf, np.sin(2 * np.pi * 98.0 * tt) * np.exp(-tt * 0.7), m["final"], 0.24)
    add(buf, bumbo(), m["final"], 0.6)
    for k, f in enumerate((783.99, 987.77, 1174.66, 1567.98)):
        add(buf, sino(f), m["final"] + 0.25 + 0.14 * k, 0.04)

    fo = int(2.0 * SR)
    buf[-fo:] *= np.linspace(1, 0, fo) ** 1.4
    save(out, buf, -1.5)
    print("ok", out)


if __name__ == "__main__":
    main()
