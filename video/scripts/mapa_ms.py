"""Gera os contornos SVG de Mato Grosso e Mato Grosso do Sul para o mapa.

Fonte dos contornos: giuliano-oliveira/geodata-br-states (GeoJSON dos
perímetros estaduais brasileiros). Projeção equiretangular com correção de
latitude, simplificação Douglas-Peucker.

Uso: python3 scripts/mapa_ms.py <br_mt.json> <br_ms.json>
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

LARGURA, ALTURA, MARGEM = 860, 1180, 20
CUIABA = (-56.0949, -15.5989)  # lon, lat


def aneis(geo: dict) -> list[list[tuple[float, float]]]:
    g = geo["features"][0]["geometry"] if "features" in geo else geo["geometry"]
    polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    return [[(p[0], p[1]) for p in poly[0]] for poly in polys]


def dp(pts, eps):
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    n = math.hypot(dx, dy) or 1e-12
    dmax, idx = 0.0, 0
    for i in range(1, len(pts) - 1):
        d = abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / n
        if d > dmax:
            dmax, idx = d, i
    if dmax > eps:
        return dp(pts[: idx + 1], eps)[:-1] + dp(pts[idx:], eps)
    return [pts[0], pts[-1]]


def main() -> None:
    mt = aneis(json.load(open(sys.argv[1])))
    ms = aneis(json.load(open(sys.argv[2])))
    todos = [p for a in mt + ms for p in a]
    lat0 = sum(p[1] for p in todos) / len(todos)
    k = math.cos(math.radians(lat0))
    xs = [p[0] * k for p in todos]
    ys = [-p[1] for p in todos]
    escala = min((LARGURA - 2 * MARGEM) / (max(xs) - min(xs)), (ALTURA - 2 * MARGEM) / (max(ys) - min(ys)))
    ox, oy = min(xs), min(ys)

    def proj(p):
        return ((p[0] * k - ox) * escala + MARGEM, (-p[1] - oy) * escala + MARGEM)

    def caminho(anel_lista):
        partes = []
        for anel in anel_lista:
            if len(anel) < 20:
                continue
            todos = [proj(p) for p in anel]
            meio = len(todos) // 2  # anel fechado: simplifica em duas metades
            pts = dp(todos[: meio + 1], 0.9)[:-1] + dp(todos[meio:], 0.9)
            partes.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + "Z")
        return "".join(partes)

    cx, cy = proj(CUIABA)
    def centro(anel_lista):
        pts = [proj(p) for a in anel_lista for p in a]
        return (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))
    out = {
        "largura": LARGURA,
        "altura": ALTURA,
        "mt": caminho(mt),
        "ms": caminho(ms),
        "centroMT": centro(mt),
        "centroMS": centro(ms),
        "cuiaba": [round(cx, 1), round(cy, 1)],
        "fonte": "Contornos: giuliano-oliveira/geodata-br-states (GeoJSON). Cuiabá: 15°36'S 56°06'W.",
    }
    Path("src/DivisaoMS/mapa.json").write_text(json.dumps(out))
    print("ok", len(out["mt"]), len(out["ms"]), out["cuiaba"], out["centroMT"], out["centroMS"])


if __name__ == "__main__":
    main()
