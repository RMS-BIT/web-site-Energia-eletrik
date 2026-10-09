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
// com fotos reais do deputado, empilhadas em camadas 3D (cada foto nova entra
// na frente e as anteriores recuam em profundidade). No final a pilha se abre
// em leque ao fundo e a câmera foca na logo e na data, em 3D. Ritmo calmo (uma frase por compasso de 90 BPM ≈ 2,7 s),
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

// ---------- fotos em camadas 3D ----------
// Cada foto nova entra pela frente; as anteriores recuam em profundidade
// (mais para trás, deslocadas, levemente giradas e desfocadas).
type Foto = {
  src: string;
  foco: string;
  entra: number;
  w: number;
  h: number;
  lado: number;
};
const FOTOS: Foto[] = [
  {
    src: "reel-produtor/ze-por-do-sol.jpg",
    foco: "50% 30%",
    entra: 4,
    w: 600,
    h: 880,
    lado: -1,
  },
  {
    src: "reel-produtor/ze-soja.jpg",
    foco: "55% 40%",
    entra: 160,
    w: 900,
    h: 600,
    lado: 1,
  },
  {
    src: "reel-produtor/ze-gado.jpg",
    foco: "72% 35%",
    entra: 240,
    w: 900,
    h: 600,
    lado: -1,
  },
  {
    src: "reel-produtor/ze-terere.jpg",
    foco: "45% 40%",
    entra: 320,
    w: 600,
    h: 880,
    lado: 1,
  },
];
const CENTRO_Y = 1010; // centro da pilha na tela

const Camada: React.FC<{ foto: Foto; i: number }> = ({ foto, i }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f - foto.entra;
  if (t < 0) return null;
  const entra = spring({
    frame: t,
    fps,
    config: { damping: 18, stiffness: 70, mass: 1.1 },
  });
  // profundidade = quantas fotos já entraram na frente desta
  const d = FOTOS.slice(i + 1).reduce(
    (acc, o) => acc + ent(f, o.entra, o.entra + 34),
    0,
  );
  // no final, a pilha se abre em leque e vai para o fundo
  const abre = ent(f, M.final, M.final + 40);
  const x = foto.lado * (70 * d + abre * (220 + 60 * i));
  const y = -50 * d - abre * 120;
  const z = interpolate(entra, [0, 1], [520, 0]) - 230 * d - abre * 600;
  const rz = foto.lado * (3.5 * d + abre * 6);
  const ry = foto.lado * abre * -18;
  return (
    <div
      style={{
        position: "absolute",
        left: 540 - foto.w / 2,
        top: CENTRO_Y - foto.h / 2,
        width: foto.w,
        height: foto.h,
        borderRadius: 26,
        overflow: "hidden",
        border: "7px solid #FFFFFF",
        boxShadow: "0 40px 90px rgba(0,0,0,0.55)",
        opacity: Math.min(1, entra * 1.8),
        transform: `translate3d(${x}px, ${y}px, ${z}px) rotateZ(${rz}deg) rotateY(${ry}deg)`,
        filter: `blur(${Math.min(6, 1.4 * d + abre * 3)}px) brightness(${1 - 0.12 * d - abre * 0.25})`,
      }}
    >
      <Img
        src={staticFile(foto.src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: foto.foco,
          filter: "saturate(1.08) contrast(1.04) sepia(0.06)",
          transform: `scale(${1.03 + Math.min(1, t / 600) * 0.07})`,
        }}
      />
    </div>
  );
};

const Pilha: React.FC = () => {
  const f = useCurrentFrame();
  // câmera: leve órbita que dá paralaxe entre as camadas
  const ry = Math.sin(f / 110) * 7;
  const rx = 4 + Math.sin(f / 150) * 2;
  return (
    <AbsoluteFill
      style={{
        perspective: 1500,
        perspectiveOrigin: `540px ${CENTRO_Y - 100}px`,
      }}
    >
      <AbsoluteFill
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateY(${ry}deg) rotateX(${rx}deg)`,
        }}
      >
        {FOTOS.map((foto, i) => (
          <Camada key={foto.src} foto={foto} i={i} />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
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
      { t: "Parabéns,", tipo: "manuscrita", tam: 120 },
      { t: "produtor rural!", tipo: "forte", tam: 76 },
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

// ---------- final: logo e data em 3D ----------
// logo com "espessura": várias cópias recuadas em Z formam a lateral
const Logo3D: React.FC<{ largura: number }> = ({ largura }) => {
  const h = Math.round(largura * LOGO_PROP);
  return (
    <div
      style={{
        position: "relative",
        width: largura,
        height: h,
        transformStyle: "preserve-3d",
      }}
    >
      {Array.from({ length: 12 }).map((_, k) => (
        <Img
          key={k}
          src={staticFile(LOGO)}
          style={{
            position: "absolute",
            inset: 0,
            width: largura,
            height: h,
            transform: `translateZ(${-(12 - k) * 2.2}px)`,
            filter: "brightness(0.38) saturate(1.2)",
          }}
        />
      ))}
      <Img
        src={staticFile(LOGO)}
        style={{
          position: "absolute",
          inset: 0,
          width: largura,
          height: h,
          transform: "translateZ(0px)",
        }}
      />
    </div>
  );
};

// texto com relevo (sombras empilhadas imitam a extrusão)
const relevo = (cor: string, n = 10) =>
  Array.from({ length: n }, (_, k) => `${0}px ${k + 1}px 0 ${cor}`).join(", ") +
  ", 0 18px 30px rgba(0,0,0,0.55)";

const Final3D: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f - M.final;
  if (t < 0) return null;
  const logo = spring({
    frame: t - 16,
    fps,
    config: { damping: 15, stiffness: 60, mass: 1.2 },
  });
  const data = spring({
    frame: t - 46,
    fps,
    config: { damping: 15, stiffness: 70 },
  });
  const orbita = Math.sin(t / 40) * 6;
  return (
    <AbsoluteFill
      style={{
        perspective: 1200,
        perspectiveOrigin: "540px 1000px",
        zIndex: 25,
      }}
    >
      {/* brilho atrás da logo */}
      <div
        style={{
          position: "absolute",
          left: 540 - 650,
          top: 900 - 520,
          width: 1300,
          height: 1040,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(255,230,150,0.45) 0%, rgba(255,200,90,0.12) 40%, transparent 68%)",
          opacity: logo,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 540 - 380,
          top: 680,
          transformStyle: "preserve-3d",
          opacity: Math.min(1, logo * 1.6),
          transform: `translateZ(${interpolate(logo, [0, 1], [-900, 60])}px) rotateY(${interpolate(logo, [0, 1], [-50, -14]) + orbita}deg) rotateX(${8 + Math.sin(t / 55) * 3}deg)`,
          filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.5))",
        }}
      >
        <Logo3D largura={760} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1210,
          textAlign: "center",
          transformStyle: "preserve-3d",
          opacity: Math.min(1, data * 1.6),
          transform: `translateZ(${interpolate(data, [0, 1], [-500, 40])}px) rotateX(${interpolate(data, [0, 1], [60, 18])}deg) rotateY(${orbita * 0.6}deg)`,
        }}
      >
        <div
          style={{
            fontFamily: FONTE,
            fontWeight: 900,
            fontSize: 96,
            letterSpacing: -2,
            color: COR.amarelo,
            textShadow: relevo("#9C7A12"),
          }}
        >
          10 DE OUTUBRO
        </div>
        <div
          style={{
            fontFamily: FONTE,
            fontWeight: 800,
            fontSize: 56,
            letterSpacing: 1,
            color: COR.branco,
            marginTop: 6,
            textShadow: relevo("#8C8C8C", 7),
          }}
        >
          DIA DO PRODUTOR RURAL
        </div>
      </div>
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
        <Pilha />
        <Final3D />
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
