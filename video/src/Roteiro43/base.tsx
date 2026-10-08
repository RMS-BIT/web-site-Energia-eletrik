import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  random,
  staticFile,
  useCurrentFrame,
} from "remotion";
import type { Plano } from "./timeline";

export type Camera = { s: number; ox: number; oy: number; tx?: number; ty?: number; blur?: number };

// Plano de vídeo + camadas (vídeo e HUD compartilham a mesma câmera).
export const CenaPlano: React.FC<{
  plano: Plano;
  camera?: (f: number) => Camera;
  hud?: (f: number) => React.ReactNode;
  fora?: (f: number) => React.ReactNode; // camadas fora da câmera (texto fixo)
}> = ({ plano, camera, hud, fora }) => (
  <Sequence from={plano.de} durationInFrames={plano.dur} name={plano.id}>
    <Interno plano={plano} camera={camera} hud={hud} fora={fora} />
  </Sequence>
);

const Interno: React.FC<{
  plano: Plano;
  camera?: (f: number) => Camera;
  hud?: (f: number) => React.ReactNode;
  fora?: (f: number) => React.ReactNode;
}> = ({ plano, camera, hud, fora }) => {
  const f = useCurrentFrame();
  const c = camera ? camera(f) : { s: 1, ox: 540, oy: 960 };
  return (
    <AbsoluteFill style={{ backgroundColor: "black", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transformOrigin: `${c.ox}px ${c.oy}px`,
          transform: `translate(${c.tx ?? 0}px, ${c.ty ?? 0}px) scale(${c.s})`,
          filter: c.blur ? `blur(${c.blur}px)` : undefined,
        }}
      >
        <OffthreadVideo
          src={staticFile(`planos/${plano.id}.mp4`)}
          muted
          style={{ width: "100%", height: "100%", filter: "contrast(1.06) saturate(0.9)" }}
        />
        {hud ? hud(f) : null}
      </AbsoluteFill>
      <Vinheta />
      {fora ? fora(f) : null}
    </AbsoluteFill>
  );
};

export const Vinheta: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.42) 100%)," +
        "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.45) 100%)",
      pointerEvents: "none",
    }}
  />
);

export const Grao: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 0.045, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id="graoR43">
          <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves={2} seed={Math.floor(random(`g${f % 30}`) * 999)} />
        </filter>
        <rect width="100%" height="100%" filter="url(#graoR43)" />
      </svg>
    </AbsoluteFill>
  );
};

// Efeito sonoro num quadro absoluto.
export const Sfx: React.FC<{ nome: string; em: number; volume?: number; dur?: number }> = ({
  nome,
  em,
  volume = 0.6,
  dur = 90,
}) => (
  <Sequence from={Math.max(0, em)} durationInFrames={dur} name={`sfx ${nome}`}>
    <Audio src={staticFile(`audio/r43/${nome}.wav`)} volume={volume} />
  </Sequence>
);
