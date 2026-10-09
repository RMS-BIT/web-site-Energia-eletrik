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

// Reels "Dia do Produtor Rural" — versão definitiva.
// Roteiro "a data tem autor" (gancho de curiosidade, autoria no início, o
// produtor como herói no texto, chamada para marcar) + visual em camadas 3D
// (cada foto do deputado entra na frente e as anteriores recuam desfocadas).
// No final a pilha se abre ao fundo e a logo, grande, é a protagonista, com a
// data em perspectiva. Tempo de cada frase calculado para leitura confortável
// (~3 palavras/s + respiro).
// Lei Estadual nº 2.141, de 28/08/2000 (DOE nº 5.338); autoria confirmada
// pela equipe em 09/10/2026 (fonte original: zeteixeira.com, 10/10/2017).
// "Há 26 anos": de 28/08/2000 a 10/10/2026.
// Fotos do deputado apenas enquadradas e reposicionadas (sem alterar pessoas).

const MANUSCRITA = "Dancing Script Var";
loadFont({
  family: MANUSCRITA,
  url: staticFile("fontes/DancingScript-var.ttf"),
  weight: "400 700",
  format: "truetype",
});

const M = linha.marcas;
export const AUTOR_DURACAO = linha.total;
const LOGO = "reel-produtor/logo-ze-rosa.png";
const LOGO_PROP = 538 / 976; // altura / largura
const COR = { amarelo: "#F6D54A", branco: "#FFFFFF" };
const SOMBRA = "0 4px 22px rgba(0,0,0,0.7), 0 2px 5px rgba(0,0,0,0.55)";

// ---------- frases (zona superior) ----------
type Linha = {
  t: string;
  tipo: "forte" | "leve" | "manuscrita" | "destaque";
  tam?: number;
};
type Frase = { de: number; dur: number; linhas: Linha[]; topo?: number };

const FRASES: Frase[] = [
  {
    de: 0,
    dur: 105,
    topo: 700,
    linhas: [
      { t: "O Dia do Produtor Rural", tipo: "forte", tam: 80 },
      { t: "em Mato Grosso do Sul", tipo: "leve", tam: 52 },
      { t: "tem autor.", tipo: "manuscrita", tam: 150 },
    ],
  },
  {
    de: 105,
    dur: 135,
    linhas: [
      { t: "Em 2000, uma lei de autoria do", tipo: "leve", tam: 48 },
      { t: "deputado Zé Teixeira", tipo: "forte", tam: 82 },
      { t: "criou a data.", tipo: "destaque", tam: 82 },
    ],
  },
  {
    de: 240,
    dur: 105,
    linhas: [
      { t: "Uma homenagem a quem", tipo: "leve", tam: 52 },
      { t: "planta, cria e colhe.", tipo: "manuscrita", tam: 120 },
    ],
  },
  {
    de: 345,
    dur: 165,
    linhas: [
      { t: "Há 26 anos,", tipo: "destaque", tam: 84 },
      { t: "todo 10 de outubro é dia de agradecer", tipo: "leve", tam: 46 },
      { t: "a quem leva comida", tipo: "forte", tam: 68 },
      { t: "à nossa mesa.", tipo: "forte", tam: 68 },
    ],
  },
  {
    de: 510,
    dur: 130,
    linhas: [
      { t: "Marque um", tipo: "forte", tam: 84 },
      { t: "produtor rural", tipo: "manuscrita", tam: 136 },
      { t: "que você admira", tipo: "forte", tam: 68 },
    ],
  },
  {
    de: 640,
    dur: AUTOR_DURACAO - 640,
    linhas: [
      { t: "Parabéns,", tipo: "manuscrita", tam: 120 },
      { t: "produtor rural!", tipo: "forte", tam: 80 },
    ],
  },
];

const TextoFrase: React.FC<{ frase: Frase; ultima: boolean }> = ({
  frase,
  ultima,
}) => {
  const f = useCurrentFrame();
  const sai = ultima ? 1 : 1 - ent(f, frase.dur - 10, frase.dur);
  const palavras = frase.linhas.reduce((n, l) => n + l.t.split(" ").length, 0);
  // todas as palavras visíveis em ~1/3 da duração; o resto é tempo de leitura
  const passo = Math.min(4, (frase.dur * 0.33) / palavras);
  let n = 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 40,
        right: 40,
        top: frase.topo ?? 170,
        height: 400,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        opacity: sai,
      }}
    >
      {/* sombra suave atrás do texto (legibilidade sem caixa) */}
      <div
        style={{
          position: "absolute",
          inset: "-60px -40px",
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(8,10,4,0.55) 0%, rgba(8,10,4,0.25) 45%, transparent 72%)",
          filter: "blur(10px)",
        }}
      />
      {frase.linhas.map((l, i) => {
        const estilo: React.CSSProperties =
          l.tipo === "manuscrita"
            ? {
                fontFamily: MANUSCRITA,
                fontWeight: 700,
                fontSize: l.tam,
                color: COR.amarelo,
                lineHeight: 1.12,
              }
            : l.tipo === "leve"
              ? {
                  fontFamily: FONTE,
                  fontWeight: 600,
                  fontSize: l.tam,
                  color: COR.branco,
                  lineHeight: 1.25,
                }
              : {
                  fontFamily: FONTE,
                  fontWeight: 800,
                  fontSize: l.tam,
                  color: l.tipo === "destaque" ? COR.amarelo : COR.branco,
                  lineHeight: 1.06,
                  letterSpacing: -2,
                };
        return (
          <div
            key={i}
            style={{ position: "relative", ...estilo, textShadow: SOMBRA }}
          >
            {l.t.split(" ").map((p, j) => {
              const ini = 6 + n * passo;
              const k = ent(f, ini, ini + 20);
              n++;
              return (
                <span
                  key={j}
                  style={{
                    display: "inline-block",
                    marginRight: "0.24em",
                    opacity: k,
                    transform: `translateY(${(1 - k) * 18}px)`,
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

// ---------- fotos em camadas 3D ----------
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
    src: "reel-produtor/ze-gado.jpg",
    foco: "72% 35%",
    entra: 110,
    w: 920,
    h: 600,
    lado: -1,
  },
  {
    src: "reel-produtor/ze-soja.jpg",
    foco: "55% 40%",
    entra: 245,
    w: 920,
    h: 600,
    lado: 1,
  },
  {
    src: "reel-produtor/ze-terere.jpg",
    foco: "45% 38%",
    entra: 350,
    w: 600,
    h: 860,
    lado: -1,
  },
  {
    src: "reel-produtor/ze-por-do-sol.jpg",
    foco: "50% 30%",
    entra: 515,
    w: 600,
    h: 860,
    lado: 1,
  },
];
const CENTRO_Y = 1080;

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
  const d = FOTOS.slice(i + 1).reduce(
    (acc, o) => acc + ent(f, o.entra, o.entra + 34),
    0,
  );
  const abre = ent(f, M.final, M.final + 45);
  const x = foto.lado * (70 * d + abre * (200 + 70 * i));
  const y = -45 * d + abre * 60;
  const z = interpolate(entra, [0, 1], [520, 0]) - 230 * d - abre * 700;
  const rz = foto.lado * (3.5 * d + abre * 7);
  const ry = foto.lado * abre * -20;
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
        filter: `blur(${Math.min(6, 1.4 * d + abre * 4)}px) brightness(${1 - 0.12 * d - abre * 0.3})`,
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
  const ry = Math.sin(f / 110) * 6;
  const rx = 4 + Math.sin(f / 150) * 2;
  return (
    <AbsoluteFill
      style={{
        perspective: 1500,
        perspectiveOrigin: `540px ${CENTRO_Y - 120}px`,
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

// ---------- final: logo protagonista em 3D + data ----------
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
      {Array.from({ length: 10 }).map((_, k) => (
        <Img
          key={k}
          src={staticFile(LOGO)}
          style={{
            position: "absolute",
            inset: 0,
            width: largura,
            height: h,
            transform: `translateZ(${-(10 - k) * 2.2}px)`,
            filter: "brightness(0.4) saturate(1.2)",
          }}
        />
      ))}
      <Img
        src={staticFile(LOGO)}
        style={{ position: "absolute", inset: 0, width: largura, height: h }}
      />
    </div>
  );
};

const relevo = (cor: string, n: number) =>
  Array.from({ length: n }, (_, k) => `0px ${k + 1}px 0 ${cor}`).join(", ") +
  ", 0 16px 28px rgba(0,0,0,0.55)";

const Final3D: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f - M.final;
  if (t < 0) return null;
  const logo = spring({
    frame: t - 14,
    fps,
    config: { damping: 15, stiffness: 60, mass: 1.2 },
  });
  const data = spring({
    frame: t - 44,
    fps,
    config: { damping: 15, stiffness: 70 },
  });
  const orbita = Math.sin(t / 42) * 5;
  const W = 820;
  const ciclo = Math.max(0, t - 40) % 70;
  const brilho = interpolate(ciclo, [0, 34], [-0.4, 1.4], clamp);
  const mascara = `url(${staticFile(LOGO)})`;
  return (
    <AbsoluteFill
      style={{ perspective: 1300, perspectiveOrigin: "540px 960px" }}
    >
      <div
        style={{
          position: "absolute",
          left: 540 - 680,
          top: 930 - 520,
          width: 1360,
          height: 1040,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(255,232,160,0.5) 0%, rgba(255,200,90,0.14) 40%, transparent 68%)",
          opacity: logo,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 540 - W / 2,
          top: 690,
          transformStyle: "preserve-3d",
          opacity: Math.min(1, logo * 1.6),
          transform: `translateZ(${interpolate(logo, [0, 1], [-900, 40])}px) rotateY(${interpolate(logo, [0, 1], [-45, -6]) + orbita}deg) rotateX(${6 + Math.sin(t / 55) * 2}deg)`,
          filter: "drop-shadow(0 30px 44px rgba(0,0,0,0.5))",
        }}
      >
        <Logo3D largura={W} />
        {/* reflexo de luz percorrendo a logo */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            WebkitMaskImage: mascara,
            WebkitMaskSize: "100% 100%",
            maskImage: mascara,
            maskSize: "100% 100%",
            background: `linear-gradient(105deg, transparent ${brilho * 100 - 14}%, rgba(255,255,255,0.6) ${brilho * 100}%, transparent ${brilho * 100 + 14}%)`,
            mixBlendMode: "screen",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1250,
          textAlign: "center",
          opacity: Math.min(1, data * 1.6),
          transform: `translateZ(${interpolate(data, [0, 1], [-500, 30])}px) rotateX(${interpolate(data, [0, 1], [60, 14])}deg) rotateY(${orbita * 0.5}deg)`,
        }}
      >
        <div
          style={{
            fontFamily: FONTE,
            fontWeight: 900,
            fontSize: 96,
            letterSpacing: -2,
            color: COR.amarelo,
            textShadow: relevo("#9C7A12", 9),
          }}
        >
          10 DE OUTUBRO
        </div>
        <div
          style={{
            fontFamily: FONTE,
            fontWeight: 800,
            fontSize: 54,
            letterSpacing: 1,
            color: COR.branco,
            marginTop: 6,
            textShadow: relevo("#8C8C8C", 6),
          }}
        >
          DIA DO PRODUTOR RURAL
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- fundo, partículas, luz e marca d'água ----------
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
          transform: `scale(${1.3 + (f / AUTOR_DURACAO) * 0.1})`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(14,40,24,0.4) 0%, rgba(10,8,0,0.15) 45%, rgba(14,40,24,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

const Particulas: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      {Array.from({ length: 28 }).map((_, i) => {
        const r = 3 + random(`r${i}`) * 8;
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
              opacity: 0.18 + random(`o${i}`) * 0.35,
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
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at ${80 + Math.sin(f / 70) * 6}% 4%, rgba(255,200,100,0.4) 0%, rgba(255,170,70,0.1) 35%, transparent 60%)`,
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
        opacity: 0.92 * ent(f, 10, 28) * (1 - ent(f, M.final, M.final + 20)),
        filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.4))",
      }}
    />
  );
};

export const ReelProdutorAutor: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ opacity: ent(f, 0, 14) }}>
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
            <TextoFrase frase={fr} ultima={i === FRASES.length - 1} />
          </Sequence>
        ))}
        <Particulas />
        <LuzDourada />
        <MarcaDagua />
      </AbsoluteFill>
      <Audio
        src={staticFile("reel-produtor/trilha-autor.wav")}
        volume={(x) =>
          interpolate(
            x,
            [0, 8, AUTOR_DURACAO - 20, AUTOR_DURACAO],
            [0, 1, 1, 0],
            clamp,
          )
        }
      />
    </AbsoluteFill>
  );
};
