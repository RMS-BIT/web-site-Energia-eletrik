"""Batida do Reels viral do Dia do Produtor Rural (sintetizada, 120 BPM).

intro   (0 → drop)      acordes abafados, rufar de caixa acelerando e riser
drop    (drop → quebra) bumbo 4/4, palmas, chimbal, baixo com "pump" e acordes
quebra  (quebra → drop2) sem bumbo; acordes filtrados, rufar e riser
drop2   (drop2 → final) tudo de volta, com melodia uma oitava acima
final   (final → fim)   impacto, acorde final aberto e cauda

Marcas em src/ReelProdutorViral/linha.json (as mesmas usadas pelas cenas).

Uso: python3 scripts/gerar_trilha_viral.py <linha.json> <saida.wav>
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

from gerar_audio import SR, add, env_adsr, impact, kick, one_pole_lowpass, riser, save, soft_saw, t_axis

rng = np.random.default_rng(21)

# I–V–vi–IV em Ré: (raiz do baixo, tríade)
ACORDES = [
    (73.42, [293.66, 369.99, 440.0]),
    (55.00, [277.18, 329.63, 440.0]),
    (61.74, [293.66, 369.99, 493.88]),
    (49.00, [293.66, 392.0, 493.88]),
]
MELODIA = [  # 8 colcheias por compasso
    [587.33, 0, 739.99, 587.33, 880.0, 0, 739.99, 659.26],
    [554.37, 0, 659.26, 554.37, 880.0, 0, 659.26, 554.37],
    [587.33, 0, 739.99, 587.33, 987.77, 0, 880.0, 739.99],
    [587.33, 0, 783.99, 739.99, 659.26, 0, 587.33, 493.88],
]


def ruido(dur):
    return rng.normal(0, 1, len(t_axis(dur)))


def passa_alta(x, fc):
    return x - one_pole_lowpass(x, fc)


def palma():
    t = t_axis(0.3)
    s = np.zeros_like(t)
    for d in (0.0, 0.01, 0.022):
        i = int(d * SR)
        s[i:] += passa_alta(ruido(0.3)[: len(t) - i], 1000) * np.exp(-t[: len(t) - i] * 26)
    return one_pole_lowpass(s, 6000) * 0.55


def caixa():
    t = t_axis(0.18)
    corpo = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
    return (passa_alta(ruido(0.18), 1500) * np.exp(-t * 22) * 0.6 + corpo * 0.4) * 0.8


def chimbal(aberto=False):
    d = 0.22 if aberto else 0.05
    t = t_axis(d)
    return passa_alta(ruido(d), 7000) * np.exp(-t * (14 if aberto else 80)) * 0.3


def lead(f, dur=0.24):
    t = t_axis(dur)
    s = soft_saw(f, dur, 8) + 0.5 * soft_saw(f * 2, dur, 4)
    s = one_pole_lowpass(s, 2500 + 4000 * np.exp(-t * 16))
    return s * np.exp(-t * 9) * np.minimum(1, t / 0.003)


def stab(freqs, dur=0.2):
    t = t_axis(dur)
    s = sum(soft_saw(f, dur, 8) for f in freqs)
    return one_pole_lowpass(s, 3200) * np.exp(-t * 14) * np.minimum(1, t / 0.002)


def main() -> None:
    linha = json.loads(Path(sys.argv[1]).read_text())
    out = Path(sys.argv[2])
    fps = linha["fps"]
    beat = 60 / linha["bpm"]
    bar = 4 * beat
    m = {k: v / fps for k, v in linha["marcas"].items()}
    total = linha["total"] / fps + 0.5
    buf = np.zeros(int(total * SR))

    # ---- intro ----
    add(buf, impact(), 0.0, 0.5)
    pad = sum(soft_saw(f, m["drop"], 6) for f in ACORDES[0][1])
    add(buf, one_pole_lowpass(pad, 500 + 1500 * np.linspace(0, 1, len(pad)) ** 2) * env_adsr(len(pad), 0.05, 0.05), 0.0, 0.05)
    t = 1.0
    passo = beat / 4
    while t < m["drop"] - 0.06:  # rufar acelerando
        add(buf, caixa(), t, 0.2 + 0.4 * (t - 1.0) / (m["drop"] - 1.0))
        t += passo
        passo = max(beat / 8, passo * 0.93)
    add(buf, riser(m["drop"]), 0.0, 0.25)

    # ---- grooves ----
    def groove(ini, fim, oitava=1.0, com_bumbo=True):
        n = int(round((fim - ini) / bar))
        for b in range(n):
            t0 = ini + b * bar
            raiz, triade = ACORDES[b % 4]
            for k in range(4):
                tb = t0 + k * beat
                if com_bumbo:
                    add(buf, kick(), tb, 0.85)
                if k % 2:
                    add(buf, palma(), tb, 0.7)
                add(buf, chimbal(aberto=True), tb + beat / 2, 0.5)
                for q in range(4):
                    add(buf, chimbal(), tb + q * beat / 4, 0.35)
                # baixo em colcheias com "pump" (abaixa logo após o bumbo)
                for h in range(2):
                    tt = t_axis(beat / 2)
                    pump = np.minimum(1, tt / 0.09) if h == 0 and com_bumbo else np.ones_like(tt)
                    add(buf, np.sin(2 * np.pi * raiz * tt) * pump * np.exp(-tt * 3), tb + h * beat / 2, 0.32)
                add(buf, stab(triade), tb + beat / 2, 0.06)
            for e, f in enumerate(MELODIA[b % 4]):
                if f:
                    add(buf, lead(f * oitava), t0 + e * beat / 2, 0.045)

    groove(m["drop"], m["quebra"])
    # ---- quebra ----
    pad = sum(soft_saw(f, m["drop2"] - m["quebra"], 6) for f in ACORDES[3][1])
    add(buf, one_pole_lowpass(pad, 400 + 3000 * np.linspace(0, 1, len(pad)) ** 2), m["quebra"], 0.05)
    for k in range(int((m["drop2"] - m["quebra"]) / (beat / 2))):
        add(buf, palma(), m["quebra"] + k * beat / 2, 0.25 + 0.03 * k)
    add(buf, riser(m["drop2"] - m["quebra"]), m["quebra"], 0.35)
    add(buf, impact(), m["drop2"], 0.5)
    groove(m["drop2"], m["final"], oitava=2.0)

    # ---- final ----
    add(buf, impact(), m["final"], 0.7)
    add(buf, kick(), m["final"], 1.0)
    fim = total - m["final"]
    acorde = [146.83, 220.0, 293.66, 369.99, 440.0, 587.33]
    s = sum(soft_saw(f, fim, 6) for f in acorde)
    add(buf, one_pole_lowpass(s, 2600) * env_adsr(len(s), 0.02, fim * 0.8), m["final"], 0.035)
    tt = t_axis(fim)
    add(buf, np.sin(2 * np.pi * 73.42 * tt) * np.exp(-tt * 0.8), m["final"], 0.3)
    for k in range(8):  # chimbal leve até o fim
        add(buf, chimbal(), m["final"] + bar + k * beat / 2, 0.25)

    fo = int(1.2 * SR)
    buf[-fo:] *= np.linspace(1, 0, fo)
    save(out, buf, -1.0)
    print("ok", out)


if __name__ == "__main__":
    main()
