import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COR, FONTE, SEGURA } from "../tema";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const suave = Easing.bezier(0.22, 1, 0.36, 1);

// Anéis finos que se expandem a partir de um ponto: o "som" virando imagem.
export const AneisSonar: React.FC<{
  x: number;
  y: number;
  inicio: number;
  intervalo?: number;
  quantidade?: number;
  raioMax?: number;
}> = ({ x, y, inicio, intervalo = 18, quantidade = 6, raioMax = 520 }) => {
  const frame = useCurrentFrame();
  const vida = 54;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        {Array.from({ length: quantidade }).map((_, i) => {
          const f = frame - inicio - i * intervalo;
          if (f < 0 || f > vida) return null;
          const p = f / vida;
          const r = 30 + raioMax * Easing.out(Easing.cubic)(p);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={r}
              fill="none"
              stroke={i % 3 === 2 ? COR.azulClaro : COR.branco}
              strokeWidth={3.2 - p * 2}
              opacity={(1 - p) * 0.95}
            />
          );
        })}
        <circle
          cx={x}
          cy={y}
          r={10}
          fill={COR.branco}
          opacity={interpolate(frame - inicio, [0, 8], [0, 0.95], clamp)}
        />
        <circle
          cx={x}
          cy={y}
          r={10 + 8 * Math.abs(Math.sin((frame - inicio) / 6))}
          fill="none"
          stroke={COR.branco}
          strokeWidth={2}
          opacity={interpolate(frame - inicio, [0, 8], [0, 0.6], clamp)}
        />
      </svg>
    </AbsoluteFill>
  );
};

// Linha de onda sonora atravessando a tela; amplitude 0 = linha reta.
export const OndaSonora: React.FC<{ y: number; amplitude: (frame: number) => number }> = ({
  y,
  amplitude,
}) => {
  const frame = useCurrentFrame();
  const a = amplitude(frame);
  const pontos: string[] = [];
  for (let x = 0; x <= 1080; x += 6) {
    const env = Math.sin((Math.PI * x) / 1080);
    const v =
      Math.sin(x / 23 + frame * 0.45) * 0.55 +
      Math.sin(x / 9.5 - frame * 0.8) * 0.3 +
      (random(`n${Math.floor(x / 6)}-${frame}`) - 0.5) * 0.3;
    pontos.push(`${x},${(y + v * a * env).toFixed(1)}`);
  }
  const aparece = interpolate(frame, [0, 10], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ opacity: aparece }}>
      <svg width="100%" height="100%">
        <defs>
          <linearGradient id="onda" x1="0" x2="1">
            <stop offset="0" stopColor={COR.branco} stopOpacity="0" />
            <stop offset="0.5" stopColor={COR.branco} stopOpacity="1" />
            <stop offset="1" stopColor={COR.branco} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={pontos.join(" ")} fill="none" stroke="url(#onda)" strokeWidth={3} />
      </svg>
    </AbsoluteFill>
  );
};

// Rótulo pequeno e espaçado, com traço azul (estilo interface).
export const Rotulo: React.FC<{ texto: string; inicio?: number; cor?: string }> = ({
  texto,
  inicio = 0,
  cor = COR.branco,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - inicio, [0, 16], [0, 1], { ...clamp, easing: suave });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: p }}>
      <div style={{ width: 44 * p, height: 2, background: COR.azulVivo }} />
      <div
        style={{
          fontFamily: FONTE,
          fontWeight: 500,
          fontSize: 26,
          letterSpacing: 7,
          color: cor,
          textTransform: "uppercase",
          transform: `translateX(${(1 - p) * -12}px)`,
          textShadow: cor === COR.branco ? "0 2px 12px rgba(0,10,30,0.5)" : "none",
        }}
      >
        {texto}
      </div>
    </div>
  );
};

// Mira de foco: cantoneiras finas que fecham sobre o alvo.
export const MiraFoco: React.FC<{
  x: number;
  y: number;
  largura: number;
  altura: number;
  inicio: number;
  rotulo: string;
}> = ({ x, y, largura, altura, inicio, rotulo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - inicio, fps, config: { damping: 22, stiffness: 120 } });
  const folga = (1 - s) * 90;
  const w = largura + folga * 2;
  const h = altura + folga * 2;
  const c = 46;
  const linha = `2.5px solid ${COR.branco}`;
  const canto = (st: React.CSSProperties) => (
    <div style={{ position: "absolute", width: c, height: c, ...st }} />
  );
  return (
    <AbsoluteFill style={{ opacity: s }}>
      <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h }}>
        {canto({ left: 0, top: 0, borderLeft: linha, borderTop: linha })}
        {canto({ right: 0, top: 0, borderRight: linha, borderTop: linha })}
        {canto({ left: 0, bottom: 0, borderLeft: linha, borderBottom: linha })}
        {canto({ right: 0, bottom: 0, borderRight: linha, borderBottom: linha })}
        <div style={{ position: "absolute", left: 0, top: -54 }}>
          <Rotulo texto={rotulo} inicio={inicio + 8} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Cartões de vidro com as leituras que o equipamento estima.
export type Leitura = { rotulo: string; unidade: string; destaque: number };

export const CartoesLeitura: React.FC<{ leituras: Leitura[]; inicio: number; fim: number }> = ({
  leituras,
  inicio,
  fim,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const saida = interpolate(frame, [fim - 10, fim], [1, 0], clamp);
  return (
    <AbsoluteFill
      style={{
        paddingTop: SEGURA.topo + 30,
        paddingLeft: SEGURA.lateral,
        paddingRight: SEGURA.lateral,
        gap: 18,
        opacity: saida,
      }}
    >
      <Rotulo texto="Leitura em tempo real" inicio={inicio} />
      <div style={{ height: 8 }} />
      {leituras.map((l, i) => {
        const s = spring({ frame: frame - inicio - 6 - i * 6, fps, config: { damping: 20, stiffness: 140 } });
        const ativo = interpolate(frame, [l.destaque - 4, l.destaque + 6], [0, 1], clamp);
        return (
          <div
            key={l.rotulo}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "26px 32px",
              borderRadius: 24,
              background: `rgba(255,255,255,${0.12 + ativo * 0.78})`,
              border: "1px solid rgba(255,255,255,0.45)",
              backdropFilter: "blur(22px)",
              boxShadow: `0 20px 50px rgba(3,15,40,${0.18 + ativo * 0.12})`,
              transform: `translateY(${(1 - s) * 40}px) scale(${0.98 + ativo * 0.02})`,
              opacity: s,
              fontFamily: FONTE,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  background: ativo > 0.5 ? COR.azul : COR.branco,
                  boxShadow: ativo > 0.5 ? `0 0 0 ${6 + 4 * Math.sin(frame / 4)}px ${COR.azul}33` : "none",
                }}
              />
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 600,
                  letterSpacing: -0.3,
                  color: ativo > 0.5 ? COR.marinho : COR.branco,
                }}
              >
                {l.rotulo}
              </div>
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 500,
                letterSpacing: 2,
                color: ativo > 0.5 ? COR.azul : "rgba(255,255,255,0.85)",
              }}
            >
              {l.unidade}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Acabamento: vinheta suave, gradientes de leitura e granulação fina.
export const Acabamento: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(4,14,34,0.45) 0%, rgba(4,14,34,0) 22%, rgba(4,14,34,0) 58%, rgba(4,14,34,0.7) 100%)," +
            "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 60%, rgba(0,8,24,0.35) 100%)",
        }}
      />
      <AbsoluteFill style={{ opacity: 0.05, mixBlendMode: "overlay" }}>
        <svg width="100%" height="100%">
          <filter id="graoFino">
            <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves={2} seed={frame % 24} />
          </filter>
          <rect width="100%" height="100%" filter="url(#graoFino)" />
        </svg>
      </AbsoluteFill>
    </>
  );
};

// Assinatura discreta no topo, em traço fino como o logo.
export const Assinatura: React.FC<{ inicio: number; fim: number }> = ({ inicio, fim }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [inicio, inicio + 14, fim - 10, fim], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: SEGURA.topo - 80, opacity: op }}>
      <div
        style={{
          fontFamily: FONTE,
          fontWeight: 300,
          fontSize: 34,
          letterSpacing: 16,
          paddingLeft: 16,
          color: COR.branco,
          textShadow: "0 2px 14px rgba(0,10,30,0.45)",
        }}
      >
        SOLVER
      </div>
    </AbsoluteFill>
  );
};
