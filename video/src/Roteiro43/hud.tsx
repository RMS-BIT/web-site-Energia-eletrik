import { AbsoluteFill, Easing, interpolate } from "remotion";
import { C, FONTE, MONO } from "./tema";

// Primitivas HUD. Todas recebem o progresso/quadro como número para serem
// puras: quem anima é a cena.

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const suave = Easing.bezier(0.22, 1, 0.36, 1);
export const ent = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: suave });

export const Svg: React.FC<{ children: React.ReactNode; opacity?: number }> = ({ children, opacity = 1 }) => (
  <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      {children}
    </svg>
  </AbsoluteFill>
);

// Retículo: anel fino girando + cantoneiras que fecham ao travar.
export const Reticulo: React.FC<{
  x: number;
  y: number;
  tam: number;
  aparece: number;
  trava: number;
  giro: number;
  cor?: string;
}> = ({ x, y, tam, aparece, trava, giro, cor = C.branco }) => {
  const r = tam / 2;
  const folga = interpolate(trava, [0, 1], [r * 0.9, r * 0.32]);
  const c = r * 0.28;
  const cantos: [number, number][] = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  const corTrava = trava > 0.95 ? C.destaque : cor;
  return (
    <g opacity={aparece} transform={`translate(${x} ${y})`}>
      <circle r={r} fill="none" stroke={cor} strokeOpacity={0.5} strokeWidth={1.5} strokeDasharray="3 9" transform={`rotate(${giro})`} />
      <circle r={r * 0.72} fill="none" stroke={cor} strokeOpacity={0.25} strokeWidth={1} />
      {[0, 90, 180, 270].map((a) => (
        <line
          key={a}
          x1={0}
          y1={-r - 10}
          x2={0}
          y2={-r + 8}
          stroke={cor}
          strokeWidth={2}
          transform={`rotate(${a + giro * 0.25})`}
        />
      ))}
      {cantos.map(([sx, sy], i) => {
        const px = sx * (r * 0.32 + folga);
        const py = sy * (r * 0.32 + folga);
        return (
          <path
            key={i}
            d={`M ${px} ${py - sy * c} L ${px} ${py} L ${px - sx * c} ${py}`}
            fill="none"
            stroke={corTrava}
            strokeWidth={3}
          />
        );
      })}
      <line x1={-8} y1={0} x2={8} y2={0} stroke={cor} strokeWidth={1.5} />
      <line x1={0} y1={-8} x2={0} y2={8} stroke={cor} strokeWidth={1.5} />
      <circle r={3} fill={corTrava} />
    </g>
  );
};

// Ponto de rastreamento: quadradinho + rótulo.
export const PontoRastreio: React.FC<{ x: number; y: number; rotulo: string; aparece: number }> = ({
  x,
  y,
  rotulo,
  aparece,
}) => (
  <g opacity={aparece} transform={`translate(${x} ${y})`}>
    <rect x={-9} y={-9} width={18} height={18} fill="none" stroke={C.branco} strokeWidth={1.8} />
    <circle r={2.5} fill={C.destaque} />
    <line x1={9} y1={-9} x2={26} y2={-26} stroke={C.branco} strokeWidth={1} strokeOpacity={0.7} />
    <text x={30} y={-30} fill={C.branco} fontFamily={MONO} fontSize={21} letterSpacing={2} stroke="rgba(0,0,0,0.55)" strokeWidth={3} paintOrder="stroke">
      {rotulo}
    </text>
  </g>
);

// Linha de varredura horizontal com brilho atrás.
export const LinhaScan: React.FC<{ y: number; x0?: number; x1?: number; aparece: number }> = ({
  y,
  x0 = 0,
  x1 = 1080,
  aparece,
}) => (
  <g opacity={aparece}>
    <defs>
      <linearGradient id="scanBrilho" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.destaque} stopOpacity="0" />
        <stop offset="1" stopColor={C.destaque} stopOpacity="0.22" />
      </linearGradient>
    </defs>
    <rect x={x0} y={y - 120} width={x1 - x0} height={120} fill="url(#scanBrilho)" />
    <line x1={x0} y1={y} x2={x1} y2={y} stroke={C.branco} strokeWidth={2} />
  </g>
);

// Texto HUD em fonte mono.
export const TextoHUD: React.FC<{
  x: number;
  y: number;
  texto: string;
  aparece: number;
  tam?: number;
  cor?: string;
  ancora?: "start" | "middle" | "end";
}> = ({ x, y, texto, aparece, tam = 26, cor = C.branco, ancora = "start" }) => {
  const visiveis = Math.round(texto.length * Math.min(1, aparece * 1.4));
  return (
    <text
      x={x}
      y={y}
      fill={cor}
      opacity={Math.min(1, aparece * 3)}
      fontFamily={MONO}
      fontSize={tam}
      letterSpacing={tam * 0.12}
      textAnchor={ancora}
      stroke="rgba(0,0,0,0.55)"
      strokeWidth={tam * 0.16}
      paintOrder="stroke"
    >
      {texto.slice(0, visiveis)}
    </text>
  );
};

// Chamada técnica: ponto no objeto → cotovelo → rótulo.
export const Chamada: React.FC<{
  ax: number;
  ay: number;
  bx: number;
  by: number;
  texto: string;
  sub?: string;
  p: number;
  lado?: 1 | -1;
}> = ({ ax, ay, bx, by, texto, sub, p, lado = 1 }) => {
  const l1 = Math.min(1, p * 2);
  const l2 = Math.max(0, Math.min(1, p * 2 - 1));
  const mx = ax + (bx - ax) * l1;
  const my = ay + (by - ay) * l1;
  const comp = 190 * l2;
  return (
    <g opacity={Math.min(1, p * 4)}>
      <circle cx={ax} cy={ay} r={5} fill={C.destaque} />
      <circle cx={ax} cy={ay} r={11} fill="none" stroke={C.branco} strokeWidth={1.2} />
      <line x1={ax} y1={ay} x2={mx} y2={my} stroke={C.branco} strokeWidth={1.4} />
      <line x1={bx} y1={by} x2={bx + lado * comp} y2={by} stroke={C.branco} strokeWidth={1.4} opacity={l2 > 0 ? 1 : 0} />
      <TextoHUD
        x={bx + lado * 6}
        y={by - 12}
        texto={texto}
        aparece={l2}
        tam={26}
        ancora={lado === 1 ? "start" : "end"}
      />
      {sub ? (
        <TextoHUD
          x={bx + lado * 6}
          y={by + 28}
          texto={sub}
          aparece={Math.max(0, l2 - 0.3)}
          tam={19}
          cor={C.cinzaClaro}
          ancora={lado === 1 ? "start" : "end"}
        />
      ) : null}
    </g>
  );
};

// Cantoneiras em volta de um retângulo (moldura técnica).
export const Moldura: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  p: number;
  cor?: string;
  c?: number;
  marcas?: boolean;
}> = ({ x, y, w, h, p, cor = C.branco, c = 34, marcas }) => {
  const e = (1 - p) * 40;
  const X0 = x - e;
  const Y0 = y - e;
  const X1 = x + w + e;
  const Y1 = y + h + e;
  return (
    <g opacity={p} fill="none" stroke={cor} strokeWidth={2.5}>
      <path d={`M ${X0} ${Y0 + c} L ${X0} ${Y0} L ${X0 + c} ${Y0}`} />
      <path d={`M ${X1 - c} ${Y0} L ${X1} ${Y0} L ${X1} ${Y0 + c}`} />
      <path d={`M ${X1} ${Y1 - c} L ${X1} ${Y1} L ${X1 - c} ${Y1}`} />
      <path d={`M ${X0 + c} ${Y1} L ${X0} ${Y1} L ${X0} ${Y1 - c}`} />
      {marcas
        ? Array.from({ length: 9 }).map((_, i) => {
            const mx = X0 + ((X1 - X0) * (i + 1)) / 10;
            return <line key={i} x1={mx} y1={Y1 + 10} x2={mx} y2={Y1 + (i % 2 ? 16 : 22)} strokeWidth={1.2} />;
          })
        : null}
    </g>
  );
};

// Barra de progresso fina.
export const Barra: React.FC<{ x: number; y: number; w: number; p: number; aparece: number }> = ({
  x,
  y,
  w,
  p,
  aparece,
}) => (
  <g opacity={aparece}>
    <rect x={x} y={y} width={w} height={4} fill={C.branco} fillOpacity={0.18} />
    <rect x={x} y={y} width={w * p} height={4} fill={C.destaque} />
    {Array.from({ length: 11 }).map((_, i) => (
      <line key={i} x1={x + (w * i) / 10} y1={y + 10} x2={x + (w * i) / 10} y2={y + 16} stroke={C.branco} strokeOpacity={0.5} />
    ))}
  </g>
);

// Contorno com traço que se desenha.
export const Contorno: React.FC<{ x: number; y: number; w: number; h: number; p: number }> = ({ x, y, w, h, p }) => {
  const per = 2 * (w + h);
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={18}
      fill={C.destaque}
      fillOpacity={0.06 * p}
      stroke={C.destaque}
      strokeWidth={2.5}
      strokeDasharray={per}
      strokeDashoffset={per * (1 - p)}
    />
  );
};

// Feixe discreto de análise entre dois pontos.
export const Feixe: React.FC<{ x1: number; y1: number; x2: number; y2: number; p: number; fase: number }> = ({
  x1,
  y1,
  x2,
  y2,
  p,
  fase,
}) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const abre = 70;
  return (
    <g transform={`translate(${x1} ${y1}) rotate(${ang})`} opacity={p}>
      <defs>
        <linearGradient id="feixe" x1="0" x2="1">
          <stop offset="0" stopColor={C.destaque} stopOpacity="0.5" />
          <stop offset="1" stopColor={C.destaque} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M 0 -10 L ${len} ${-abre} L ${len} ${abre} L 0 10 Z`} fill="url(#feixe)" />
      {[0.25, 0.5, 0.75].map((k) => {
        const pos = ((k + fase) % 1) * len;
        const h = 10 + (abre - 10) * (pos / len);
        return <line key={k} x1={pos} y1={-h} x2={pos} y2={h} stroke={C.branco} strokeOpacity={0.35 * (1 - pos / len)} strokeWidth={1.2} />;
      })}
    </g>
  );
};

// Título com espaçamento que se fecha (entrada rápida e limpa).
export const TituloEspacado: React.FC<{
  texto: string;
  p: number;
  sai?: number;
  tam?: number;
  peso?: number;
  y: number;
  cor?: string;
}> = ({ texto, p, sai = 0, tam = 60, peso = 600, y, cor = C.branco }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: y }}>
    <div
      style={{
        fontFamily: FONTE,
        fontSize: tam,
        fontWeight: peso,
        color: cor,
        letterSpacing: interpolate(p, [0, 1], [tam * 0.7, tam * 0.2]),
        paddingLeft: tam * 0.2,
        opacity: Math.min(1, p * 1.6) * (1 - sai),
        filter: `blur(${(1 - p) * 10 + sai * 8}px)`,
        transform: `translateY(${-sai * 20}px)`,
        textShadow: "0 4px 30px rgba(0,0,0,0.5)",
        whiteSpace: "nowrap",
      }}
    >
      {texto}
    </div>
  </AbsoluteFill>
);
