import { loadFont } from "@remotion/fonts";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONTE } from "../AnuncioImageador/tema";
import { clamp, ent } from "../Materia/comum";
import linha from "./linha.json";

// Reels "Dia do Produtor Rural" — versão equilibrada (padrão deputado), só
// com fotos reais do deputado. Cada foto entra grande e depois se encaixa
// num mural 2×2 que vai se completando; no final, o mural inteiro fica na
// tela com a logo. Ritmo calmo (uma frase por compasso de 90 BPM ≈ 2,7 s),
// luz dourada e partículas de luz. Trilha de violão (gerar_trilha_campo.py).
// Lei Estadual nº 2.141, de 28/08/2000 (DOE nº 5.338); autoria:
// zeteixeira.com (10/10/2017). Conferido em 09/10/2026.
// Fotos apenas enquadradas e reposicionadas (nenhuma alteração de pessoas).

const MANUSCRITA = "Dancing Script Var";
loadFont({
  family: MANUSCRITA,
  url: staticFile("fontes/DancingScript-var.ttf"),
  weight: "400 700",
  format: "truetype",
});

const M = linha.marcas;
export const CAMPO_DURACAO = linha.total;
const CENA = 80; // um compasso
const LOGO = "reel-produtor/logo-ze-verde.png";
const LOGO_PROP = 478 / 850;

const COR = {
  amarelo: "#F6D54A",
  branco: "#FFFFFF",
  verdeEscuro: "#1E6B3A",
  verdeNoite: "#0E3B22",
};
const SOMBRA = "0 3px 18px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.4)";

// ---------- mural 2×2 ----------
const GRADE = { x: 50, y: 500, w: 480, h: 520, gap: 20 };
const celula = (i: number) => ({
  x: GRADE.x + (i % 2) * (GRADE.w + GRADE.gap),
  y: GRADE.y + Math.floor(i / 2) * (GRADE.h + GRADE.gap),
  w: GRADE.w,
  h: GRADE.h,
});

type Foto = {
  src: string;
  foco: string;
  entra: number;
  grande: { w: number; h: number };
  focoGrande?: string;
};
// entra = quadro em que a foto aparece grande; ~52 quadros depois vai para o mural
const FOTOS: Foto[] = [
  {
    src: "reel-produtor/ze-por-do-sol.jpg",
    foco: "50% 28%",
    entra: 4,
    grande: { w: 700, h: 1000 },
    focoGrande: "50% 35%",
  },
  {
    src: "reel-produtor/ze-soja.jpg",
    foco: "55% 30%",
    entra: 160,
    grande: { w: 980, h: 620 },
  },
  {
    src: "reel-produtor/ze-gado.jpg",
    foco: "72% 25%",
    entra: 240,
    grande: { w: 980, h: 620 },
  },
  {
    src: "reel-produtor/ze-terere.jpg",
    foco: "45% 38%",
    entra: 320,
    grande: { w: 700, h: 1000 },
    focoGrande: "50% 40%",
  },
];
const SEGURA = 50; // quadros em destaque antes de ir para o mural
const VIAGEM = 26;

const FotoMural: React.FC<{ foto: Foto; i: number }> = ({ foto, i }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f - foto.entra;
  if (t < 0) return null;
  const aparece = spring({
    frame: t,
    fps,
    config: { damping: 18, stiffness: 90 },
  });
  const vai = spring({
    frame: t - SEGURA,
    fps,
    config: { damping: 17, stiffness: 80 },
    durationInFrames: VIAGEM,
  });
  const c = celula(i);
  const g = {
    w: foto.grande.w,
    h: foto.grande.h,
    x: (1080 - foto.grande.w) / 2,
    y: GRADE.y + (GRADE.h * 2 + GRADE.gap - foto.grande.h) / 2,
  };
  const x = interpolate(vai, [0, 1], [g.x, c.x]);
  const y = interpolate(vai, [0, 1], [g.y, c.y]);
  const w = interpolate(vai, [0, 1], [g.w, c.w]);
  const h = interpolate(vai, [0, 1], [g.h, c.h]);
  const assenta =
    vai > 0.98
      ? spring({
          frame: t - SEGURA - VIAGEM,
          fps,
          config: { damping: 10, stiffness: 160 },
        })
      : 0;
  const zoomLento = 1.02 + Math.min(1, t / 700) * 0.06;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: 24,
        overflow: "hidden",
        border: "6px solid #FFFFFF",
        boxShadow: `0 ${24 - 10 * vai}px ${60 - 25 * vai}px rgba(0,0,0,${0.5 - 0.15 * vai})`,
        opacity: Math.min(1, aparece * 1.6),
        transform: `scale(${interpolate(aparece, [0, 1], [0.86, 1]) * (1 + Math.sin(assenta * Math.PI) * 0.02)})`,
        zIndex: vai < 1 ? 10 : 1,
      }}
    >
      <Img
        src={staticFile(foto.src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition:
            vai < 0.5 && foto.focoGrande ? foto.focoGrande : foto.foco,
          filter: "saturate(1.08) contrast(1.04) sepia(0.06)",
          transform: `scale(${zoomLento})`,
        }}
      />
    </div>
  );
};

// espaços vazios do mural, que vão sendo preenchidos
const Vagas: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      {FOTOS.map((foto, i) => {
        const c = celula(i);
        const some = ent(f, foto.entra + SEGURA, foto.entra + SEGURA + VIAGEM);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c.x,
              top: c.y,
              width: c.w,
              height: c.h,
              borderRadius: 24,
              border: "2px dashed rgba(255,255,255,0.35)",
              background: "rgba(255,255,255,0.06)",
              opacity: ent(f, 20 + i * 6, 40 + i * 6) * (1 - some),
            }}
          />
        );
      })}
    </>
  );
};

// ---------- frases (zona superior), uma por compasso ----------
type Linha = {
  t: string;
  tipo: "forte" | "leve" | "manuscrita" | "destaque";
  tam?: number;
};

const FRASES: { de: number; dur: number; linhas: Linha[] }[] = [
  {
    de: 0,
    dur: CENA,
    linhas: [{ t: "Se você comeu hoje,", tipo: "forte", tam: 84 }],
  },
  {
    de: 80,
    dur: CENA,
    linhas: [
      { t: "agradeça a um", tipo: "leve", tam: 50 },
      { t: "produtor rural.", tipo: "manuscrita", tam: 118 },
    ],
  },
  {
    de: 160,
    dur: CENA,
    linhas: [
      { t: "Quem planta", tipo: "forte", tam: 84 },
      { t: "e colhe,", tipo: "forte", tam: 84 },
    ],
  },
  {
    de: 240,
    dur: CENA,
    linhas: [
      { t: "quem cria", tipo: "forte", tam: 84 },
      { t: "com dedicação,", tipo: "manuscrita", tam: 104 },
    ],
  },
  {
    de: 320,
    dur: CENA,
    linhas: [
      { t: "faça chuva", tipo: "forte", tam: 84 },
      { t: "ou faça sol,", tipo: "forte", tam: 84 },
    ],
  },
  {
    de: 400,
    dur: CENA,
    linhas: [
      { t: "leva comida", tipo: "forte", tam: 84 },
      { t: "à sua mesa.", tipo: "destaque", tam: 84 },
    ],
  },
  {
    de: 480,
    dur: CENA,
    linhas: [
      { t: "Em Mato Grosso do Sul,", tipo: "leve", tam: 46 },
      { t: "10 de outubro", tipo: "manuscrita", tam: 124 },
      { t: "é Dia do Produtor Rural", tipo: "forte", tam: 58 },
    ],
  },
  {
    de: 560,
    dur: CENA,
    linhas: [
      {
        t: "Data criada pela Lei Estadual nº 2.141/2000,",
        tipo: "leve",
        tam: 38,
      },
      { t: "de autoria do", tipo: "manuscrita", tam: 84 },
      { t: "deputado Zé Teixeira", tipo: "forte", tam: 66 },
    ],
  },
  {
    de: 640,
    dur: CENA,
    linhas: [
      { t: "Marque um", tipo: "forte", tam: 72 },
      { t: "produtor rural", tipo: "manuscrita", tam: 108 },
      { t: "que você admira", tipo: "forte", tam: 60 },
    ],
  },
  {
    de: 720,
    dur: CAMPO_DURACAO - 720,
    linhas: [
      { t: "Parabéns,", tipo: "manuscrita", tam: 130 },
      { t: "produtor rural!", tipo: "forte", tam: 84 },
    ],
  },
];

const Frase: React.FC<{ linhas: Linha[]; dur: number; ultima: boolean }> = ({
  linhas,
  dur,
  ultima,
}) => {
  const f = useCurrentFrame();
  const sai = ultima ? 1 : 1 - ent(f, dur - 10, dur);
  let n = 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 50,
        right: 50,
        top: 200,
        height: 290,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        opacity: sai,
      }}
    >
      {linhas.map((l, i) => {
        const estilo: React.CSSProperties =
          l.tipo === "manuscrita"
            ? {
                fontFamily: MANUSCRITA,
                fontWeight: 700,
                fontSize: l.tam ?? 110,
                color: COR.amarelo,
                lineHeight: 1.1,
              }
            : l.tipo === "leve"
              ? {
                  fontFamily: FONTE,
                  fontWeight: 600,
                  fontSize: l.tam ?? 46,
                  color: COR.branco,
                  lineHeight: 1.25,
                }
              : {
                  fontFamily: FONTE,
                  fontWeight: 800,
                  fontSize: l.tam ?? 84,
                  color: l.tipo === "destaque" ? COR.amarelo : COR.branco,
                  lineHeight: 1.06,
                  letterSpacing: -2,
                };
        return (
          <div key={i} style={{ ...estilo, textShadow: SOMBRA }}>
            {l.t.split(" ").map((p, j) => {
              const k = ent(f, 6 + n * 4, 6 + n * 4 + 22);
              n++;
              return (
                <span
                  key={j}
                  style={{
                    display: "inline-block",
                    marginRight: "0.24em",
                    opacity: k,
                    transform: `translateY(${(1 - k) * 20}px)`,
                    filter: `blur(${(1 - k) * 6}px)`,
                  }}
                >
                  {p}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// ---------- logo no centro do mural, no final ----------
const ENCOLHE = 0.72; // escala do mural no final, para a logo caber embaixo

const SeloLogo: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: f - (M.final + 24),
    fps,
    config: { damping: 13, stiffness: 90 },
  });
  if (f < M.final + 24) return null;
  const W = 600;
  const topo = GRADE.y + (GRADE.h * 2 + GRADE.gap) * ENCOLHE + 34;
  return (
    <div
      style={{
        position: "absolute",
        left: (1080 - W) / 2,
        top: topo,
        width: W,
        opacity: Math.min(1, s * 1.5),
        transform: `scale(${0.6 + 0.4 * s}) translateY(${Math.sin(f / 22) * 4}px)`,
        filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.45))",
        zIndex: 20,
      }}
    >
      <Img
        src={staticFile(LOGO)}
        style={{
          width: W,
          height: Math.round(W * LOGO_PROP),
          display: "block",
        }}
      />
    </div>
  );
};

// mural inteiro: no final encolhe (preso pelo topo) para abrir espaço para a logo
const Mural: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const e = interpolate(ent(f, M.final, M.final + 30), [0, 1], [1, ENCOLHE]);
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${e})`,
        transformOrigin: `540px ${GRADE.y}px`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// ---------- fundo dourado, partículas e luz ----------
const Fundo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile("reel-produtor/ze-por-do-sol.jpg")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "blur(40px) brightness(0.55) saturate(1.3)",
          transform: `scale(${1.3 + (f / CAMPO_DURACAO) * 0.1})`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(14,40,24,0.35) 0%, rgba(10,8,0,0.15) 45%, rgba(14,40,24,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

const Particulas: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{ pointerEvents: "none", mixBlendMode: "screen", zIndex: 30 }}
    >
      {Array.from({ length: 30 }).map((_, i) => {
        const r = 3 + random(`r${i}`) * 9;
        const x = random(`x${i}`) * 1080 + Math.sin(f / (40 + i) + i) * 30;
        const y =
          ((((random(`y${i}`) * 2100 - f * (0.4 + random(`v${i}`) * 0.9)) %
            2100) +
            2100) %
            2100) -
          90;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,228,150,0.95) 0%, rgba(255,200,90,0) 70%)",
              opacity:
                0.2 +
                random(`o${i}`) * 0.4 * (0.6 + 0.4 * Math.sin(f / 18 + i)),
              filter: `blur(${r > 8 ? 2 : 0.5}px)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const LuzDourada: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 31 }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at ${80 + Math.sin(f / 70) * 6}% 4%, rgba(255,200,100,0.45) 0%, rgba(255,170,70,0.12) 35%, transparent 60%)`,
          mixBlendMode: "screen",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(8,6,0,0.4) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

const MarcaDagua: React.FC = () => {
  const f = useCurrentFrame();
  const W = 200;
  return (
    <Img
      src={staticFile(LOGO)}
      style={{
        position: "absolute",
        right: 44,
        bottom: 64,
        width: W,
        height: Math.round(W * LOGO_PROP),
        zIndex: 32,
        opacity:
          0.92 * ent(f, 10, 28) * (1 - ent(f, M.final + 20, M.final + 40)),
        filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.4))",
      }}
    />
  );
};

export const ReelProdutorCampo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ opacity: ent(f, 0, 16) }}>
        <Fundo />
        <Mural>
          <Vagas />
          {FOTOS.map((foto, i) => (
            <FotoMural key={foto.src} foto={foto} i={i} />
          ))}
        </Mural>
        <SeloLogo />
        {FRASES.map((fr, i) => (
          <Sequence
            key={fr.de}
            from={fr.de}
            durationInFrames={fr.dur}
            name={`frase ${i + 1}`}
            layout="none"
          >
            <Frase
              linhas={fr.linhas}
              dur={fr.dur}
              ultima={i === FRASES.length - 1}
            />
          </Sequence>
        ))}
        <Particulas />
        <LuzDourada />
        <MarcaDagua />
      </AbsoluteFill>
      <Audio
        src={staticFile("reel-produtor/trilha-campo.wav")}
        volume={(x) =>
          interpolate(
            x,
            [0, 8, CAMPO_DURACAO - 20, CAMPO_DURACAO],
            [0, 1, 1, 0],
            clamp,
          )
        }
      />
    </AbsoluteFill>
  );
};
