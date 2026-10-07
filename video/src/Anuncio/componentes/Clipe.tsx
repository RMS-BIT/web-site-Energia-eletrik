import {
  AbsoluteFill,
  Easing,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Cena } from "../timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Um clipe com zoom contínuo (Ken Burns) e uma entrada animada.
export const Clipe: React.FC<{ cena: Cena; volume: number }> = ({
  cena,
  volume,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoom = interpolate(frame, [0, cena.duracao], [cena.zoomDe, cena.zoomPara], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });

  let escalaEntrada = 1;
  let deslocX = 0;
  let desfoque = 0;
  let brilho = 1;

  if (cena.entrada === "punch") {
    const s = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });
    escalaEntrada = interpolate(s, [0, 1], [1.18, 1]);
    brilho = interpolate(frame, [0, 6], [1.6, 1], clamp);
  } else if (cena.entrada === "chicote") {
    deslocX = interpolate(frame, [0, 8], [-420, 0], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
    desfoque = interpolate(frame, [0, 8], [28, 0], clamp);
  } else {
    escalaEntrada = interpolate(frame, [0, 20], [1.25, 1], {
      ...clamp,
      easing: Easing.out(Easing.exp),
    });
    brilho = interpolate(frame, [0, 12], [0, 1], clamp);
  }

  // Saída em chicote: os 4 últimos quadros correm para a direita.
  const saida = interpolate(frame, [cena.duracao - 4, cena.duracao], [0, 1], clamp);
  deslocX += saida * 380;
  desfoque += saida * 24;

  return (
    <AbsoluteFill style={{ backgroundColor: "black", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translateX(${deslocX}px) scale(${zoom * escalaEntrada})`,
          filter: `blur(${desfoque}px) brightness(${brilho})`,
        }}
      >
        <OffthreadVideo
          src={staticFile(cena.clipe)}
          trimBefore={Math.round(cena.inicioNoClipe * fps)}
          playbackRate={cena.velocidade ?? 1}
          volume={volume}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
