"""Recorta a pessoa do vídeo (remove o fundo) com Robust Video Matting (RVM).

Não gera nem altera pessoas: só calcula a máscara (alfa) de cada quadro e
salva o próprio vídeo com fundo transparente (WebM VP9 com alfa), para o
Remotion compor o orador sobre mapas, estradas etc.

Requisitos (fora do repositório):
  pip install onnxruntime numpy opencv-python-headless
  modelo: rvm_mobilenetv3_fp32.onnx
  (https://github.com/PeterL1n/RobustVideoMatting/releases/tag/v1.0.0)

Uso:
  python scripts/recortar_pessoa.py <entrada.mp4> <modelo.onnx> <saida.webm> [largura] [segundos_max]
"""

from __future__ import annotations

import subprocess
import sys
import time

import cv2
import numpy as np
import onnxruntime as ort


def main() -> None:
    entrada, modelo, saida = sys.argv[1], sys.argv[2], sys.argv[3]
    largura = int(sys.argv[4]) if len(sys.argv) > 4 else 1080
    seg_max = float(sys.argv[5]) if len(sys.argv) > 5 else 0.0

    info = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate", "-of", "csv=p=0", entrada],
        capture_output=True, text=True, check=True,
    ).stdout.strip().split(",")
    w0, h0 = int(info[0]), int(info[1])
    num, den = (int(x) for x in info[2].split("/"))
    fps = num / den
    w = largura
    h = int(round(h0 * w / w0 / 2) * 2)

    ler = ["ffmpeg", "-loglevel", "error", "-i", entrada]
    if seg_max:
        ler += ["-t", str(seg_max)]
    ler += ["-vf", f"scale={w}:{h}:flags=lanczos", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    leitor = subprocess.Popen(ler, stdout=subprocess.PIPE)
    escritor = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{w}x{h}", "-r", f"{num}/{den}", "-i", "-",
         "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "28", "-row-mt", "1", "-deadline", "good", "-cpu-used", "5",
         "-auto-alt-ref", "0", saida],
        stdin=subprocess.PIPE,
    )

    sess = ort.InferenceSession(modelo, providers=["CPUExecutionProvider"])
    rec = [np.zeros((1, 1, 1, 1), np.float32)] * 4
    ds = np.array([0.25], np.float32)  # resolução interna = 1/4 (bom para retrato)
    n = 0
    t0 = time.time()
    tam = w * h * 3
    while True:
        buf = leitor.stdout.read(tam)
        if len(buf) < tam:
            break
        rgb = np.frombuffer(buf, np.uint8).reshape(h, w, 3)
        src = (rgb.astype(np.float32) / 255.0).transpose(2, 0, 1)[None]
        fgr, pha, *rec = sess.run(None, {"src": src, "r1i": rec[0], "r2i": rec[1], "r3i": rec[2], "r4i": rec[3], "downsample_ratio": ds})
        a = np.clip(pha[0, 0], 0, 1)
        # bordas limpas: aperta 1 px a máscara (sem halo do fundo) e, nas
        # bordas semitransparentes, usa a cor de primeiro plano estimada pelo
        # RVM (descontaminada da parede/fundo) em vez da cor original
        a = np.minimum(a, cv2.erode(a, np.ones((3, 3), np.float32)) * 0.6 + a * 0.4)
        a = cv2.GaussianBlur(a, (0, 0), 0.6)
        fg = np.clip(fgr[0].transpose(1, 2, 0) * 255, 0, 255)
        borda = (a < 0.97)[..., None]
        cor = np.where(borda, fg, rgb.astype(np.float32)).astype(np.uint8)
        rgba = np.dstack([cor, (a * 255).astype(np.uint8)])
        escritor.stdin.write(rgba.tobytes())
        n += 1
        if n % 100 == 0:
            print(f"{n} quadros ({n / (time.time() - t0):.1f} q/s)", flush=True)
    escritor.stdin.close()
    escritor.wait()
    leitor.wait()
    print(f"ok: {n} quadros, {fps:.3f} fps -> {saida}")


if __name__ == "__main__":
    main()
