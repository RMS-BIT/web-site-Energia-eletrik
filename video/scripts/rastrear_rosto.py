"""Rastreia o centro do rosto (Haar cascade do OpenCV) para o reenquadramento.

Amostra 1 a cada 3 quadros, interpola e suaviza (janela de ~1,5 s) para o
movimento da "câmera" ficar natural. Saída em coordenadas normalizadas (0–1).

Uso: python scripts/rastrear_rosto.py <video> <saida.json>
"""

from __future__ import annotations

import json
import sys

import cv2
import numpy as np


def main() -> None:
    cap = cv2.VideoCapture(sys.argv[1])
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    amostras: dict[int, tuple[float, float, float]] = {}
    i = 0
    while True:
        ok = cap.grab()
        if not ok:
            break
        if i % 3 == 0:
            ok, f = cap.retrieve()
            if ok:
                h, w = f.shape[:2]
                peq = cv2.resize(f, (540, int(540 * h / w)))
                g = cv2.equalizeHist(cv2.cvtColor(peq, cv2.COLOR_BGR2GRAY))
                rost = cascade.detectMultiScale(g, scaleFactor=1.1, minNeighbors=6, minSize=(50, 50))
                if len(rost):
                    x, y, rw, rh = max(rost, key=lambda r: r[2] * r[3])
                    amostras[i] = ((x + rw / 2) / 540, (y + rh / 2) / peq.shape[0], rh / peq.shape[0])
        i += 1
    total = i
    idx = np.array(sorted(amostras))
    vals = np.array([amostras[k] for k in idx])
    t = np.arange(total)
    serie = np.stack([np.interp(t, idx, vals[:, c]) for c in range(3)], axis=1)
    # remove outliers e suaviza
    med = np.median(serie, axis=0)
    serie = np.clip(serie, med - 0.12, med + 0.12)
    jan = int(fps * 1.5) | 1
    ker = np.ones(jan) / jan
    pad = np.pad(serie, ((jan // 2, jan // 2), (0, 0)), mode="edge")
    suave = np.stack([np.convolve(pad[:, c], ker, mode="valid") for c in range(3)], axis=1)
    json.dump(
        {"fps": fps, "quadros": total, "deteccoes": len(idx), "rosto": [[round(float(a), 4) for a in r] for r in suave]},
        open(sys.argv[2], "w"),
    )
    print("quadros", total, "detecções", len(idx), "mediana", med.round(3))


if __name__ == "__main__":
    main()
