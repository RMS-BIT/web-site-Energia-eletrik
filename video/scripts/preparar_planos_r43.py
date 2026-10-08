"""Corta os planos do vídeo "Roteiro Master 43s" a partir dos brutos.

Cada plano vira um MP4 próprio (1080x1920, 30 fps, sem áudio), já na
duração final. Planos com velocidade < 1 usam interpolação de movimento
(minterpolate) para câmera lenta suave. Assim o rastreamento
(scripts/rastrear_r43.py) e o Remotion trabalham quadro a quadro.

Brutos esperados em public/clips/: r1.mp4 (1007_1), r11.mp4 (1007_11), 6518.mp4,
r12.mp4 (1007_12).

Uso: python3 scripts/preparar_planos_r43.py [nome_do_plano ...]
"""

from __future__ import annotations

import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

PASTA = Path("public/clips")
SAIDA = Path("public/planos")

# nome: (bruto, início em s, quadros de saída, velocidade)
PLANOS: dict[str, tuple[str, float, int, float]] = {
    "p1_gancho": ("r1", 1.9, 90, 1.0),
    "p2a_geral": ("r12", 0.0, 45, 1.0),
    "p2b_detalhe": ("r12", 1.7, 60, 1.0),
    "p2c_interesse": ("r1", 14.6, 45, 1.0),
    "p3a_tecnico": ("r12", 5.25, 75, 1.0),
    "p3b_comandos": ("r1", 5.6, 75, 1.0),
    "p4a_equipamento": ("r11", 1.2, 120, 0.45),
    "p4b_tela": ("r11", 3.05, 60, 1.0),
    "p5a_aproxima": ("6518", 0.3, 60, 1.0),
    "p5b_sensor": ("r12", 7.9, 240, 0.84),
    "p6_leitura": ("r1", 8.9, 210, 0.63),
    "p7a_tecnico": ("r1", 0.8, 30, 1.0),
    "p7b_maquina": ("r12", 2.2, 30, 1.0),
    "p7c_sensor": ("r12", 10.5, 30, 1.0),
    "p7d_equipamento": ("r11", 5.5, 30, 1.0),
    "p8_final": ("r1", 0.5, 90, 0.87),
}


def cortar(nome: str) -> str:
    bruto, inicio, quadros, vel = PLANOS[nome]
    dur_fonte = quadros / 30 * vel + 0.15
    filtros = "scale=1080:1920"
    if vel < 1:
        filtros = (
            f"setpts=PTS/{vel},minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,{filtros}"
        )
    cmd = [
        "ffmpeg", "-v", "error", "-y", "-ss", str(inicio), "-t", f"{dur_fonte:.3f}",
        "-i", str(PASTA / f"{bruto}.mp4"), "-vf", filtros, "-frames:v", str(quadros),
        "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p",
        "-r", "30", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
        "-movflags", "+faststart", str(SAIDA / f"{nome}.mp4"),
    ]
    subprocess.run(cmd, check=True)
    return nome


def main() -> None:
    SAIDA.mkdir(parents=True, exist_ok=True)
    nomes = sys.argv[1:] or list(PLANOS)
    with ThreadPoolExecutor(max_workers=4) as ex:
        for n in ex.map(cortar, nomes):
            print("ok", n)


if __name__ == "__main__":
    main()
