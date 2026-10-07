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
import { CORES, FONTE } from "../tema";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const CartelaFinal: React.FC<{
  marca: string;
  segmento: string;
  slogan: string;
  cta: string;
  contato: string;
}> = ({ marca, segmento, slogan, cta, contato }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const listras = interpolate(frame, [0, durationInFrames], [0, -220]);
  const linha = interpolate(frame, [14, 34], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const aparece = (inicio: number) => spring({ frame: frame - inicio, fps, config: { damping: 18 } });
  const pulso = 1 + 0.035 * Math.sin(Math.max(0, frame - 70) / 5);
  const fimFade = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: CORES.marinho, fontFamily: FONTE }}>
      <AbsoluteFill style={{ filter: "blur(18px) saturate(0.6)", transform: "scale(1.15)", opacity: 0.35 }}>
        <OffthreadVideo
          src={staticFile("clips/6509.mp4")}
          trimBefore={7 * fps}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `linear-gradient(160deg, ${CORES.marinho}EE 0%, ${CORES.marinhoClaro}CC 55%, ${CORES.marinho}F2 100%)`,
        }}
      />
      {/* Listras diagonais em movimento lento, no rodapé */}
      <AbsoluteFill style={{ overflow: "hidden", opacity: 0.13 }}>
        <div
          style={{
            position: "absolute",
            left: -400,
            right: -400,
            bottom: -200,
            height: 620,
            transform: `translateX(${listras}px) rotate(-8deg)`,
            background: `repeating-linear-gradient(135deg, ${CORES.laranja} 0 40px, transparent 40px 110px)`,
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: 220,
          opacity: fimFade,
        }}
      >
        <div style={{ display: "flex", overflow: "hidden", paddingBottom: 8 }}>
          {marca.split("").map((letra, i) => {
            const s = spring({
              frame: frame - 4 - i * 2.5,
              fps,
              config: { damping: 13, stiffness: 160, mass: 0.6 },
            });
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  fontSize: 190,
                  fontWeight: 900,
                  letterSpacing: 6,
                  color: CORES.branco,
                  transform: `translateY(${(1 - s) * 120}%)`,
                }}
              >
                {letra}
              </span>
            );
          })}
        </div>
        <div
          style={{
            width: 520 * linha,
            height: 10,
            borderRadius: 5,
            background: CORES.laranja,
            margin: "18px 0 30px",
          }}
        />
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            letterSpacing: 12,
            color: CORES.branco,
            opacity: aparece(22),
            textTransform: "uppercase",
          }}
        >
          {segmento}
        </div>
        <div
          style={{
            marginTop: 110,
            fontSize: 62,
            fontWeight: 800,
            color: CORES.branco,
            textAlign: "center",
            lineHeight: 1.15,
            maxWidth: 960,
            opacity: aparece(36),
            transform: `translateY(${(1 - aparece(36)) * 40}px)`,
          }}
        >
          {slogan}
        </div>
        <div
          style={{
            marginTop: 70,
            padding: "30px 64px",
            borderRadius: 999,
            background: CORES.laranja,
            color: CORES.branco,
            fontSize: 46,
            fontWeight: 800,
            letterSpacing: 1,
            boxShadow: `0 18px 50px ${CORES.laranja}66`,
            transform: `scale(${aparece(52) * pulso})`,
          }}
        >
          {cta}
        </div>
        {contato ? (
          <div
            style={{
              marginTop: 36,
              fontSize: 44,
              fontWeight: 700,
              color: CORES.branco,
              opacity: aparece(62),
            }}
          >
            {contato}
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
