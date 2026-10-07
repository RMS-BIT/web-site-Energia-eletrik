import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Montserrat variável (pesos 500–900), embutida em public/fontes para o
// render não depender de rede. Licença SIL OFL 1.1.
export const FONTE = "Montserrat";

loadFont({
  family: FONTE,
  url: staticFile("fontes/Montserrat-latin.woff2"),
  weight: "500 900",
  format: "woff2",
});

// Paleta tirada do próprio material: azul-marinho de fundo e o laranja
// dos uniformes como cor de destaque.
export const CORES = {
  marinho: "#0B1F33",
  marinhoClaro: "#123456",
  laranja: "#FF6B1A",
  laranjaClaro: "#FF9A5C",
  branco: "#FFFFFF",
  azulTecnico: "#5BB4FF",
} as const;

// Área segura para Reels/Stories (1080x1920): fora das faixas cobertas
// pela interface do Instagram no topo e no rodapé.
export const AREA_SEGURA = {
  topo: 250,
  base: 1480,
  lateral: 90,
} as const;
