// Linha do tempo do anúncio, a 30 fps. Todos os cortes caem em múltiplos
// de 15 quadros (1 tempo a 120 BPM), alinhados com scripts/gerar_audio.py.

export const FPS = 30;

export type Entrada = "punch" | "chicote" | "zoom";

export type Cena = {
  readonly id: string;
  readonly clipe: string;
  readonly inicio: number; // quadro na timeline
  readonly duracao: number; // quadros
  readonly inicioNoClipe: number; // segundos dentro do clipe
  readonly velocidade?: number;
  readonly zoomDe: number;
  readonly zoomPara: number;
  readonly entrada: Entrada;
};

export const CENAS: readonly Cena[] = [
  { id: "gancho", clipe: "clips/6509.mp4", inicio: 0, duracao: 90, inicioNoClipe: 0, zoomDe: 1.18, zoomPara: 1.04, entrada: "zoom" },
  { id: "servico", clipe: "clips/6510.mp4", inicio: 90, duracao: 90, inicioNoClipe: 0, zoomDe: 1.0, zoomPara: 1.12, entrada: "punch" },
  { id: "etapas", clipe: "clips/6510.mp4", inicio: 180, duracao: 90, inicioNoClipe: 4.0, zoomDe: 1.1, zoomPara: 1.0, entrada: "chicote" },
  { id: "equipe", clipe: "clips/6510.mp4", inicio: 270, duracao: 120, inicioNoClipe: 8.5, zoomDe: 1.0, zoomPara: 1.08, entrada: "punch" },
  { id: "tecnologia", clipe: "clips/6519.mp4", inicio: 390, duracao: 75, inicioNoClipe: 0, velocidade: 0.75, zoomDe: 1.05, zoomPara: 1.2, entrada: "chicote" },
  { id: "precisao", clipe: "clips/6518.mp4", inicio: 465, duracao: 120, inicioNoClipe: 0, zoomDe: 1.12, zoomPara: 1.0, entrada: "punch" },
  { id: "seguranca", clipe: "clips/6510.mp4", inicio: 585, duracao: 75, inicioNoClipe: 14.0, zoomDe: 1.0, zoomPara: 1.1, entrada: "chicote" },
];

export const CARTELA_INICIO = 660;
export const DURACAO_TOTAL = 810;

// Efeitos sonoros posicionados nos cortes.
export const WHOOSHES = CENAS.filter((c) => c.entrada === "chicote").map(
  (c) => c.inicio - 10,
);
export const IMPACTOS = [90, CARTELA_INICIO];
