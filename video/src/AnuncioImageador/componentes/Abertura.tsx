import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { COR, FONTE, SEGURA } from "../tema";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const suave = Easing.bezier(0.22, 1, 0.36, 1);
const acelera = Easing.bezier(0.64, 0, 0.78, 0);

export type LinhaTitulo = { texto: string; peso: number; destaque?: boolean };

const TAMANHO = 82;
const ALTURA_LINHA = Math.round(TAMANHO * 1.08);
const X_TRILHO = SEGURA.lateral;
const X_TEXTO = SEGURA.lateral + 40;

// Escurece o canto inferior esquerdo, onde fica o título.
export const SombraLateral: React.FC<{ inicio: number; fim: number }> = ({ inicio, fim }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [inicio, inicio + 14, fim - 8, fim], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill
      style={{
        opacity: op,
        background:
          "linear-gradient(14deg, rgba(3,12,30,0.95) 0%, rgba(3,12,30,0.78) 36%, rgba(3,12,30,0) 70%)",
      }}
    />
  );
};

// Título alinhado à esquerda: trilho vertical que se desenha, índice,
// kicker e linhas reveladas por máscara, com contraste de peso.
export const TituloLateral: React.FC<{
  indice: string;
  kicker: string;
  linhas: LinhaTitulo[];
  inicio: number;
  saida: number;
  passo?: number;
}> = ({ indice, kicker, linhas, inicio, saida, passo = 7 }) => {
  const frame = useCurrentFrame();
  const alturaBloco = 70 + linhas.length * ALTURA_LINHA;
  const topo = SEGURA.base - alturaBloco;

  const trilho = interpolate(frame, [inicio, inicio + 22], [0, 1], { ...clamp, easing: suave });
  const recolhe = interpolate(frame, [saida + 4, saida + 16], [0, 1], { ...clamp, easing: acelera });
  const kick = interpolate(frame, [inicio + 4, inicio + 20], [0, 1], { ...clamp, easing: suave });
  const kickSai = interpolate(frame, [saida, saida + 10], [0, 1], { ...clamp, easing: acelera });

  // marcador que desce pelo trilho acompanhando a linha que entra
  const linhaAtual = Math.min(linhas.length - 1, Math.max(0, (frame - inicio - 10) / passo));
  const yMarcador = topo + 70 + linhaAtual * ALTURA_LINHA + ALTURA_LINHA / 2;

  return (
    <AbsoluteFill style={{ fontFamily: FONTE }}>
      {/* trilho */}
      <div
        style={{
          position: "absolute",
          left: X_TRILHO,
          top: topo,
          width: 2,
          height: alturaBloco,
          background: `linear-gradient(180deg, ${COR.azulVivo}, rgba(61,139,255,0.15))`,
          transformOrigin: recolhe > 0 ? "bottom" : "top",
          transform: `scaleY(${trilho * (1 - recolhe)})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: X_TRILHO - 5,
          top: yMarcador - 6,
          width: 12,
          height: 12,
          borderRadius: 6,
          background: COR.branco,
          boxShadow: `0 0 0 6px ${COR.azulVivo}40, 0 0 18px ${COR.azulVivo}`,
          opacity: trilho * (1 - recolhe),
        }}
      />

      {/* índice + kicker */}
      <div
        style={{
          position: "absolute",
          left: X_TEXTO,
          top: topo,
          display: "flex",
          alignItems: "center",
          gap: 18,
          opacity: kick * (1 - kickSai),
          transform: `translateY(${(1 - kick) * 12 - kickSai * 12}px)`,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 26, color: COR.azulVivo, letterSpacing: 2 }}>{indice}</span>
        <span style={{ width: 36 * kick, height: 1.5, background: "rgba(255,255,255,0.6)" }} />
        <span
          style={{
            fontWeight: 500,
            fontSize: 26,
            letterSpacing: 7,
            color: COR.branco,
            textTransform: "uppercase",
          }}
        >
          {kicker}
        </span>
      </div>

      {/* linhas */}
      {linhas.map((l, i) => {
        const ent = interpolate(frame, [inicio + 10 + i * passo, inicio + 10 + i * passo + 18], [0, 1], {
          ...clamp,
          easing: suave,
        });
        const sai = interpolate(frame, [saida + i * 2, saida + i * 2 + 12], [0, 1], { ...clamp, easing: acelera });
        const sublinha = interpolate(frame, [inicio + 22 + i * passo, inicio + 40 + i * passo], [0, 1], {
          ...clamp,
          easing: suave,
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: X_TEXTO,
              top: topo + 70 + i * ALTURA_LINHA,
              height: ALTURA_LINHA + 14,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "relative",
                fontSize: TAMANHO,
                lineHeight: `${ALTURA_LINHA}px`,
                fontWeight: l.peso,
                letterSpacing: interpolate(ent, [0, 1], [4, -1.5]),
                color: l.destaque ? COR.azulVivo : COR.branco,
                transform: `translateY(${(1 - ent) * 105 - sai * 105}%)`,
                textShadow: "0 4px 30px rgba(0,8,24,0.6), 0 0 2px rgba(0,8,24,0.4)",
                whiteSpace: "nowrap",
              }}
            >
              {l.texto}
              {l.destaque ? (
                <div
                  style={{
                    position: "absolute",
                    left: 2,
                    bottom: -6,
                    height: 5,
                    borderRadius: 3,
                    width: `${sublinha * 100}%`,
                    background: COR.azulVivo,
                    boxShadow: `0 0 18px ${COR.azulVivo}`,
                  }}
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Quadros em que cada linha entra (para posicionar os efeitos sonoros).
export const quadrosDasLinhas = (inicio: number, quantidade: number, passo = 7) =>
  Array.from({ length: quantidade }, (_, i) => inicio + 10 + i * passo);
