import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COR, FONTE } from "../tema";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const suave = Easing.bezier(0.22, 1, 0.36, 1);

// Vinheta de marca com o logo escuro (arte 16:9 enviada pela empresa).
export const MarcaEscura: React.FC<{ duracao: number }> = ({ duracao }) => {
  const frame = useCurrentFrame();
  const abre = interpolate(frame, [4, 30], [0, 1], { ...clamp, easing: suave });
  const deriva = interpolate(frame, [0, duracao], [1.05, 1], clamp);
  const larg = 1200;
  const alt = (larg * 941) / 1672;
  return (
    <AbsoluteFill style={{ backgroundColor: COR.marinho, overflow: "hidden" }}>
      <AbsoluteFill style={{ filter: "blur(40px) brightness(0.7)", transform: "scale(1.3)" }}>
        <Img
          src={staticFile("marca/solver-escuro.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 180 }}>
        <div
          style={{
            width: larg,
            height: alt,
            transform: `scale(${deriva})`,
            clipPath: `inset(0 ${(1 - abre) * 50}% 0 ${(1 - abre) * 50}%)`,
            filter: `blur(${(1 - abre) * 10}px)`,
            WebkitMaskImage:
              "linear-gradient(90deg, transparent 0%, black 12%, black 88%, transparent 100%), linear-gradient(180deg, transparent 0%, black 14%, black 86%, transparent 100%)",
            WebkitMaskComposite: "source-in",
          }}
        >
          <Img src={staticFile("marca/solver-escuro.png")} style={{ width: "100%", height: "100%" }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Regiões do logo claro (px na arte original 941x1672).
type Regiao = [number, number, number, number];
const ESFERA: Regiao = [55, 690, 310, 931];
const NOME: Regiao = [295, 720, 875, 878];
const SLOGAN: Regiao = [300, 878, 830, 930];
const SITE: Regiao = [215, 930, 805, 990];
const K = 1080 / 941;

const Camada: React.FC<{ regiao: Regiao; estilo: React.CSSProperties; clipExtra?: string }> = ({
  regiao,
  estilo,
}) => {
  const [x0, y0, x1, y1] = regiao;
  const clip = `polygon(${x0 * K}px ${y0 * K}px, ${x1 * K}px ${y0 * K}px, ${x1 * K}px ${y1 * K}px, ${x0 * K}px ${y1 * K}px)`;
  return (
    <AbsoluteFill
      style={{
        clipPath: clip,
        transformOrigin: `${((x0 + x1) / 2) * K}px ${((y0 + y1) / 2) * K}px`,
        ...estilo,
      }}
    >
      <Img src={staticFile("marca/solver-claro.jpg")} style={{ width: 1080, position: "absolute", top: 0 }} />
    </AbsoluteFill>
  );
};

// Cartela final: logo claro montado em partes + chamada para ação.
export const CartelaFinal: React.FC<{ cta: string; kicker: string }> = ({ cta, kicker }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const mola = (atraso: number, rigidez = 120) =>
    spring({ frame: frame - atraso, fps, config: { damping: 20, stiffness: rigidez } });

  const esfera = mola(6);
  const nome = interpolate(frame, [14, 40], [0, 1], { ...clamp, easing: suave });
  const slogan = mola(30);
  const site = mola(38);
  const completo = interpolate(frame, [52, 64], [0, 1], clamp);
  const botao = mola(46, 150);
  const brilho = interpolate((frame - 70) % 75, [0, 30], [-0.3, 1.3], clamp);
  const kick = interpolate(frame, [20, 40], [0, 1], { ...clamp, easing: suave });
  const deriva = interpolate(frame, [0, durationInFrames], [1.0, 1.035], clamp);

  const [nx0, , nx1] = NOME;
  const larguraNome = (nx1 - nx0) * K;

  return (
    <AbsoluteFill style={{ backgroundColor: COR.gelo, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${deriva})` }}>
        <Img
          src={staticFile("marca/solver-claro-fundo.jpg")}
          style={{ width: 1080, position: "absolute", top: 0 }}
        />
        <Camada
          regiao={ESFERA}
          estilo={{
            opacity: esfera,
            transform: `scale(${0.7 + 0.3 * esfera}) rotate(${(1 - esfera) * -40}deg)`,
          }}
        />
        <Camada
          regiao={NOME}
          estilo={{
            clipPath: `polygon(${nx0 * K}px ${NOME[1] * K}px, ${nx0 * K + larguraNome * nome}px ${NOME[1] * K}px, ${nx0 * K + larguraNome * nome}px ${NOME[3] * K}px, ${nx0 * K}px ${NOME[3] * K}px)`,
            transform: `translateX(${(1 - nome) * -24}px)`,
          }}
        />
        <Camada regiao={SLOGAN} estilo={{ opacity: slogan, transform: `translateY(${(1 - slogan) * 24}px)` }} />
        <Camada regiao={SITE} estilo={{ opacity: site, transform: `translateY(${(1 - site) * 24}px)` }} />
        <AbsoluteFill style={{ opacity: completo }}>
          <Img src={staticFile("marca/solver-claro.jpg")} style={{ width: 1080, position: "absolute", top: 0 }} />
        </AbsoluteFill>
      </AbsoluteFill>

      {/* Kicker acima do logo */}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 640, opacity: kick }}>
        <div
          style={{
            fontFamily: FONTE,
            fontWeight: 500,
            fontSize: 28,
            letterSpacing: 8,
            paddingLeft: 8,
            color: COR.azul,
            textTransform: "uppercase",
            transform: `translateY(${(1 - kick) * 14}px)`,
          }}
        >
          {kicker}
        </div>
        <div style={{ width: 60 * kick, height: 2, background: COR.azul, marginTop: 22 }} />
      </AbsoluteFill>

      {/* Botão */}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 1250 }}>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            gap: 22,
            padding: "34px 58px",
            borderRadius: 999,
            background: `linear-gradient(135deg, ${COR.azul}, #1546A8)`,
            color: COR.branco,
            fontFamily: FONTE,
            fontWeight: 600,
            fontSize: 44,
            letterSpacing: 0.3,
            boxShadow: `0 24px 60px ${COR.azul}55`,
            opacity: botao,
            transform: `translateY(${(1 - botao) * 40}px) scale(${0.96 + 0.04 * botao})`,
          }}
        >
          {cta}
          <span style={{ fontWeight: 400, fontSize: 46 }}>→</span>
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: 120,
              left: `${brilho * 100}%`,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
              transform: "skewX(-20deg)",
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
