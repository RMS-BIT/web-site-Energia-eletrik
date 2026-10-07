import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AREA_SEGURA, CORES, FONTE } from "../tema";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Escurece topo e base para os textos ficarem legíveis, mais vinheta.
export const Legibilidade: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "linear-gradient(180deg, rgba(5,15,28,0.55) 0%, rgba(5,15,28,0) 26%, rgba(5,15,28,0) 45%, rgba(5,15,28,0.88) 88%)," +
        "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)",
    }}
  />
);

// Granulação leve para dar textura de filme.
export const Granulacao: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 0.07, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id="grao">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={2}
            seed={Math.floor(random(`g${frame}`) * 1000)}
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#grao)" />
      </svg>
    </AbsoluteFill>
  );
};

// Visor de inspeção: cantoneiras, mira e linha de varredura.
export const Visor: React.FC<{ duracao: number; rotulo: string }> = ({ duracao, rotulo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 18, stiffness: 140 } });
  const saida = interpolate(frame, [duracao - 6, duracao], [1, 0], clamp);
  const margem = interpolate(s, [0, 1], [10, 150]);
  const varredura = interpolate(frame % 45, [0, 45], [0, 1]);
  const topo = AREA_SEGURA.topo + 40;
  const base = 1920 - AREA_SEGURA.base + 260;
  const altura = 1920 - topo - base;
  const tam = 90;
  const espessura = 7;
  const canto = (pos: React.CSSProperties, bordas: React.CSSProperties) => (
    <div style={{ position: "absolute", width: tam, height: tam, ...pos, ...bordas }} />
  );
  const borda = `${espessura}px solid ${CORES.branco}`;
  return (
    <AbsoluteFill style={{ opacity: s * saida }}>
      {canto({ left: margem, top: topo }, { borderLeft: borda, borderTop: borda })}
      {canto({ right: margem, top: topo }, { borderRight: borda, borderTop: borda })}
      {canto({ left: margem, bottom: base }, { borderLeft: borda, borderBottom: borda })}
      {canto({ right: margem, bottom: base }, { borderRight: borda, borderBottom: borda })}
      <div
        style={{
          position: "absolute",
          left: margem,
          right: margem,
          top: topo + varredura * altura,
          height: 3,
          background: `linear-gradient(90deg, transparent, ${CORES.azulTecnico}, transparent)`,
          boxShadow: `0 0 24px 6px ${CORES.azulTecnico}55`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: topo + altura / 2,
          width: 120,
          height: 120,
          marginLeft: -60,
          marginTop: -60,
          border: `4px solid ${CORES.laranja}`,
          borderRadius: "50%",
          transform: `scale(${interpolate(s, [0, 1], [2.2, 1])}) rotate(${frame * 1.5}deg)`,
          borderTopColor: "transparent",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: margem + 24,
          top: topo + 24,
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontFamily: FONTE,
          fontWeight: 700,
          fontSize: 30,
          letterSpacing: 5,
          color: CORES.branco,
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            background: CORES.laranja,
            opacity: Math.floor(frame / 8) % 2 === 0 ? 1 : 0.25,
          }}
        />
        {rotulo}
      </div>
    </AbsoluteFill>
  );
};

// Marca discreta no topo durante as cenas.
export const MarcaDagua: React.FC<{ marca: string; inicio: number; fim: number }> = ({
  marca,
  inicio,
  fim,
}) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [inicio, inicio + 12, fim - 8, fim], [0, 1, 1, 0], clamp);
  const largura = interpolate(frame, [inicio, inicio + 18], [0, 56], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  return (
    <AbsoluteFill
      style={{
        paddingTop: AREA_SEGURA.topo - 70,
        paddingLeft: AREA_SEGURA.lateral,
        opacity: op * 0.92,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: largura, height: 5, background: CORES.laranja, borderRadius: 3 }} />
        <div
          style={{
            fontFamily: FONTE,
            fontWeight: 900,
            fontSize: 38,
            letterSpacing: 8,
            color: CORES.branco,
            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
          }}
        >
          {marca}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Faixa laranja diagonal que atravessa a tela na passagem para a cartela.
export const PassagemLaranja: React.FC<{ quadro: number }> = ({ quadro }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [quadro - 10, quadro + 8], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  if (p <= 0 || p >= 1) return null;
  const x = interpolate(p, [0, 1], [-2600, 2600]);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: -600,
          left: 0,
          width: 1500,
          height: 3200,
          background: `linear-gradient(90deg, ${CORES.laranjaClaro}, ${CORES.laranja} 30%, ${CORES.laranja} 70%, ${CORES.marinho})`,
          transform: `translateX(${x}px) rotate(18deg)`,
        }}
      />
    </AbsoluteFill>
  );
};
