import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { FONTE } from "../AnuncioImageador/tema";

export { FONTE };
export const MONO = "Plex Mono";

loadFont({
  family: MONO,
  url: staticFile("fontes/IBMPlexMono-500-latin.woff2"),
  weight: "500",
  format: "woff2",
});

// Preto, cinzas, branco e um único destaque: o azul da SOLVER.
export const C = {
  preto: "#07090C",
  grafite: "#14181E",
  cinza: "#8B929C",
  cinzaClaro: "#C8CDD4",
  branco: "#FFFFFF",
  destaque: "#3D8BFF",
} as const;

export const SEGURA = { topo: 250, base: 1480, lateral: 90 } as const;
