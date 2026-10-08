import {
  AbsoluteFill,
  Easing,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { SOBREPOSICAO, type Cena } from "../roteiro";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const suave = Easing.bezier(0.22, 1, 0.36, 1);

// Envolve uma cena: entra com fusão + desfoque + leve recuo de escala.
export const CenaComFusao: React.FC<{
  cena: Cena;
  primeira?: boolean;
  children: React.ReactNode;
}> = ({ cena, primeira, children }) => {
  const de = primeira ? cena.inicio : cena.inicio - SOBREPOSICAO;
  return (
    <Sequence from={de} durationInFrames={cena.fim - de} name={cena.id}>
      <Fusao ativa={!primeira}>{children}</Fusao>
    </Sequence>
  );
};

const Fusao: React.FC<{ ativa: boolean; children: React.ReactNode }> = ({ ativa, children }) => {
  const frame = useCurrentFrame();
  if (!ativa) return <AbsoluteFill>{children}</AbsoluteFill>;
  const p = interpolate(frame, [0, SOBREPOSICAO + 4], [0, 1], { ...clamp, easing: suave });
  return (
    <AbsoluteFill
      style={{
        opacity: p,
        filter: `blur(${(1 - p) * 18}px)`,
        transform: `scale(${1.06 - 0.06 * p})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// Clipe com movimento de câmera lento e contínuo.
export const Clipe: React.FC<{
  src: string;
  inicioNoClipe: number; // s
  duracao: number; // quadros da cena (para o movimento)
  escala: [number, number];
  origem?: [number, number]; // px no quadro 1080x1920
  velocidade?: number;
  deriva?: [number, number]; // deslocamento em px ao longo da cena
}> = ({ src, inicioNoClipe, duracao, escala, origem = [540, 960], velocidade = 1, deriva = [0, 0] }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, duracao], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const s = escala[0] + (escala[1] - escala[0]) * p;
  return (
    <AbsoluteFill style={{ backgroundColor: "black", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transformOrigin: `${origem[0]}px ${origem[1]}px`,
          transform: `translate(${deriva[0] * p}px, ${deriva[1] * p}px) scale(${s})`,
        }}
      >
        <OffthreadVideo
          src={staticFile(src)}
          trimBefore={Math.round(inicioNoClipe * 30)}
          playbackRate={velocidade}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
