"""Trilha em pagode de viola para o Reels do Dia do Produtor Rural.

Sintetizada (viola de cordas duplas, Karplus-Strong). Mi maior, 135 BPM.
Batida "recortada" do pagode de viola: em cada 2 tempos (8 semicolcheias)
os acentos caem em 3+3+2 (posições 0, 3 e 6), com o bordão no tempo forte.

início   viola sozinha: repique de abertura e a batida recortada
baixo    entra o baixo (tônica e quinta)
ritmo    violão de base dobrando a batida e pandeiro leve
data     solo de viola em terças (repiques) por cima da batida
cheio    batida mais forte e solo uma oitava acima
final    o "pa-ra-pá" tradicional e o acorde soando até o fim

O andamento é escolhido para o final cair exatamente no começo de um
compasso (aqui: 640 quadros = 12 compassos a 135 BPM).

Uso: python3 scripts/gerar_trilha_pagode.py <linha.json> <saida.wav>
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

from gerar_audio import SR, add, env_adsr, one_pole_lowpass, save, soft_saw, t_axis
from gerar_trilha_campo import bumbo, corda, ruido
from gerar_trilha_viola import ESCALA, viola

BPM = 135

# acordes da viola (cordas graves -> agudas) e do baixo
ACORDES = {
    "E": ([82.41, 123.47, 164.81, 207.65, 246.94, 329.63], 82.41, 123.47),
    "B": ([123.47, 185.00, 246.94, 311.13, 369.99, 440.00], 123.47, 185.00),  # B7
    "A": ([110.00, 164.81, 220.00, 277.18, 329.63], 110.00, 164.81),
}
PROGRESSAO = ["E", "B", "E", "A"]

# batida recortada: (posição em semicolcheias dentro de 2 tempos, tipo, força)
RECORTADO = [(0, "bordao", 1.0), (2, "cima", 0.45), (3, "baixo", 0.9), (5, "cima", 0.45), (6, "baixo", 0.85), (7, "cima", 0.4)]

# solos em terças: 16 semicolcheias por compasso (índices da ESCALA; 0 = pausa)
REPIQUE_ABERTURA = [13, 12, 11, 12, 10, 0, 11, 10, 9, 0, 10, 9, 8, 0, 7, 0]
SOLO = [
    [10, 0, 11, 12, 11, 0, 10, 0, 12, 11, 10, 0, 9, 0, 10, 0],
    [11, 0, 12, 13, 12, 0, 11, 0, 9, 10, 11, 0, 9, 0, 8, 0],
    [10, 0, 11, 12, 13, 12, 11, 0, 10, 0, 11, 10, 9, 0, 7, 0],
    [8, 0, 9, 10, 9, 0, 8, 0, 6, 7, 8, 0, 10, 0, 0, 0],
]


def pandeiro(forte=False):
    t = t_axis(0.09)
    s = ruido(len(t))
    s = one_pole_lowpass(s - one_pole_lowpass(s, 4000), 8000)
    return s * np.exp(-t * (35 if forte else 60)) * (0.35 if forte else 0.2)


def golpe(cordas, tipo, forca, oitava_ok=True):
    """Um golpe de mão direita na viola: para baixo (grave->agudo), para cima ou só o bordão."""
    if tipo == "bordao":
        return [(0.0, cordas[0] * (2 if oitava_ok else 1), 0.9 * forca, 1.4)]
    seq = cordas[1:] if tipo == "baixo" else cordas[::-1][:4]
    return [(k * 0.008, f, 0.55 * forca, 0.7) for k, f in enumerate(seq)]


def main() -> None:
    linha = json.loads(Path(sys.argv[1]).read_text())
    out = Path(sys.argv[2])
    fps = linha["fps"]
    beat = 60 / BPM
    bar = 4 * beat
    semi = beat / 4
    m = {k: v / fps for k, v in linha["marcas"].items()}
    total = linha["total"] / fps + 0.4
    buf = np.zeros(int(total * SR))
    n_bars = int(round(m["final"] / bar))
    assert abs(n_bars * bar - m["final"]) < 0.02, "o final deve cair no início de um compasso"

    cache: dict[tuple, np.ndarray] = {}

    def nota(f, dur, forca=1.0):
        chave = (round(f, 2), round(dur, 2))
        if chave not in cache:
            cache[chave] = viola(f, dur)
        return cache[chave] * forca

    for b in range(n_bars):
        t0 = b * bar
        nome = PROGRESSAO[b % 4]
        cordas, raiz, quinta = ACORDES[nome]
        cheio = t0 >= m["cheio"] - 0.01
        solo = t0 >= m["data"] - 0.01
        # 1º compasso: só o repique de abertura
        if b == 0:
            for e, idx in enumerate(REPIQUE_ABERTURA):
                if idx:
                    tb = e * semi
                    add(buf, nota(ESCALA[idx], 1.2), tb, 0.15)
                    add(buf, nota(ESCALA[idx - 2], 1.2), tb + 0.005, 0.11)
            continue
        # batida recortada (2 vezes por compasso)
        forca_batida = 0.75 if solo else 1.0  # recua um pouco quando a viola sola
        if t0 < m["baixo"] - 0.01:
            forca_batida = 1.6  # viola sozinha: compensa a falta do baixo
        for meio in (0, 2):
            for pos, tipo, forca in RECORTADO:
                tb = t0 + meio * beat + pos * semi
                for dt, f, g, dur in golpe(cordas, tipo, forca):
                    add(buf, nota(f, dur), tb + dt, 0.09 * g * forca_batida * (1.15 if cheio else 1.0))
        # baixo: tônica no 1, quinta no 3
        if t0 >= m["baixo"] - 0.01:
            for k, f in ((0, raiz), (2, quinta)):
                tt = t_axis(beat * 1.8)
                corpo = np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)
                add(buf, corpo * np.exp(-tt * 3) * np.minimum(1, tt / 0.006), t0 + k * beat, 0.14)
        # violão de base e pandeiro
        if t0 >= m["ritmo"] - 0.01:
            for meio in (0, 2):
                for pos, tipo, forca in RECORTADO[1:]:
                    tb = t0 + meio * beat + pos * semi + 0.004
                    for j, f in enumerate(cordas[1:4]):
                        add(buf, corda(f, 0.4, 0.5, 0.99), tb + j * 0.007, 0.022 * forca)
            for k in range(16):
                add(buf, pandeiro(forte=k % 4 == 0), t0 + k * semi, 0.25 if k % 4 else 0.45)
            add(buf, bumbo(), t0, 0.2)
            add(buf, bumbo(), t0 + 2 * beat, 0.15)
        # solo de viola em terças
        if solo:
            frase = SOLO[b % 4]
            oit = 2.0 if cheio and b % 2 == 1 else 1.0
            for e, idx in enumerate(frase):
                if idx:
                    tb = t0 + e * semi
                    add(buf, nota(ESCALA[idx] * oit, 1.0), tb, 0.13)
                    add(buf, nota(ESCALA[idx - 2] * oit, 1.0), tb + 0.005, 0.095)
        if cheio:  # cama suave para o clímax
            s = sum(soft_saw(f * 2, bar + 0.3, 4) for f in cordas[1:4])
            add(buf, one_pole_lowpass(s, 1000) * env_adsr(len(s), 0.4, 0.4), t0, 0.014)

    # final: "pa-ra-pá" e acorde soando
    fim = total - m["final"]
    cordas = ACORDES["E"][0] + [415.30, 493.88, 659.25]
    for k, (dt, g, dur) in enumerate([(0.0, 1.0, 0.5), (beat * 0.75, 1.0, 0.5), (beat * 1.5, 1.1, fim - beat * 1.5)]):
        for j, f in enumerate(sorted(set(cordas))):
            add(buf, viola(f * (2 if f < 100 else 1), dur, 1.0, 0.9993 if k == 2 else 0.997), m["final"] + dt + j * 0.012, 0.06 * g)
    tt = t_axis(fim - beat * 1.5)
    add(buf, np.sin(2 * np.pi * 82.41 * tt) * np.exp(-tt * 0.8), m["final"] + beat * 1.5, 0.2)
    add(buf, bumbo(), m["final"] + beat * 1.5, 0.4)
    s = sum(soft_saw(f, fim, 5) for f in (164.81, 246.94, 329.63, 415.30))
    add(buf, one_pole_lowpass(s, 1200) * env_adsr(len(s), 0.5, fim * 0.6), m["final"] + beat * 1.5, 0.02)

    # amacia os agudos (cordas metálicas + pandeiro cansam no celular)
    buf = 0.6 * buf + 0.4 * one_pole_lowpass(buf, 2800)
    fo = int(2.0 * SR)
    buf[-fo:] *= np.linspace(1, 0, fo) ** 1.4
    save(out, buf, -1.5)
    print("ok", out)


if __name__ == "__main__":
    main()
