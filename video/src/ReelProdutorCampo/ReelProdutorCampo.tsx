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

// Reels "Dia do Produtor Rural" — versão equilibrada (padrão deputado):
// o gancho e a chamada do formato viral, com ritmo calmo (uma cena por
// compasso de 90 BPM ≈ 2,7 s), fusões suaves, luz dourada e partículas de
// luz, sem tremor nem clarão. Trilha de violão (gerar_trilha_campo.py).
// Lei Estadual nº 2.141, de 28/08/2000 (DOE nº 5.338); autoria:
// zeteixeira.com (10/10/2017). Conferido em 09/10/2026.
// Fotos do deputado apenas enquadradas (nenhuma alteração de pessoas).

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
const FUSAO = 20;
const LOGO = "reel-produtor/logo-ze-verde.png";
const LOGO_PROP = 478 / 850;

const COR = {
  amarelo: "#F6D54A",
  branco: "#FFFFFF",
  verdeEscuro: "#1E6B3A",
  verdeNoite: "#0E3B22",
};
const SOMBRA = "0 3px 18px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.4)";

// ---------- foto em tela cheia, luz quente e movimento lento ----------
const FotoQuente: React.FC<{
  src: string;
  foco: string;
  dur: number;
  zoom?: [number, number];
  desliza?: number;
  escurece?: number;
}> = ({
  src,
  foco,
  dur,
  zoom = [1.06, 1.16],
  desliza = 0,
  escurece = 0.55,
}) => {
  const f = useCurrentFrame();
  const p = f / dur;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: foco,
          filter: "saturate(1.12) contrast(1.05) sepia(0.08)",
          transform: `scale(${interpolate(p, [0, 1], zoom)}) translateX(${(p - 0.5) * desliza}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(10,8,0,${escurece * 0.35}) 0%, rgba(10,8,0,0) 35%, rgba(10,8,0,${escurece * 0.5}) 62%, rgba(10,8,0,${escurece}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// ---------- texto: linhas que entram palavra por palavra, com suavidade ----------
type Linha = {
  t: string;
  tipo: "forte" | "leve" | "manuscrita" | "destaque";
  tam?: number;
};

const Texto: React.FC<{
  linhas: Linha[];
  atraso?: number;
  dur: number;
  posicao?: "centro" | "baixo" | "topo";
}> = ({ linhas, atraso = 10, dur, posicao = "centro" }) => {
  const f = useCurrentFrame();
  const sai = 1 - ent(f, dur - 12, dur);
  let n = 0;
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent:
          posicao === "baixo"
            ? "flex-end"
            : posicao === "topo"
              ? "flex-start"
              : "center",
        padding:
          posicao === "baixo"
            ? "0 70px 430px"
            : posicao === "topo"
              ? "260px 70px 0"
              : "0 70px 200px",
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
                fontSize: l.tam ?? 128,
                color: COR.amarelo,
                lineHeight: 1.25,
              }
            : l.tipo === "leve"
              ? {
                  fontFamily: FONTE,
                  fontWeight: 600,
                  fontSize: l.tam ?? 50,
                  color: COR.branco,
                  lineHeight: 1.2,
                }
              : {
                  fontFamily: FONTE,
                  fontWeight: 800,
                  fontSize: l.tam ?? 92,
                  color: l.tipo === "destaque" ? COR.amarelo : COR.branco,
                  lineHeight: 1.06,
                  letterSpacing: -2,
                };
        const palavras = l.t.split(" ");
        return (
          <div key={i} style={{ ...estilo, textShadow: SOMBRA }}>
            {palavras.map((p, j) => {
              const k = ent(f, atraso + n * 4, atraso + n * 4 + 22);
              n++;
              return (
                <span
                  key={j}
                  style={{
                    display: "inline-block",
                    marginRight: "0.24em",
                    opacity: k,
                    transform: `translateY(${(1 - k) * 22}px)`,
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
    </AbsoluteFill>
  );
};

const Cena: React.FC<{ primeira?: boolean; children: React.ReactNode }> = ({
  primeira,
  children,
}) => {
  const f = useCurrentFrame();
  const e = primeira ? 1 : ent(f, 0, FUSAO);
  return (
    <AbsoluteFill
      style={{ opacity: e, transform: `scale(${1.025 - 0.025 * e})` }}
    >
      {children}
    </AbsoluteFill>
  );
};

type CenaFoto = {
  de: number;
  src: string;
  foco: string;
  linhas: Linha[];
  posicao?: "centro" | "baixo" | "topo";
  desliza?: number;
  escurece?: number;
  zoom?: [number, number];
};

const CENAS: CenaFoto[] = [
  {
    de: 0,
    src: "reel-produtor/foto-soja.jpg",
    foco: "50% 50%",
    linhas: [
      { t: "Se você", tipo: "forte", tam: 104 },
      { t: "comeu hoje,", tipo: "forte", tam: 104 },
    ],
    posicao: "topo",
    desliza: 30,
  },
  {
    de: 80,
    src: "reel-produtor/foto-semente.jpg",
    foco: "55% 50%",
    linhas: [
      { t: "agradeça a um", tipo: "leve", tam: 58 },
      { t: "produtor rural.", tipo: "manuscrita", tam: 136 },
    ],
    posicao: "baixo",
  },
  {
    de: 160,
    src: "reel-produtor/foto-milho.jpg",
    foco: "72% 50%",
    linhas: [
      { t: "Quem planta", tipo: "forte" },
      { t: "e colhe,", tipo: "forte" },
    ],
    desliza: -40,
  },
  {
    de: 240,
    src: "reel-produtor/ze-gado.jpg",
    foco: "75% 45%",
    linhas: [
      { t: "quem cria", tipo: "forte" },
      { t: "com dedicação,", tipo: "manuscrita", tam: 112 },
    ],
    posicao: "baixo",
    zoom: [1.04, 1.1],
  },
  {
    de: 320,
    src: "reel-produtor/foto-tablet.jpg",
    foco: "55% 50%",
    linhas: [
      { t: "faça chuva", tipo: "forte" },
      { t: "ou faça sol,", tipo: "forte" },
    ],
    desliza: 30,
  },
  {
    de: 400,
    src: "reel-produtor/foto-soja.jpg",
    foco: "38% 62%",
    linhas: [
      { t: "leva comida", tipo: "forte" },
      { t: "à sua mesa.", tipo: "destaque" },
    ],
    posicao: "topo",
    zoom: [1.2, 1.3],
  },
];

// ---------- cena da data ----------
const Data: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: f - 18,
    fps,
    config: { damping: 16, stiffness: 80 },
  });
  return (
    <Cena>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 42%, ${COR.verdeEscuro} 0%, ${COR.verdeNoite} 85%)`,
        }}
      />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: 200,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: FONTE,
            fontWeight: 600,
            fontSize: 52,
            color: COR.branco,
            opacity: ent(f, 6, 24),
            transform: `translateY(${(1 - ent(f, 6, 24)) * 18}px)`,
          }}
        >
          Em Mato Grosso do Sul,
        </div>
        <div
          style={{
            fontFamily: MANUSCRITA,
            fontWeight: 700,
            fontSize: 170,
            lineHeight: 1.1,
            color: COR.amarelo,
            opacity: Math.min(1, s * 1.4),
            transform: `scale(${0.85 + 0.15 * s})`,
            textShadow: SOMBRA,
          }}
        >
          10 de outubro
        </div>
        <div
          style={{
            fontFamily: FONTE,
            fontWeight: 800,
            fontSize: 74,
            color: COR.branco,
            letterSpacing: -1,
            lineHeight: 1.08,
            opacity: ent(f, 34, 52),
            transform: `translateY(${(1 - ent(f, 34, 52)) * 18}px)`,
          }}
        >
          é Dia do Produtor Rural
        </div>
      </AbsoluteFill>
    </Cena>
  );
};

// ---------- cena da lei (sobre a foto do deputado com os jovens) ----------
const Lei: React.FC = () => (
  <Cena>
    <FotoQuente
      src="reel-produtor/ze-soja.jpg"
      foco="58% 45%"
      dur={CENA + FUSAO}
      zoom={[1.04, 1.1]}
      escurece={0.7}
    />
    <Texto
      dur={CENA + FUSAO}
      posicao="baixo"
      linhas={[
        { t: "Data criada pela", tipo: "leve", tam: 46 },
        { t: "Lei Estadual nº 2.141/2000,", tipo: "leve", tam: 46 },
        { t: "de autoria do", tipo: "manuscrita", tam: 96 },
        { t: "deputado Zé Teixeira", tipo: "forte", tam: 80 },
      ]}
    />
  </Cena>
);

// ---------- chamada ----------
const Chamada: React.FC = () => {
  const f = useCurrentFrame();
  const seta = Math.sin((f / 20) * Math.PI) * 10;
  return (
    <Cena>
      <FotoQuente
        src="reel-produtor/foto-milho.jpg"
        foco="40% 50%"
        dur={CENA + FUSAO}
        escurece={0.85}
        desliza={30}
      />
      <Texto
        dur={CENA + FUSAO + 10}
        linhas={[
          { t: "Marque um", tipo: "forte", tam: 88 },
          { t: "produtor rural", tipo: "manuscrita", tam: 140 },
          { t: "que você admira", tipo: "forte", tam: 74 },
        ]}
      />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 560,
          opacity: ent(f, 40, 56),
        }}
      >
        <svg
          width="80"
          height="96"
          viewBox="0 0 80 96"
          style={{ transform: `translateY(${seta}px)` }}
        >
          <path
            d="M40 8 V80 M14 56 L40 84 L66 56"
            fill="none"
            stroke={COR.amarelo}
            strokeWidth={10}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </AbsoluteFill>
    </Cena>
  );
};

// ---------- final ----------
const Final: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({
    frame: f - 34,
    fps,
    config: { damping: 14, stiffness: 70, mass: 1.1 },
  });
  const W = 900;
  return (
    <Cena>
      <FotoQuente
        src="reel-produtor/foto-soja.jpg"
        foco="50% 50%"
        dur={CAMPO_DURACAO - M.final}
        zoom={[1.1, 1.18]}
        escurece={0.6}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(14,59,34,0.55) 0%, rgba(14,59,34,0.35) 50%, rgba(14,59,34,0.75) 100%)`,
        }}
      />
      <AbsoluteFill
        style={{ alignItems: "center", paddingTop: 280, textAlign: "center" }}
      >
        <div
          style={{
            fontFamily: MANUSCRITA,
            fontWeight: 700,
            fontSize: 150,
            color: COR.amarelo,
            textShadow: SOMBRA,
            lineHeight: 1,
            opacity: ent(f, 6, 26),
            clipPath: `inset(-20% ${(1 - ent(f, 6, 30)) * 100}% -20% -5%)`,
          }}
        >
          Parabéns,
        </div>
        <div
          style={{
            fontFamily: FONTE,
            fontWeight: 800,
            fontSize: 96,
            color: COR.branco,
            letterSpacing: -2,
            textShadow: SOMBRA,
            opacity: ent(f, 20, 40),
            transform: `translateY(${(1 - ent(f, 20, 40)) * 20}px)`,
          }}
        >
          produtor rural!
        </div>
        <div
          style={{
            marginTop: 80,
            opacity: Math.min(1, logo * 1.5),
            transform: `scale(${0.7 + 0.3 * logo}) translateY(${Math.sin(f / 22) * 5}px)`,
            filter: `drop-shadow(0 22px 40px rgba(0,0,0,0.45)) blur(${(1 - Math.min(1, logo * 1.3)) * 8}px)`,
          }}
        >
          <Img
            src={staticFile(LOGO)}
            style={{ width: W, height: Math.round(W * LOGO_PROP) }}
          />
        </div>
        <div
          style={{
            marginTop: 36,
            fontFamily: FONTE,
            fontWeight: 600,
            fontSize: 36,
            color: COR.branco,
            letterSpacing: 2,
            textShadow: SOMBRA,
            opacity: ent(f, 60, 78),
          }}
        >
          10 de outubro · Mato Grosso do Sul
        </div>
      </AbsoluteFill>
    </Cena>
  );
};

// ---------- partículas de luz (poeira dourada) ----------
const Particulas: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      {Array.from({ length: 34 }).map((_, i) => {
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
                0.25 +
                random(`o${i}`) * 0.45 * (0.6 + 0.4 * Math.sin(f / 18 + i)),
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
          background: `radial-gradient(ellipse at ${80 + Math.sin(f / 70) * 6}% 6%, rgba(255,200,100,0.5) 0%, rgba(255,170,70,0.15) 35%, transparent 62%)`,
          mixBlendMode: "screen",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 58%, rgba(8,6,0,0.42) 100%)",
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
        opacity: 0.92 * ent(f, 10, 28) * (1 - ent(f, M.final, M.final + FUSAO)),
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
        {CENAS.map((c, i) => (
          <Sequence
            key={c.de}
            from={c.de}
            durationInFrames={CENA + FUSAO}
            name={`cena ${i + 1}`}
          >
            <Cena primeira={i === 0}>
              <FotoQuente
                src={c.src}
                foco={c.foco}
                dur={CENA + FUSAO}
                desliza={c.desliza}
                escurece={c.escurece}
                zoom={c.zoom}
              />
              <Texto
                linhas={c.linhas}
                dur={CENA + FUSAO}
                posicao={c.posicao}
                atraso={i === 0 ? 8 : 16}
              />
            </Cena>
          </Sequence>
        ))}
        <Sequence from={M.data} durationInFrames={CENA + FUSAO} name="data">
          <Data />
        </Sequence>
        <Sequence from={M.cheio} durationInFrames={CENA + FUSAO} name="lei">
          <Lei />
        </Sequence>
        <Sequence
          from={M.cheio + CENA}
          durationInFrames={CENA + FUSAO}
          name="marque"
        >
          <Chamada />
        </Sequence>
        <Sequence
          from={M.final}
          durationInFrames={CAMPO_DURACAO - M.final}
          name="final"
        >
          <Final />
        </Sequence>
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
