import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AREA_SEGURA, CORES, FONTE } from "../tema";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Posicao = "topo" | "centro" | "base";

const posicaoEstilo = (p: Posicao): React.CSSProperties => {
  if (p === "topo") return { justifyContent: "flex-start", paddingTop: AREA_SEGURA.topo + 60 };
  if (p === "centro") return { justifyContent: "center" };
  return { justifyContent: "flex-end", paddingBottom: 1920 - AREA_SEGURA.base };
};

// Saída comum: sobe e some nos últimos quadros da cena.
const useSaida = (duracao: number) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [duracao - 8, duracao - 1], [0, 1], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });
  return { opacity: 1 - p, transform: `translateY(${-40 * p}px)` };
};

// Título palavra por palavra: cada palavra sobe de dentro de uma máscara.
export const TituloCinetico: React.FC<{
  linhas: readonly string[];
  destaque?: number; // linha com tarja laranja
  duracao: number;
  atraso?: number;
  posicao?: Posicao;
  tamanho?: number;
  kicker?: string;
}> = ({ linhas, destaque, duracao, atraso = 4, posicao = "base", tamanho = 104, kicker }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const saida = useSaida(duracao);
  let indice = 0;

  return (
    <AbsoluteFill
      style={{
        ...posicaoEstilo(posicao),
        paddingLeft: AREA_SEGURA.lateral,
        paddingRight: AREA_SEGURA.lateral,
        fontFamily: FONTE,
      }}
    >
      <div style={saida}>
        {kicker ? <Kicker texto={kicker} atraso={atraso} /> : null}
        {linhas.map((linha, li) => {
          const ehDestaque = li === destaque;
          const inicioLinha = atraso + 4 + li * 7;
          const tarja = spring({
            frame: frame - inicioLinha + 2,
            fps,
            config: { damping: 20, stiffness: 160 },
          });
          return (
            <div key={li} style={{ position: "relative", display: "block", marginTop: li === 0 ? 0 : 6 }}>
              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  padding: ehDestaque ? "4px 22px 10px" : 0,
                  marginLeft: ehDestaque ? -22 : 0,
                }}
              >
                {ehDestaque ? (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: CORES.laranja,
                      transform: `scaleX(${tarja})`,
                      transformOrigin: "left center",
                      borderRadius: 6,
                    }}
                  />
                ) : null}
                {linha.split(" ").map((palavra, wi) => {
                  const i = indice++;
                  const s = spring({
                    frame: frame - atraso - 4 - i * 3,
                    fps,
                    config: { damping: 16, stiffness: 170, mass: 0.7 },
                  });
                  return (
                    <span
                      key={wi}
                      style={{
                        display: "inline-block",
                        overflow: "hidden",
                        verticalAlign: "bottom",
                        fontSize: tamanho,
                        marginRight: "0.26em",
                        paddingBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          transform: `translateY(${(1 - s) * 115}%)`,
                          fontSize: tamanho,
                          fontWeight: 900,
                          lineHeight: 1.02,
                          letterSpacing: -1.5,
                          color: CORES.branco,
                          textTransform: "uppercase",
                          textShadow: ehDestaque ? "none" : "0 6px 30px rgba(0,0,0,0.45)",
                          position: "relative",
                        }}
                      >
                        {palavra}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Linha laranja + texto pequeno acima do título.
export const Kicker: React.FC<{ texto: string; atraso?: number }> = ({ texto, atraso = 0 }) => {
  const frame = useCurrentFrame();
  const linha = interpolate(frame - atraso, [0, 10], [0, 70], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const op = interpolate(frame - atraso, [4, 12], [0, 1], clamp);
  const x = interpolate(frame - atraso, [4, 14], [-20, 0], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22 }}>
      <div style={{ width: linha, height: 6, background: CORES.laranja, borderRadius: 3 }} />
      <div
        style={{
          opacity: op,
          transform: `translateX(${x}px)`,
          fontFamily: FONTE,
          fontWeight: 700,
          fontSize: 36,
          letterSpacing: 6,
          color: CORES.branco,
          textTransform: "uppercase",
          textShadow: "0 3px 16px rgba(0,0,0,0.5)",
        }}
      >
        {texto}
      </div>
    </div>
  );
};

// Lista de itens que entram um a um, em cartões.
export const ListaEtapas: React.FC<{
  itens: readonly string[];
  duracao: number;
  titulo?: string;
}> = ({ itens, duracao, titulo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const saida = useSaida(duracao);
  return (
    <AbsoluteFill
      style={{
        ...posicaoEstilo("base"),
        paddingLeft: AREA_SEGURA.lateral,
        fontFamily: FONTE,
      }}
    >
      <div style={saida}>
        {titulo ? <Kicker texto={titulo} atraso={2} /> : null}
        {itens.map((item, i) => {
          const s = spring({
            frame: frame - 8 - i * 9,
            fps,
            config: { damping: 15, stiffness: 150 },
          });
          return (
            <div
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 26,
                marginTop: 18,
                padding: "22px 40px 22px 26px",
                width: "fit-content",
                background: "rgba(11,31,51,0.82)",
                borderLeft: `8px solid ${CORES.laranja}`,
                borderRadius: 8,
                transform: `translateX(${(1 - s) * -700}px)`,
                opacity: s,
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 40,
                  color: CORES.laranja,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ fontWeight: 800, fontSize: 64, color: CORES.branco, letterSpacing: 1 }}>
                {item}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
