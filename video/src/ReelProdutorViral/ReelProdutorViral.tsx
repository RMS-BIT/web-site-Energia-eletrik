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

// Reels viral "Dia do Produtor Rural" (10 de outubro, MS).
// Gancho nos 2 primeiros segundos, montagem rápida no tempo da batida
// (120 BPM: 1 corte por compasso de 2 tempos), palavras gigantes com
// "impacto" (zoom + tremor), selo da lei e chamada para marcar um produtor.
// Lei Estadual nº 2.141, de 28/08/2000 (DOE nº 5.338); autoria:
// zeteixeira.com (10/10/2017). Conferido em 09/10/2026.
// As fotos do deputado são apenas enquadradas (nenhuma alteração de pessoas).

const M = linha.marcas;
export const VIRAL_DURACAO = linha.total;
const LOGO = "reel-produtor/logo-ze-verde.png";
const LOGO_PROP = 478 / 850;

const COR = {
  amarelo: "#F6D54A",
  verdeEscuro: "#1E6B3A",
  verdeNoite: "#0E3B22",
  preto: "#111111",
  branco: "#FFFFFF",
};
const SOMBRA = "0 6px 0 rgba(0,0,0,0.35), 0 0 40px rgba(0,0,0,0.55)";

// tremor que decai depois de um impacto
const tremor = (f: number, t0: number, amp = 14, dur = 9) => {
  const k = f - t0;
  if (k < 0 || k > dur) return { x: 0, y: 0 };
  const a = amp * (1 - k / dur);
  return {
    x: (random(`x${t0}-${k}`) - 0.5) * 2 * a,
    y: (random(`y${t0}-${k}`) - 0.5) * 2 * a,
  };
};

// palavra que "bate" na tela: entra grande e assenta com mola rápida
const Impacto: React.FC<{
  em: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ em, children, style }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < em) return null;
  const s = spring({
    frame: f - em,
    fps,
    config: { damping: 12, stiffness: 260, mass: 0.6 },
  });
  const t = tremor(f, em, 10, 8);
  return (
    <div
      style={{
        transform: `translate(${t.x}px, ${t.y}px) scale(${interpolate(s, [0, 1], [1.7, 1])})`,
        opacity: Math.min(1, (f - em + 1) / 2),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Texto: React.FC<{
  children: React.ReactNode;
  tam?: number;
  cor?: string;
}> = ({ children, tam = 120, cor = COR.branco }) => (
  <div
    style={{
      fontFamily: FONTE,
      fontWeight: 900,
      fontSize: tam,
      lineHeight: 0.98,
      letterSpacing: -3,
      textTransform: "uppercase",
      color: cor,
      textShadow: SOMBRA,
      textAlign: "center",
    }}
  >
    {children}
  </div>
);

// destaque em "adesivo" amarelo, levemente torto
const Adesivo: React.FC<{
  children: React.ReactNode;
  tam?: number;
  giro?: number;
}> = ({ children, tam = 110, giro = -3 }) => (
  <div
    style={{
      display: "inline-block",
      padding: "6px 26px 12px",
      borderRadius: 14,
      background: COR.amarelo,
      color: COR.preto,
      fontFamily: FONTE,
      fontWeight: 900,
      fontSize: tam,
      lineHeight: 1,
      letterSpacing: -3,
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      transform: `rotate(${giro}deg)`,
      boxShadow: "0 14px 0 rgba(0,0,0,0.25)",
    }}
  >
    {children}
  </div>
);

// foto em tela cheia com "soco" de zoom no corte
const FotoSoco: React.FC<{
  src: string;
  foco: string;
  dur: number;
  filtro?: string;
  escurece?: number;
}> = ({ src, foco, dur, filtro = "", escurece = 0.3 }) => {
  const f = useCurrentFrame();
  const soco = interpolate(f, [0, 8], [1.28, 1.08], {
    ...clamp,
    easing: (x) => 1 - (1 - x) ** 3,
  });
  const lento = interpolate(f, [8, dur], [0, 0.05], clamp);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: foco,
          filter: `contrast(1.12) saturate(1.2) ${filtro}`,
          transform: `scale(${soco + lento})`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(0,0,0,${escurece * 0.6}) 0%, rgba(0,0,0,${escurece * 0.2}) 40%, rgba(0,0,0,${escurece * 1.4}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// clarão branco de 3 quadros em cada corte
const Flash: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: "#FFF",
        opacity: interpolate(f, [0, 3], [0.7, 0], clamp),
        pointerEvents: "none",
      }}
    />
  );
};

type Corte = {
  de: number;
  src: string;
  foco: string;
  texto: React.ReactNode;
  baixo?: boolean;
  filtro?: string;
};

const Montagem: React.FC<Corte & { dur: number }> = ({
  src,
  foco,
  texto,
  baixo,
  filtro,
  dur,
}) => (
  <AbsoluteFill>
    <FotoSoco src={src} foco={foco} dur={dur} filtro={filtro} />
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: baixo ? "flex-end" : "center",
        padding: baixo ? "0 60px 470px" : "0 60px 120px",
      }}
    >
      <Impacto em={2}>{texto}</Impacto>
    </AbsoluteFill>
    <Flash />
  </AbsoluteFill>
);

// fotos: soja/semente/milho/tablet = banco de imagens; ze-* = fotos do deputado
const CORTES: Corte[] = [
  {
    de: 60,
    src: "reel-produtor/foto-soja.jpg",
    foco: "50% 50%",
    texto: <Texto>Quem planta</Texto>,
  },
  {
    de: 90,
    src: "reel-produtor/ze-gado.jpg",
    foco: "75% 50%",
    texto: <Texto>Quem cria</Texto>,
    baixo: true,
  },
  {
    de: 120,
    src: "reel-produtor/foto-milho.jpg",
    foco: "72% 50%",
    texto: <Texto>Quem colhe</Texto>,
  },
  {
    de: 150,
    src: "reel-produtor/foto-semente.jpg",
    foco: "55% 50%",
    texto: (
      <Texto tam={104}>
        Quem cuida
        <br />
        da terra
      </Texto>
    ),
    baixo: true,
  },
  {
    de: 180,
    src: "reel-produtor/foto-milho.jpg",
    foco: "30% 50%",
    texto: <Texto>Faça chuva</Texto>,
    filtro: "hue-rotate(-12deg) brightness(0.85)",
  },
  {
    de: 210,
    src: "reel-produtor/foto-tablet.jpg",
    foco: "55% 50%",
    texto: <Texto>Ou faça sol</Texto>,
    filtro: "sepia(0.2) brightness(1.05)",
  },
  {
    de: 240,
    src: "reel-produtor/ze-soja.jpg",
    foco: "55% 50%",
    texto: <Texto tam={110}>Todo santo dia</Texto>,
    baixo: true,
  },
  {
    de: 270,
    src: "reel-produtor/foto-soja.jpg",
    foco: "40% 60%",
    texto: (
      <div style={{ textAlign: "center" }}>
        <Texto tam={96}>Leva comida</Texto>
        <div style={{ marginTop: 18 }}>
          <Adesivo tam={96}>à sua mesa</Adesivo>
        </div>
      </div>
    ),
  },
];

// ---------- Gancho (0–2 s) ----------
const Gancho: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {f < 30 ? (
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: 140,
          }}
        >
          <Impacto em={1}>
            <Texto tam={140}>Se você</Texto>
          </Impacto>
          <Impacto em={13}>
            <Texto tam={140}>comeu hoje,</Texto>
          </Impacto>
        </AbsoluteFill>
      ) : (
        <Sequence from={30} layout="none">
          <AbsoluteFill>
            <FotoSoco
              src="reel-produtor/foto-semente.jpg"
              foco="55% 50%"
              dur={30}
              escurece={0.55}
            />
            <AbsoluteFill
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingBottom: 140,
              }}
            >
              <Impacto em={1}>
                <Texto tam={84}>agradeça a um</Texto>
              </Impacto>
              <div style={{ height: 22 }} />
              <Impacto em={12}>
                <Adesivo tam={96}>produtor rural</Adesivo>
              </Impacto>
            </AbsoluteFill>
            <Flash />
          </AbsoluteFill>
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

// ---------- Quebra: "Em MS, 10/10 é Dia do Produtor Rural" ----------
const Quebra: React.FC = () => {
  const f = useCurrentFrame();
  const pulso = 1 + Math.max(0, Math.sin((f / 15) * Math.PI)) * 0.02 * (f / 60);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 45%, ${COR.verdeEscuro} 0%, ${COR.verdeNoite} 80%)`,
      }}
    >
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: 140,
          transform: `scale(${pulso})`,
        }}
      >
        <Impacto em={2}>
          <Texto tam={64}>Em Mato Grosso do Sul,</Texto>
        </Impacto>
        <Impacto em={20}>
          <Texto tam={330} cor={COR.amarelo}>
            10/10
          </Texto>
        </Impacto>
        <Impacto em={38}>
          <Texto tam={78}>
            é Dia do
            <br />
            Produtor Rural
          </Texto>
        </Impacto>
      </AbsoluteFill>
      <Flash />
    </AbsoluteFill>
  );
};

// ---------- Lei e autoria (sobre as fotos do deputado) ----------
const Lei: React.FC<{ etapa: 0 | 1 }> = ({ etapa }) => (
  <AbsoluteFill>
    <FotoSoco
      src={
        etapa === 0 ? "reel-produtor/ze-soja.jpg" : "reel-produtor/ze-gado.jpg"
      }
      foco={etapa === 0 ? "55% 50%" : "75% 50%"}
      dur={30}
      escurece={0.5}
    />
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 60px 450px",
      }}
    >
      {etapa === 0 ? (
        <Impacto em={2}>
          <div style={{ textAlign: "center" }}>
            <Texto tam={60}>Data criada pela</Texto>
            <div style={{ marginTop: 14 }}>
              <Adesivo tam={84} giro={-2}>
                Lei nº 2.141/2000
              </Adesivo>
            </div>
          </div>
        </Impacto>
      ) : (
        <Impacto em={2}>
          <div style={{ textAlign: "center" }}>
            <Texto tam={60}>de autoria do</Texto>
            <div style={{ marginTop: 14 }}>
              <Adesivo tam={78} giro={2}>
                Dep. Zé Teixeira
              </Adesivo>
            </div>
          </div>
        </Impacto>
      )}
    </AbsoluteFill>
    <Flash />
  </AbsoluteFill>
);

// ---------- Chamada: marcar um produtor ----------
const Chamada: React.FC = () => {
  const f = useCurrentFrame();
  const seta = Math.abs(Math.sin((f / 15) * Math.PI)) * 26;
  return (
    <AbsoluteFill>
      <FotoSoco
        src="reel-produtor/foto-tablet.jpg"
        foco="55% 50%"
        dur={60}
        escurece={0.75}
      />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: 160,
        }}
      >
        <Impacto em={2}>
          <Texto tam={104}>Marque um</Texto>
        </Impacto>
        <div style={{ height: 18 }} />
        <Impacto em={10}>
          <Adesivo tam={92}>produtor rural</Adesivo>
        </Impacto>
        <div style={{ height: 18 }} />
        <Impacto em={20}>
          <Texto tam={76}>que você admira</Texto>
        </Impacto>
        {f >= 28 ? (
          <svg
            width="120"
            height="140"
            viewBox="0 0 120 140"
            style={{ marginTop: 40, transform: `translateY(${seta}px)` }}
          >
            <path
              d="M60 10 V110 M20 72 L60 115 L100 72"
              fill="none"
              stroke={COR.amarelo}
              strokeWidth={18}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </AbsoluteFill>
      <Flash />
    </AbsoluteFill>
  );
};

// ---------- Final: parabéns + logo ----------
const Final: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({
    frame: f - 14,
    fps,
    config: { damping: 11, stiffness: 120 },
  });
  const W = 920;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 50%, ${COR.verdeEscuro} 0%, ${COR.verdeNoite} 85%)`,
      }}
    >
      <svg
        width={1080}
        height={1920}
        style={{ position: "absolute", opacity: 0.16 }}
      >
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i / 16) * Math.PI * 2 + f / 60;
          return (
            <line
              key={i}
              x1={540}
              y1={980}
              x2={540 + Math.cos(a) * 1200}
              y2={980 + Math.sin(a) * 1200}
              stroke={COR.amarelo}
              strokeWidth={40}
            />
          );
        })}
      </svg>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 300 }}>
        <Impacto em={1}>
          <Texto tam={110}>Parabéns,</Texto>
        </Impacto>
        <div style={{ height: 16 }} />
        <Impacto em={7}>
          <Adesivo tam={90}>produtor rural!</Adesivo>
        </Impacto>
        <div
          style={{
            marginTop: 90,
            opacity: Math.min(1, logo * 1.5),
            transform: `scale(${0.4 + 0.6 * logo}) rotate(${(1 - logo) * -8}deg)`,
            filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.45))",
          }}
        >
          <Img
            src={staticFile(LOGO)}
            style={{ width: W, height: Math.round(W * LOGO_PROP) }}
          />
        </div>
        <div style={{ marginTop: 34, opacity: ent(f, 30, 44) }}>
          <Texto tam={40}>10 de outubro · Mato Grosso do Sul</Texto>
        </div>
      </AbsoluteFill>
      <Flash />
    </AbsoluteFill>
  );
};

const Grao: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        mixBlendMode: "overlay",
        opacity: 0.18,
        pointerEvents: "none",
      }}
    >
      <Img
        src={staticFile("reel-produtor/grao.jpg")}
        style={{
          position: "absolute",
          left: -Math.floor(random(`gx${f}`) * 500),
          top: -Math.floor(random(`gy${f}`) * 560),
          width: 1600,
          height: 2500,
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
        opacity: 0.95 * (1 - ent(f, M.final - 2, M.final + 4)),
        filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.4))",
      }}
    />
  );
};

export const ReelProdutorViral: React.FC = () => {
  const sfx = (de: number, arq: string, vol: number, n = 30) => (
    <Sequence key={`${arq}${de}`} from={de} durationInFrames={n} name={arq}>
      <Audio src={staticFile(`audio/r43/${arq}.wav`)} volume={vol} />
    </Sequence>
  );
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence durationInFrames={M.drop} name="gancho">
        <Gancho />
      </Sequence>
      {CORTES.map((c) => (
        <Sequence
          key={c.de}
          from={c.de}
          durationInFrames={30}
          name={`corte ${c.de}`}
        >
          <Montagem {...c} dur={30} />
        </Sequence>
      ))}
      <Sequence
        from={M.quebra}
        durationInFrames={M.drop2 - M.quebra}
        name="quebra 10/10"
      >
        <Quebra />
      </Sequence>
      <Sequence from={M.drop2} durationInFrames={30} name="lei">
        <Lei etapa={0} />
      </Sequence>
      <Sequence from={M.drop2 + 30} durationInFrames={30} name="autoria">
        <Lei etapa={1} />
      </Sequence>
      <Sequence from={M.cta} durationInFrames={M.final - M.cta} name="marque">
        <Chamada />
      </Sequence>
      <Sequence
        from={M.final}
        durationInFrames={VIRAL_DURACAO - M.final}
        name="final"
      >
        <Final />
      </Sequence>
      <Grao />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.35) 100%)",
          pointerEvents: "none",
        }}
      />
      <MarcaDagua />

      <Audio
        src={staticFile("reel-produtor/trilha-viral.wav")}
        volume={(x) =>
          interpolate(x, [VIRAL_DURACAO - 15, VIRAL_DURACAO], [1, 0], clamp)
        }
      />
      {[1, 13, 42].map((q) => sfx(q, "hit", 0.35))}
      {[...CORTES.map((c) => c.de), M.drop2, M.drop2 + 30, M.cta].map((q) =>
        sfx(q - 3, "swish", 0.12),
      )}
      {[M.quebra + 20, M.final + 7].map((q) => sfx(q, "impacto", 0.3, 60))}
    </AbsoluteFill>
  );
};
