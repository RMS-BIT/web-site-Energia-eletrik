import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Mesma Montserrat variável do outro anúncio, declarada com o eixo completo
// (100–900) para usar pesos finos nos rótulos.
export const FONTE = "Montserrat Var";

loadFont({
  family: FONTE,
  url: staticFile("fontes/Montserrat-latin.woff2"),
  weight: "100 900",
  format: "woff2",
});

// Paleta da SOLVER: azul e branco (tirada dos logos enviados).
export const COR = {
  azul: "#1F5FD6",
  azulVivo: "#3D8BFF",
  azulClaro: "#9CC2FF",
  marinho: "#061733",
  gelo: "#F4F6FA",
  branco: "#FFFFFF",
} as const;

export const FPS = 30;
export const LARGURA = 1080;
export const ALTURA = 1920;

// Faixas cobertas pela interface do Instagram em Reels/Stories.
export const SEGURA = { topo: 250, base: 1480, lateral: 90 } as const;
