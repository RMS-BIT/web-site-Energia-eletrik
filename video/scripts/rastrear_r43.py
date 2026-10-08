"""Rastreamento de movimento (OpenCV) para os elementos HUD do vídeo de 43 s.

Para cada ponto nomeado: detecta cantos ao redor do ponto no quadro-âncora
e os segue com fluxo óptico Lucas-Kanade (com checagem ida-e-volta), para
frente e para trás. A posição do ponto é a mediana dos deslocamentos; a
escala relativa vem da razão mediana das distâncias entre os cantos.

Modo "nuvem": devolve, por quadro, os cantos individuais de uma região
(para os pontos de mapeamento do scan).

Saída: src/Roteiro43/rastreio.json

Uso: python scripts/rastrear_r43.py   (precisa de opencv-python-headless)
"""

from __future__ import annotations

import json
from pathlib import Path

import cv2
import numpy as np

PLANOS = Path("public/planos")
SAIDA = Path("src/Roteiro43/rastreio.json")

LK = dict(winSize=(25, 25), maxLevel=4, criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 30, 0.01))

# plano -> pontos {nome: (quadro_ancora, x, y, raio)}
# (coordenadas no quadro 1080x1920, marcadas sobre quadros de referência)
PONTOS: dict[str, dict[str, tuple[int, float, float, float]]] = {
    "p1_gancho": {
        "tela": (60, 612, 1100, 110),
        "cantoA": (60, 530, 1060, 60),
        "cantoB": (60, 700, 1165, 60),
        "teclado": (60, 612, 1215, 60),
    },
    "p2c_interesse": {"alvo": (20, 600, 1000, 120)},
    "p3b_comandos": {"ok": (30, 558, 1517, 70), "tela": (30, 620, 1175, 120)},
    "p4a_equipamento": {
        "tela": (60, 545, 925, 160),
        "rotulo": (60, 683, 570, 60),
        "ok": (60, 545, 1430, 80),
    },
    "p5a_aproxima": {"aparelho": (30, 660, 1000, 80), "alvo": (30, 385, 800, 120)},
    "p5b_sensor": {"alvo": (30, 585, 470, 130), "aparelho": (30, 400, 1100, 110)},
    "p6_leitura": {"caixa": (100, 424, 925, 150), "dados": (100, 551, 650, 110)},
}
# plano -> nuvens {nome: (quadro_ancora, x0, y0, x1, y1, max_cantos)}
NUVENS: dict[str, dict[str, tuple[int, float, float, float, float, int]]] = {
    "p2b_detalhe": {"malha": (0, 0, 250, 1080, 1760, 110)},
    "p5b_sensor": {"pontos": (30, 400, 340, 760, 780, 28)},
}


def ler(plano: str, escala: float) -> list[np.ndarray]:
    cap = cv2.VideoCapture(str(PLANOS / f"{plano}.mp4"))
    quadros = []
    while True:
        ok, f = cap.read()
        if not ok:
            break
        g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
        if escala != 1:
            g = cv2.resize(g, None, fx=escala, fy=escala, interpolation=cv2.INTER_AREA)
        quadros.append(g)
    return quadros


def cantos(img: np.ndarray, cx: float, cy: float, r: float, n: int = 60) -> np.ndarray | None:
    mask = np.zeros_like(img)
    cv2.circle(mask, (int(cx), int(cy)), int(r), 255, -1)
    pts = cv2.goodFeaturesToTrack(img, maxCorners=n, qualityLevel=0.005, minDistance=4, mask=mask)
    return pts


def passo(a: np.ndarray, b: np.ndarray, pts: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    nxt, st, _ = cv2.calcOpticalFlowPyrLK(a, b, pts, None, **LK)
    back, st2, _ = cv2.calcOpticalFlowPyrLK(b, a, nxt, None, **LK)
    fb = np.linalg.norm((pts - back).reshape(-1, 2), axis=1)
    bom = (st.ravel() == 1) & (st2.ravel() == 1) & (fb < 1.0)
    return nxt, bom


def seguir_ponto(q: list[np.ndarray], ancora: int, x: float, y: float, r: float) -> list[list[float]]:
    n = len(q)
    res: list[list[float] | None] = [None] * n
    res[ancora] = [x, y, 1.0]
    for direcao in (1, -1):
        cx, cy, s = x, y, 1.0
        pts = cantos(q[ancora], cx, cy, r)
        i = ancora
        while 0 <= i + direcao < n:
            j = i + direcao
            if pts is None or len(pts) < 6:
                pts = cantos(q[i], cx, cy, r * s)
                if pts is None:
                    res[j] = [cx, cy, s]
                    i = j
                    continue
            nxt, bom = passo(q[i], q[j], pts)
            a, b = pts[bom].reshape(-1, 2), nxt[bom].reshape(-1, 2)
            if len(a) >= 3:
                d = np.median(b - a, axis=0)
                cx, cy = cx + d[0], cy + d[1]
                ia, ib = np.triu_indices(len(a), 1)
                da = np.linalg.norm(a[ia] - a[ib], axis=1)
                db = np.linalg.norm(b[ia] - b[ib], axis=1)
                ok = da > 8
                if ok.sum() > 3:
                    s *= float(np.clip(np.median(db[ok] / da[ok]), 0.9, 1.1))
                pts = b.reshape(-1, 1, 2)
            else:
                pts = None
            res[j] = [cx, cy, s]
            i = j
    return [[round(float(v), 2) for v in p] for p in res]  # type: ignore[union-attr]


def seguir_nuvem(q: list[np.ndarray], ancora: int, x0: float, y0: float, x1: float, y1: float, m: int):
    mask = np.zeros_like(q[ancora])
    mask[int(y0) : int(y1), int(x0) : int(x1)] = 255
    pts = cv2.goodFeaturesToTrack(q[ancora], maxCorners=m, qualityLevel=0.01, minDistance=14, mask=mask)
    n = len(q)
    k = len(pts)
    res = np.full((n, k, 2), np.nan)
    res[ancora] = pts.reshape(-1, 2)
    for direcao in (1, -1):
        atual = pts.copy()
        vivo = np.ones(k, bool)
        i = ancora
        while 0 <= i + direcao < n:
            j = i + direcao
            nxt, bom = passo(q[i], q[j], atual)
            vivo &= bom
            atual = nxt
            res[j][vivo] = nxt.reshape(-1, 2)[vivo]
            i = j
    return [[None if np.isnan(p[0]) else [round(float(p[0]), 1), round(float(p[1]), 1)] for p in f] for f in res]


def main() -> None:
    saida: dict = {}
    for plano in sorted(set(PONTOS) | set(NUVENS)):
        q = ler(plano, 0.5)  # rastreia em meia resolução
        d: dict = {"quadros": len(q)}
        for nome, (anc, x, y, r) in PONTOS.get(plano, {}).items():
            tr = seguir_ponto(q, anc, x / 2, y / 2, r / 2)
            d[nome] = [[round(p[0] * 2, 1), round(p[1] * 2, 1), round(p[2], 3)] for p in tr]
        for nome, (anc, x0, y0, x1, y1, m) in NUVENS.get(plano, {}).items():
            nv = seguir_nuvem(q, anc, x0 / 2, y0 / 2, x1 / 2, y1 / 2, m)
            d[nome] = [[None if p is None else [p[0] * 2, p[1] * 2] for p in f] for f in nv]
        saida[plano] = d
        print(plano, "ok", len(q), "quadros")
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(saida, separators=(",", ":")))


if __name__ == "__main__":
    main()
