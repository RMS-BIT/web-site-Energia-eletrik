import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { Frase, Palavra } from "../roteiro";
import { COR, FONTE, FPS, SEGURA } from "../tema";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Bloco = { palavras: Palavra[]; inicio: number; fim: number };

// Quebra a frase em blocos curtos (até 4 palavras / 26 letras), cortando
// sempre depois de pontuação — como nas legendas de Reels.
const blocos = (frase: Frase): Bloco[] => {
  const out: Palavra[][] = [[]];
  for (const p of frase.palavras) {
    const atual = out[out.length - 1];
    const letras = atual.reduce((n, w) => n + w.palavra.length + 1, 0);
    if (atual.length >= 4 || letras + p.palavra.length > 26) out.push([]);
    out[out.length - 1].push(p);
    if (/[,.?!]$/.test(p.palavra)) out.push([]);
  }
  const grupos = out.filter((g) => g.length);
  return grupos.map((g, i) => ({
    palavras: g,
    inicio: g[0].inicio,
    fim: i < grupos.length - 1 ? grupos[i + 1][0].inicio : g[g.length - 1].fim + 0.15,
  }));
};

export const Legendas: React.FC<{ frases: Frase[]; ocultarDe?: number }> = ({ frases, ocultarDe }) => {
  const frame = useCurrentFrame();
  if (ocultarDe !== undefined && frame >= ocultarDe) return null;

  for (const frase of frases) {
    const t = (frame - frase.inicio) / FPS;
    if (t < 0 || t > frase.duracao) continue;
    const bloco = blocos(frase).find((b) => t >= b.inicio && t < b.fim);
    if (!bloco) return null;
    const saida = interpolate(t, [bloco.fim - 0.08, bloco.fim], [1, 0], clamp);
    return (
      <AbsoluteFill
        style={{
          justifyContent: "flex-start",
          alignItems: "center",
          paddingTop: SEGURA.base - 150,
          paddingLeft: SEGURA.lateral,
          paddingRight: SEGURA.lateral,
        }}
      >
        <div
          style={{
            fontFamily: FONTE,
            fontWeight: 650,
            fontSize: 60,
            lineHeight: 1.18,
            letterSpacing: -0.5,
            textAlign: "center",
            maxWidth: 900,
            opacity: saida,
          }}
        >
          {bloco.palavras.map((p, i) => {
            const dt = t - p.inicio;
            const entra = interpolate(dt, [-0.02, 0.16], [0, 1], clamp);
            const falando = t >= p.inicio && t < p.fim + 0.05;
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  opacity: entra,
                  transform: `translateY(${(1 - entra) * 14}px)`,
                  filter: `blur(${(1 - entra) * 6}px)`,
                  color: COR.branco,
                  padding: "0 12px",
                  margin: "0 -12px",
                  marginRight: "calc(0.26em - 12px)",
                  borderRadius: 12,
                  background: falando ? COR.azul : "transparent",
                  boxShadow: falando ? "0 8px 24px rgba(15,60,160,0.35)" : "none",
                  textShadow: falando ? "none" : "0 2px 18px rgba(0,10,30,0.6), 0 0 3px rgba(0,10,30,0.45)",
                }}
              >
                {p.palavra}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    );
  }
  return null;
};
