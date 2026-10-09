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

// Reels "Dia do Produtor Rural" — versão definitiva (estratégia "a data tem
// autor"): gancho de curiosidade, revelação da autoria logo no início, o
// produtor como herói no texto, chamada para marcar e assinatura do deputado.
// Só fotos reais do deputado (apenas enquadradas, sem alterar pessoas).
// Lei Estadual nº 2.141, de 28/08/2000 (DOE nº 5.338); autoria confirmada
// pela equipe em 09/10/2026 (fonte original: zeteixeira.com, 10/10/2017).
// "Há 26 anos": de 28/08/2000 a 10/10/2026.

const MANUSCRITA = "Dancing Script Var";
loadFont({
  family: MANUSCRITA,
  url: staticFile("fontes/DancingScript-var.ttf"),
  weight: "400 700",
  format: "truetype",
});

export const AUTOR_DURACAO = linha.total;
const FUSAO = 18;
const LOGO = "reel-produtor/logo-ze-verde.png";
const LOGO_PROP = 478 / 850;
const COR = { amarelo: "#F6D54A", branco: "#FFFFFF" };
const SOMBRA = "0 3px 18px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.45)";

// cenas (quadros)
const C = {
  gancho: { de: 0, dur: 80 },
  autoria: { de: 80, dur: 80 },
  homenagem: { de: 160, dur: 80 },
  tempo: { de: 240, dur: 90 },
  marque: { de: 330, dur: 70 },
  assinatura: { de: 400, dur: 120 },
};

// ---------- texto: palavras entram com suavidade ----------
type Linha = {
  t: string;
  tipo: "forte" | "leve" | "manuscrita" | "destaque";
  tam?: number;
};

const Texto: React.FC<{
  linhas: Linha[];
  atraso?: number;
  passo?: number;
  style?: React.CSSProperties;
}> = ({ linhas, atraso = 8, passo = 4, style }) => {
  const f = useCurrentFrame();
  let n = 0;
  return (
    <div style={{ textAlign: "center", ...style }}>
      {linhas.map((l, i) => {
        const estilo: React.CSSProperties =
          l.tipo === "manuscrita"
            ? {
                fontFamily: MANUSCRITA,
                fontWeight: 700,
                fontSize: l.tam ?? 120,
                color: COR.amarelo,
                lineHeight: 1.15,
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
                  fontSize: l.tam ?? 80,
                  color: l.tipo === "destaque" ? COR.amarelo : COR.branco,
                  lineHeight: 1.06,
                  letterSpacing: -2,
                };
        return (
          <div key={i} style={{ ...estilo, textShadow: SOMBRA }}>
            {l.t.split(" ").map((p, j) => {
              const k = ent(f, atraso + n * passo, atraso + n * passo + 22);
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

// ---------- fotos ----------
// paisagem: fundo desfocado + faixa nítida com bordas suaves (sem ampliar demais)
const FotoFaixa: React.FC<{
  src: string;
  foco: string;
  dur: number;
  topo?: number;
  altura?: number;
}> = ({ src, foco, dur, topo = 560, altura = 900 }) => {
  const f = useCurrentFrame();
  const p = f / dur;
  const mascara =
    "linear-gradient(180deg, transparent 0%, #000 10%, #000 86%, transparent 100%)";
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: foco,
          filter: "blur(30px) brightness(0.6) saturate(1.2)",
          transform: "scale(1.3)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: topo,
          height: altura,
          overflow: "hidden",
          WebkitMaskImage: mascara,
          maskImage: mascara,
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: foco,
            filter: "saturate(1.08) contrast(1.04) sepia(0.06)",
            transform: `scale(${1.03 + p * 0.07})`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// retrato: tela cheia com escurecimento embaixo para o texto
const FotoCheia: React.FC<{
  src: string;
  foco: string;
  dur: number;
  escurece?: number;
}> = ({ src, foco, dur, escurece = 0.7 }) => {
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
          filter: "saturate(1.08) contrast(1.04) sepia(0.05)",
          transform: `scale(${1.03 + p * 0.06})`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(10,8,0,${escurece * 0.35}) 0%, rgba(10,8,0,0) 30%, rgba(10,8,0,0) 50%, rgba(10,8,0,${escurece}) 100%)`,
        }}
      />
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

const FundoQuente: React.FC<{ src: string }> = ({ src }) => (
  <AbsoluteFill style={{ overflow: "hidden" }}>
    <Img
      src={staticFile(src)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: "blur(40px) brightness(0.5) saturate(1.3)",
        transform: "scale(1.35)",
      }}
    />
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 45%, rgba(40,30,10,0.1) 0%, rgba(10,8,0,0.55) 100%)",
      }}
    />
  </AbsoluteFill>
);

// ---------- cenas ----------
const Gancho: React.FC = () => (
  <Cena primeira>
    <FundoQuente src="reel-produtor/ze-por-do-sol.jpg" />
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 160,
      }}
    >
      <Texto
        atraso={6}
        linhas={[
          { t: "O Dia do Produtor Rural", tipo: "forte", tam: 74 },
          { t: "em Mato Grosso do Sul", tipo: "leve", tam: 48 },
        ]}
      />
      <Texto
        atraso={34}
        linhas={[{ t: "tem autor.", tipo: "manuscrita", tam: 160 }]}
        style={{ marginTop: 10 }}
      />
    </AbsoluteFill>
  </Cena>
);

const Autoria: React.FC = () => (
  <Cena>
    <FotoFaixa
      src="reel-produtor/ze-gado.jpg"
      foco="74% 40%"
      dur={C.autoria.dur + FUSAO}
    />
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 250 }}>
      <Texto
        atraso={10}
        passo={3}
        linhas={[
          { t: "Em 2000, uma lei de autoria do", tipo: "leve", tam: 44 },
          { t: "deputado Zé Teixeira", tipo: "forte", tam: 76 },
          { t: "criou a data.", tipo: "destaque", tam: 76 },
        ]}
      />
    </AbsoluteFill>
  </Cena>
);

const Homenagem: React.FC = () => (
  <Cena>
    <FotoFaixa
      src="reel-produtor/ze-soja.jpg"
      foco="52% 45%"
      dur={C.homenagem.dur + FUSAO}
    />
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 250 }}>
      <Texto
        atraso={10}
        linhas={[
          { t: "Uma homenagem a quem", tipo: "leve", tam: 48 },
          { t: "planta, cria e colhe.", tipo: "manuscrita", tam: 112 },
        ]}
      />
    </AbsoluteFill>
  </Cena>
);

const Tempo: React.FC = () => (
  <Cena>
    <FotoCheia
      src="reel-produtor/ze-terere.jpg"
      foco="50% 35%"
      dur={C.tempo.dur + FUSAO}
    />
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 60px 440px",
      }}
    >
      <Texto
        atraso={10}
        passo={3}
        linhas={[
          { t: "Há 26 anos,", tipo: "destaque", tam: 80 },
          { t: "todo 10 de outubro é dia de agradecer", tipo: "leve", tam: 42 },
          { t: "a quem leva comida", tipo: "forte", tam: 62 },
          { t: "à nossa mesa.", tipo: "forte", tam: 62 },
        ]}
      />
    </AbsoluteFill>
  </Cena>
);

const Marque: React.FC = () => {
  const f = useCurrentFrame();
  const seta = Math.sin((f / 20) * Math.PI) * 10;
  return (
    <Cena>
      <FundoQuente src="reel-produtor/ze-soja.jpg" />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: 160,
        }}
      >
        <Texto
          atraso={6}
          linhas={[
            { t: "Marque um", tipo: "forte", tam: 84 },
            { t: "produtor rural", tipo: "manuscrita", tam: 140 },
            { t: "que você admira", tipo: "forte", tam: 66 },
          ]}
        />
        <svg
          width="80"
          height="96"
          viewBox="0 0 80 96"
          style={{
            marginTop: 30,
            opacity: ent(f, 30, 44),
            transform: `translateY(${seta}px)`,
          }}
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

const Assinatura: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const data = spring({
    frame: f - 30,
    fps,
    config: { damping: 16, stiffness: 80 },
  });
  const logo = ent(f, 44, 62);
  return (
    <Cena>
      <FotoCheia
        src="reel-produtor/ze-por-do-sol.jpg"
        foco="50% 30%"
        dur={C.assinatura.dur + FUSAO}
        escurece={0.8}
      />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 170 }}>
        <Texto
          atraso={6}
          linhas={[
            { t: "Parabéns,", tipo: "manuscrita", tam: 118 },
            { t: "produtor rural!", tipo: "forte", tam: 78 },
          ]}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 420,
          perspective: 1000,
        }}
      >
        <div
          style={{
            textAlign: "center",
            opacity: Math.min(1, data * 1.5),
            transform: `rotateX(${interpolate(data, [0, 1], [55, 8])}deg) translateY(${(1 - data) * 40}px)`,
            transformOrigin: "50% 100%",
          }}
        >
          <div
            style={{
              fontFamily: FONTE,
              fontWeight: 900,
              fontSize: 92,
              letterSpacing: -1,
              color: COR.amarelo,
              textShadow: SOMBRA,
            }}
          >
            10 DE OUTUBRO
          </div>
          <div
            style={{
              fontFamily: FONTE,
              fontWeight: 700,
              fontSize: 46,
              letterSpacing: 2,
              color: COR.branco,
              textShadow: SOMBRA,
            }}
          >
            DIA DO PRODUTOR RURAL
          </div>
        </div>
        <Img
          src={staticFile(LOGO)}
          style={{
            width: 300,
            height: Math.round(300 * LOGO_PROP),
            marginTop: 34,
            opacity: logo,
            transform: `translateY(${(1 - logo) * 16}px)`,
            filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.45))",
          }}
        />
      </AbsoluteFill>
    </Cena>
  );
};

// ---------- luz, partículas e marca d'água ----------
const Particulas: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      {Array.from({ length: 26 }).map((_, i) => {
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
        opacity:
          0.92 *
          ent(f, 10, 28) *
          (1 - ent(f, C.assinatura.de + 30, C.assinatura.de + 50)),
        filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.4))",
      }}
    />
  );
};

const CENAS: [keyof typeof C, React.FC][] = [
  ["gancho", Gancho],
  ["autoria", Autoria],
  ["homenagem", Homenagem],
  ["tempo", Tempo],
  ["marque", Marque],
  ["assinatura", Assinatura],
];

export const ReelProdutorAutor: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ opacity: ent(f, 0, 14) }}>
        {CENAS.map(([nome, Comp], i) => (
          <Sequence
            key={nome}
            from={C[nome].de}
            durationInFrames={C[nome].dur + (i < CENAS.length - 1 ? FUSAO : 0)}
            name={nome}
          >
            <Comp />
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
