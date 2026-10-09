import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";

// Peças compartilhadas pelos vídeos em formato de "matéria" (StoryMateria,
// ReelProdutor): helpers de animação e o fundo de jornal claro e desfocado.

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const suave = Easing.bezier(0.22, 1, 0.36, 1);
export const ent = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: suave });
export const SOMBRA = "0 40px 90px rgba(13,36,64,0.28), 0 8px 24px rgba(13,36,64,0.12)";
export const COR_JORNAL = "#F4F1EA";

// Linha do tempo gerada pela locução (scripts/gerar_voz_story.py -> voz.json)
export type CenaVoz = { duracao: number; frases: number[]; de: number; dur: number; voz: number };
export type LinhaVoz = { fps: number; total: number; cenas: Record<string, CenaVoz> };

// quadro (relativo à cena) em que começa a frase n da locução
export const quadroFrase = (linha: LinhaVoz, cena: string, n: number) => {
  const c = linha.cenas[cena];
  return c.voz - c.de + Math.round(c.frases[n] * linha.fps);
};
// quadro (relativo à cena) em que a locução da cena termina
export const quadroFimVoz = (linha: LinhaVoz, cena: string) => {
  const c = linha.cenas[cena];
  return c.voz - c.de + Math.round(c.duracao * linha.fps);
};

// ---------- Fundo: página de jornal clara e desfocada ----------
// Só blocos (manchetes, colunas, fotos): ilegível de propósito, remete a
// "matéria" sem simular texto de ninguém.
const PAGINA_W = 1500;
const PAGINA_H = 2500;

const colunas = (x0: number, y0: number, y1: number, n: number, larg: number, semente: string) => {
  const r: { x: number; y: number; w: number; h: number; o: number }[] = [];
  for (let c = 0; c < n; c++) {
    const x = x0 + c * (larg + 36);
    let y = y0;
    let linha = 0;
    while (y < y1) {
      const s = `${semente}${c}-${linha}`;
      if (random(`int${s}`) < 0.05 && linha > 3) {
        // intertítulo
        r.push({ x, y: y + 10, w: larg * (0.55 + random(`it${s}`) * 0.35), h: 22, o: 0.75 });
        y += 54;
      } else {
        const fimPar = random(`p${s}`) < 0.12;
        r.push({ x, y, w: fimPar ? larg * (0.25 + random(`w${s}`) * 0.5) : larg, h: 11, o: 0.42 });
        y += fimPar ? 40 : 25;
      }
      linha++;
    }
  }
  return r;
};

const BLOCOS = [...colunas(840, 700, 1150, 2, 270, "a"), ...colunas(110, 1300, 2420, 4, 300, "b")];

export type Luz = { x: number; y: number; r: number; c: string; v: number };

export const FundoJornal: React.FC<{ duracao: number; foto: string; luzes: Luz[] }> = ({ duracao, foto, luzes }) => {
  const f = useCurrentFrame();
  const p = f / duracao;
  return (
    <AbsoluteFill style={{ background: COR_JORNAL, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: (1080 - PAGINA_W) / 2,
          top: (1920 - PAGINA_H) / 2,
          width: PAGINA_W,
          height: PAGINA_H,
          transform: `translate(${Math.sin(f / 160) * 30}px, ${interpolate(p, [0, 1], [40, -60])}px) rotate(${-6 + Math.sin(f / 240) * 1.2}deg) scale(${1.05 + p * 0.08})`,
          filter: "blur(7px)",
        }}
      >
        <svg width={PAGINA_W} height={PAGINA_H}>
          <rect width={PAGINA_W} height={PAGINA_H} fill={COR_JORNAL} />
          {/* cabeçalho do jornal */}
          <rect x={110} y={150} width={1280} height={4} fill="#3A3A3A" opacity={0.5} />
          <rect x={330} y={190} width={840} height={110} rx={8} fill="#2B2B2B" opacity={0.55} />
          <rect x={110} y={330} width={1280} height={2} fill="#3A3A3A" opacity={0.5} />
          <rect x={110} y={345} width={1280} height={2} fill="#3A3A3A" opacity={0.35} />
          {/* manchete */}
          <rect x={110} y={410} width={1180} height={70} rx={6} fill="#262626" opacity={0.55} />
          <rect x={110} y={505} width={860} height={70} rx={6} fill="#262626" opacity={0.55} />
          <rect x={110} y={610} width={980} height={22} rx={4} fill="#4A4A4A" opacity={0.5} />
          {/* fotos */}
          <rect x={110} y={700} width={690} height={450} fill="#9AA3AD" opacity={0.55} />
          <rect x={110} y={1170} width={520} height={12} fill="#555" opacity={0.4} />
          <rect x={1060} y={1300} width={330} height={300} fill="#B9AFA2" opacity={0.6} />
          {BLOCOS.map((b, i) => (
            <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={3} fill="#3D3D3D" opacity={b.o * 0.8} />
          ))}
        </svg>
        <Img
          src={staticFile(foto)}
          style={{ position: "absolute", left: 110, top: 700, width: 690, height: 450, objectFit: "cover", filter: "grayscale(0.7) contrast(0.9)", opacity: 0.75 }}
        />
      </div>
      {/* luz suave para clarear o centro e dar profundidade nas bordas */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 46%, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.42) 45%, rgba(244,241,234,0.1) 75%, rgba(13,53,90,0.16) 100%)",
        }}
      />
      {luzes.map((l, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: l.x - l.r + Math.sin(f / (70 + i * 13)) * 60,
            top: l.y - l.r + Math.cos(f / (90 + i * 11)) * 50,
            width: l.r * 2,
            height: l.r * 2,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${l.c} 0%, transparent 65%)`,
            opacity: l.v,
            filter: "blur(30px)",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};
