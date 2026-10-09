import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONTE } from "../AnuncioImageador/tema";
import { clamp, ent } from "../Materia/comum";
import {
  BLOCOS,
  BLOCOS_LEGENDA,
  DURACAO,
  FALA_ATIVA,
  FPS,
  paraSaida,
} from "../DivisaoMS/edicao";
import mapa from "../DivisaoMS/mapa.json";

// "49 anos da divisão de MS" — versão animada em 3D.
// O deputado é recortado do fundo (scripts/recortar_pessoa.py, máscara RVM;
// nenhuma alteração de pessoa) e colocado sobre um mapa 3D de MS, numa
// estrada até Cuiabá e numa lavoura em perspectiva. Textos digitados com som
// de tecla, legendas sincronizadas, trilha baixa com "ducking".
// Fatos dos grafismos: LC nº 31, de 11/10/1977 (cria MS) — planalto.gov.br;
// 1977→2026 = 49 anos. "1962" e "800 quilômetros" vêm da própria fala.

export const DIVISAO3D_DURACAO = DURACAO;

const COR = {
  marinho: "#0D355A",
  noite: "#061A2E",
  azul: "#124A78",
  azulMedio: "#1B5F8E",
  amarelo: "#F6D54A",
  verde: "#44B552",
  verdeClaro: "#7CCB8A",
  branco: "#FFFFFF",
};
const o = (src: number) => paraSaida(src); // tempo da fala (s) -> quadro de saída

// cenários (quadros de saída)
const CEN = {
  abertura: [0, o(10.09)],
  chegada: [o(10.82), o(18.89)],
  estrada: [o(19.41), o(29.73)],
  divisao: [o(29.73), o(38.05)],
  irmaos: [o(38.05), o(42.1)],
  agro: [o(42.1), o(56.85)],
  sul: [o(56.85), o(62.8)],
  final: [o(62.8), DURACAO],
} as const;
const UNO = o(13.36); // "ainda no Mato Grosso uno"

// ---------- utilidades ----------
const quadros = (pts: [number, number][], f: number) =>
  interpolate(
    f,
    pts.map((p) => p[0]),
    pts.map((p) => p[1]),
    { ...clamp, easing: (x) => 0.5 - Math.cos(Math.PI * x) / 2 },
  );

// ---------- orador recortado ----------
// ponto de apoio no vídeo recortado (1080×1920): centro do corpo e linha do esfumado
const APOIO = { x: 780, y: 1640 };
const POSE: {
  x: [number, number][];
  y: [number, number][];
  s: [number, number][];
  vis: [number, number][];
} = {
  x: [
    [0, 560],
    [o(3.5), 600],
    [o(7.2), 600],
    [o(7.6), 700],
    [CEN.chegada[0], 560],
    [UNO, 560],
    [UNO + 30, 560],
    [CEN.estrada[0], 540],
    [CEN.divisao[0], 540],
    [o(33.86), 660],
    [CEN.irmaos[0], 560],
    [CEN.agro[0], 580],
    [CEN.sul[0], 620],
    [CEN.final[0], 560],
    [o(75.31), 560],
    [DURACAO, 560],
  ],
  y: [
    [0, 1720],
    [o(3.5), 1600],
    [o(7.2), 1600],
    [o(7.6), 1640],
    [CEN.chegada[0], 1700],
    [UNO - 10, 2050],
    [UNO + 30, 1520],
    [CEN.estrada[0] - 1, 1520],
    [CEN.estrada[0], 1560],
    [CEN.divisao[0], 1560],
    [o(33.86), 1640],
    [CEN.irmaos[0], 1760],
    [CEN.agro[0], 1700],
    [CEN.sul[0], 1620],
    [CEN.final[0], 1980],
    [o(70), 1980],
    [o(75.31), 1640],
    [DURACAO, 1640],
  ],
  s: [
    [0, 1.02],
    [o(3.5), 0.62],
    [o(7.2), 0.62],
    [o(7.6), 0.7],
    [CEN.chegada[0], 1.0],
    [UNO - 10, 1.3],
    [UNO + 30, 0.66],
    [CEN.estrada[0] - 1, 0.66],
    [CEN.estrada[0], 0.74],
    [CEN.divisao[0], 0.74],
    [o(33.86), 0.62],
    [CEN.irmaos[0], 1.0],
    [CEN.agro[0], 0.9],
    [CEN.sul[0], 0.68],
    [CEN.final[0], 1.15],
    [o(70), 1.2],
    [o(75.31), 0.78],
    [DURACAO, 0.8],
  ],
  // some no começo da divisão para o mapa ocupar a tela, volta em "Hoje tem dois estados"
  vis: [
    [0, 1],
    [CEN.divisao[0], 1],
    [CEN.divisao[0] + 12, 0],
    [o(33.86) - 6, 0],
    [o(33.86) + 10, 1],
    [DURACAO - 80, 1],
    [DURACAO - 60, 0],
  ],
};

const Orador: React.FC<{ inicioBloco: number; inicioSaida: number }> = ({
  inicioBloco,
  inicioSaida,
}) => {
  const fl = useCurrentFrame();
  const f = fl + inicioSaida; // quadro global
  const x = quadros(POSE.x, f);
  const y = quadros(POSE.y, f);
  const s = quadros(POSE.s, f);
  const vis = quadros(POSE.vis, f);
  const ry = Math.sin(f / 70) * 6; // leve órbita da câmera em volta dele
  const mascara = "linear-gradient(180deg, #000 0%, #000 74%, transparent 85%)";
  return (
    <AbsoluteFill style={{ perspective: 1600, opacity: vis }}>
      {/* sombra no chão */}
      <div
        style={{
          position: "absolute",
          left: x - 300 * s,
          top: y - 70 * s,
          width: 600 * s,
          height: 120 * s,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 45%, transparent 72%)",
          filter: "blur(6px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - APOIO.x * s,
          top: y - APOIO.y * s,
          width: 1080,
          height: 1920,
          transformOrigin: "0 0",
          transform: `scale(${s})`,
        }}
      >
        <div
          style={{
            width: 1080,
            height: 1920,
            transformOrigin: `${APOIO.x}px ${APOIO.y}px`,
            transform: `rotateY(${ry}deg)`,
            WebkitMaskImage: mascara,
            maskImage: mascara,
            // sombra projetada atrás dele
            filter:
              "drop-shadow(26px 18px 22px rgba(0,0,0,0.45)) drop-shadow(0 0 1px rgba(0,0,0,0.3))",
          }}
        >
          <OffthreadVideo
            src={staticFile("ms/fala-recorte.webm")}
            transparent
            muted
            trimBefore={Math.round(inicioBloco * FPS)}
            style={{ width: 1080, height: 1920 }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- mapa 3D (piso) ----------
type ModoMapa = "ms" | "uno" | "divisao" | "sul";
const modoMapa = (f: number): ModoMapa =>
  f < CEN.chegada[0]
    ? "ms"
    : f < CEN.estrada[0]
      ? "uno"
      : f < CEN.irmaos[0]
        ? "divisao"
        : "sul";

const CAM = {
  // altura da tela onde o mapa fica, inclinação e escala
  top: [
    [0, 820],
    [UNO, 820],
    [UNO + 40, 620],
    [CEN.divisao[0], 380],
    [o(33.86), 520],
    [CEN.sul[0], 560],
    [CEN.final[0], 700],
  ] as [number, number][],
  rx: [
    [0, 58],
    [UNO, 58],
    [UNO + 40, 58],
    [CEN.divisao[0], 38],
    [o(33.86), 58],
    [CEN.sul[0], 60],
    [CEN.final[0], 66],
  ] as [number, number][],
  sc: [
    [0, 1.05],
    [UNO, 1.05],
    [UNO + 40, 1.25],
    [CEN.divisao[0], 0.95],
    [o(33.86), 1.2],
    [CEN.sul[0], 1.3],
    [CEN.final[0], 1.55],
  ] as [number, number][],
};

const MapaPiso: React.FC = () => {
  const f = useCurrentFrame();
  const modo = modoMapa(f);
  const top = quadros(CAM.top, f);
  const rx = quadros(CAM.rx, f);
  const sc = quadros(CAM.sc, f);
  const rz = Math.sin(f / 90) * 4;
  // divisão: o sul se afasta e a nova fronteira acende
  const fd = f - CEN.divisao[0];
  const separa =
    modo === "divisao"
      ? interpolate(fd, [20, 70], [0, 70], {
          ...clamp,
          easing: (x) => 1 - (1 - x) ** 3,
        })
      : modo === "sul"
        ? 70
        : 0;
  const linha = modo === "divisao" ? ent(fd, 12, 60) : modo === "sul" ? 1 : 0;
  const msLuz =
    modo === "ms" || modo === "sul"
      ? 1
      : modo === "divisao"
        ? ent(fd, 60, 90)
        : 0;
  const mtCor =
    modo === "uno" || (modo === "divisao" && fd < 20) ? "#2A6E9E" : "#1E5A86";
  const pulso = 0.6 + 0.4 * Math.sin(f / 10);
  const camadas = 10;
  const caminhos = (escuro: boolean, k: number) => (
    <svg
      width={mapa.largura}
      height={mapa.altura}
      style={{
        position: "absolute",
        inset: 0,
        transform: `translateZ(${-k * 5}px)`,
        overflow: "visible",
      }}
    >
      <path
        d={mapa.mt}
        fill={escuro ? "#0B3A5E" : mtCor}
        stroke={escuro ? "none" : "rgba(255,255,255,0.5)"}
        strokeWidth={2}
      />
      <g transform={`translate(${separa * 0.25}, ${separa})`}>
        <path
          d={mapa.ms}
          fill={
            escuro
              ? "#1E6B34"
              : modo === "uno" || (modo === "divisao" && fd < 20)
                ? mtCor
                : COR.verde
          }
          stroke={escuro ? "none" : "rgba(255,255,255,0.6)"}
          strokeWidth={2}
        />
      </g>
    </svg>
  );
  return (
    <AbsoluteFill
      style={{ perspective: 1400, perspectiveOrigin: "540px 700px" }}
    >
      <div
        style={{
          position: "absolute",
          left: 540 - mapa.largura / 2,
          top,
          width: mapa.largura,
          height: mapa.altura,
          transformStyle: "preserve-3d",
          transformOrigin: "50% 50%",
          transform: `rotateX(${rx}deg) rotateZ(${rz}deg) scale(${sc})`,
        }}
      >
        {/* chão quadriculado sob o mapa (dá a leitura de 3D) */}
        <svg
          width={2600}
          height={2600}
          style={{
            position: "absolute",
            left: mapa.largura / 2 - 1300,
            top: mapa.altura / 2 - 1300,
            transform: "translateZ(-70px)",
            overflow: "visible",
          }}
        >
          <defs>
            <radialGradient id="somGrade" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.16} />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
            </radialGradient>
            <mask id="mGrade">
              <rect width={2600} height={2600} fill="url(#somGrade)" />
            </mask>
          </defs>
          <g mask="url(#mGrade)" stroke="#FFFFFF" strokeWidth={2}>
            {Array.from({ length: 27 }).map((_, i) => (
              <line key={`gv${i}`} x1={i * 100} y1={0} x2={i * 100} y2={2600} />
            ))}
            {Array.from({ length: 27 }).map((_, i) => (
              <line key={`gh${i}`} x1={0} y1={i * 100} x2={2600} y2={i * 100} />
            ))}
          </g>
        </svg>
        {Array.from({ length: camadas }).map((_, k) => (
          <div
            key={k}
            style={{
              position: "absolute",
              inset: 0,
              transformStyle: "preserve-3d",
            }}
          >
            {caminhos(true, camadas - k)}
          </div>
        ))}
        <div style={{ position: "absolute", inset: 0 }}>
          {caminhos(false, 0)}
        </div>
        {/* brilho do MS e nova fronteira */}
        <svg
          width={mapa.largura}
          height={mapa.altura}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
        >
          <g transform={`translate(${separa * 0.25}, ${separa})`}>
            <path
              d={mapa.ms}
              fill={COR.verdeClaro}
              opacity={0.35 * msLuz * pulso}
            />
            <path
              d={mapa.ms}
              fill="none"
              stroke={COR.amarelo}
              strokeWidth={5}
              opacity={msLuz}
              style={{ filter: "drop-shadow(0 0 10px rgba(246,213,74,0.9))" }}
            />
            <path
              d={mapa.ms}
              fill="none"
              stroke={COR.amarelo}
              strokeWidth={6}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - linha}
            />
          </g>
          <circle
            cx={mapa.cuiaba[0]}
            cy={mapa.cuiaba[1]}
            r={10}
            fill={COR.amarelo}
            opacity={modo === "uno" ? ent(f, UNO + 20, UNO + 34) : 0}
          />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// fundo de palco: azul profundo, luz de cima e partículas
const Palco: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 30%, ${COR.azulMedio} 0%, ${COR.marinho} 45%, ${COR.noite} 100%)`,
      }}
    >
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(255,240,200,0.28) 0%, transparent 45%)",
        }}
      />
      {Array.from({ length: 30 }).map((_, i) => {
        const x = random(`px${i}`) * 1080;
        const y =
          (((random(`py${i}`) * 1920 - f * (0.3 + random(`pv${i}`) * 0.6)) %
            1920) +
            1920) %
          1920;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 4,
              height: 4,
              borderRadius: 2,
              background: "#FFF",
              opacity: 0.1 + random(`po${i}`) * 0.25,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- estrada em perspectiva até Cuiabá ----------
const HORIZONTE = 880;
const projeta = (xMundo: number, z: number) => ({
  x: 540 + (xMundo * 900) / z,
  y: HORIZONTE + 1100 / z,
});

const Estrada: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const andou = t * 9; // velocidade
  const faixas = Array.from({ length: 22 }).map((_, i) => {
    const zz = ((i * 3.2 - (andou % 3.2) + 70) % 70) + 1.2;
    return zz;
  });
  const quad = (x1: number, x2: number, z1: number, z2: number) => {
    const a = projeta(x1, z1);
    const b = projeta(x2, z1);
    const c = projeta(x2, z2);
    const d = projeta(x1, z2);
    return `M${a.x},${a.y} L${b.x},${b.y} L${c.x},${c.y} L${d.x},${d.y} Z`;
  };
  // placa "CUIABÁ" se aproximando
  const zPlaca = interpolate(f, [o(26.8), o(29.73)], [40, 5.5], clamp);
  const placa = projeta(2.0, zPlaca);
  const esc = 1 / zPlaca;
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, #0B2A4A 0%, #3E5F8C 30%, #F2A65A 44%, #FFD58A 46%, #F7B267 47%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 540 - 220,
          top: HORIZONTE - 260,
          width: 440,
          height: 440,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,236,170,0.95) 0%, rgba(255,190,90,0.35) 40%, transparent 70%)",
        }}
      />
      <svg
        width={1080}
        height={1920}
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <linearGradient id="campo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5E7F3A" />
            <stop offset="100%" stopColor="#2D4F1E" />
          </linearGradient>
          <linearGradient id="asfalto" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4A4A50" />
            <stop offset="100%" stopColor="#1C1C22" />
          </linearGradient>
        </defs>
        <rect
          x={0}
          y={HORIZONTE}
          width={1080}
          height={1920 - HORIZONTE}
          fill="url(#campo)"
        />
        <path d={quad(-1.4, 1.4, 1.0, 80)} fill="url(#asfalto)" />
        <path d={quad(-1.4, -1.3, 1.0, 80)} fill="#E8E8E8" opacity={0.85} />
        <path d={quad(1.3, 1.4, 1.0, 80)} fill="#E8E8E8" opacity={0.85} />
        {faixas.map((zz, i) => (
          <g key={i} opacity={Math.min(1, (70 - zz) / 20)}>
            <path d={quad(-0.05, 0.05, zz, zz + 1.4)} fill={COR.amarelo} />
            {/* faixas laterais tracejadas (dão a sensação de movimento) */}
            <path d={quad(-0.78, -0.7, zz + 0.8, zz + 2.0)} fill="#F2F2F2" />
            <path d={quad(0.7, 0.78, zz + 0.8, zz + 2.0)} fill="#F2F2F2" />
            {/* balizadores no acostamento */}
            {i % 2 === 0 ? (
              <>
                <path d={quad(-1.75, -1.68, zz, zz + 0.15)} fill="#FFFFFF" />
                <path d={quad(1.68, 1.75, zz, zz + 0.15)} fill="#FFFFFF" />
              </>
            ) : null}
          </g>
        ))}
        {/* placa */}
        {zPlaca < 39.5 ? (
          <g transform={`translate(${placa.x}, ${placa.y - 700 * esc})`}>
            <rect
              x={-6 * esc * 10}
              y={0}
              width={12 * esc * 10}
              height={700 * esc}
              fill="#9AA"
            />
            <rect
              x={-260 * esc * 3}
              y={-170 * esc * 3}
              width={520 * esc * 3}
              height={190 * esc * 3}
              rx={14 * esc * 3}
              fill="#0E6B3A"
              stroke="#FFF"
              strokeWidth={6 * esc * 3}
            />
            <text
              x={0}
              y={-60 * esc * 3}
              textAnchor="middle"
              fill="#FFF"
              fontFamily={FONTE}
              fontWeight={800}
              fontSize={86 * esc * 3}
            >
              CUIABÁ ↑
            </text>
          </g>
        ) : null}
      </svg>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 60%, transparent 55%, rgba(0,0,0,0.45) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

// ---------- lavoura em perspectiva ----------
const Lavoura: React.FC = () => {
  const f = useCurrentFrame();
  const andou = (f / 30) * 4;
  const fileiras = 26;
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, #2E78C7 0%, #8EC5F0 36%, #E7F3D8 45%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 700,
          top: 160,
          width: 380,
          height: 380,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,250,210,0.95) 0%, rgba(255,230,140,0.4) 40%, transparent 70%)",
        }}
      />
      <svg
        width={1080}
        height={1920}
        style={{ position: "absolute", inset: 0 }}
      >
        <rect
          x={0}
          y={HORIZONTE}
          width={1080}
          height={1920 - HORIZONTE}
          fill="#6B4A2A"
        />
        {Array.from({ length: fileiras }).map((_, i) => {
          const x1 = -6 + (i * 12) / fileiras;
          const x2 = x1 + 0.22;
          const a = projeta(x1, 80);
          const b = projeta(x2, 80);
          const c = projeta(x2, 0.9);
          const d = projeta(x1, 0.9);
          return (
            <path
              key={i}
              d={`M${a.x},${a.y} L${b.x},${b.y} L${c.x},${c.y} L${d.x},${d.y} Z`}
              fill={i % 2 ? "#3F8F2F" : "#4FA63A"}
            />
          );
        })}
        {/* faixas de luz passando (sensação de movimento) */}
        {Array.from({ length: 10 }).map((_, i) => {
          const zz = ((i * 8 - (andou % 8) + 80) % 80) + 1;
          const a = projeta(-6, zz);
          const b = projeta(6, zz + 0.6);
          return (
            <rect
              key={i}
              x={0}
              y={a.y}
              width={1080}
              height={Math.max(1, b.y - a.y)}
              fill="#FFF"
              opacity={0.06}
            />
          );
        })}
      </svg>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 60%, transparent 55%, rgba(0,0,0,0.35) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

// ---------- texto digitado (com relevo 3D) ----------
type Digitado = {
  de: number;
  texto: string;
  y: number;
  tam: number;
  cor?: string;
  cps?: number;
  ate?: number;
  destaque?: boolean;
};
const DIGITADOS: Digitado[] = [
  {
    de: o(3.79),
    texto: "11 DE OUTUBRO",
    y: 250,
    tam: 84,
    cor: COR.amarelo,
    ate: o(7.2),
  },
  {
    de: o(7.6) + 10,
    texto: "ANOS DA DIVISÃO",
    y: 560,
    tam: 58,
    ate: CEN.abertura[1],
  },
  {
    de: o(12.6),
    texto: "1962",
    y: 260,
    tam: 150,
    cor: COR.amarelo,
    ate: UNO + 6,
  },
  {
    de: UNO + 14,
    texto: "MATO GROSSO UNO",
    y: 250,
    tam: 76,
    ate: CEN.chegada[1],
  },
  { de: o(19.7), texto: "O SONHO DA DIVISÃO", y: 250, tam: 66, ate: o(23.6) },
  { de: o(27.8), texto: "ATÉ CUIABÁ", y: 470, tam: 58, ate: CEN.estrada[1] },
  {
    de: CEN.divisao[0] + 6,
    texto: "11/10/1977",
    y: 220,
    tam: 64,
    cor: COR.amarelo,
    ate: o(33.86),
  },
  {
    de: CEN.divisao[0] + 26,
    texto: "LEI COMPLEMENTAR Nº 31",
    y: 310,
    tam: 50,
    ate: o(33.86),
  },
  {
    de: CEN.divisao[0] + 62,
    texto: "MATO GROSSO",
    y: 640,
    tam: 48,
    ate: o(33.86),
  },
  {
    de: CEN.divisao[0] + 80,
    texto: "MATO GROSSO DO SUL",
    y: 1120,
    tam: 48,
    cor: COR.amarelo,
    ate: o(33.86),
  },
  {
    de: DURACAO - 52,
    texto: "49 ANOS · 11 DE OUTUBRO",
    y: 1110,
    tam: 54,
    cor: COR.amarelo,
  },
  { de: o(34.3), texto: "DOIS ESTADOS", y: 250, tam: 80, ate: CEN.divisao[1] },
  {
    de: o(38.3),
    texto: "DOIS IRMÃOS",
    y: 250,
    tam: 90,
    cor: COR.amarelo,
    ate: CEN.irmaos[1],
  },
  {
    de: o(46.6),
    texto: "AGRONEGÓCIO",
    y: 250,
    tam: 92,
    cor: COR.amarelo,
    ate: o(48.2),
  },
  { de: o(48.3), texto: "TERRAS FÉRTEIS", y: 250, tam: 86, ate: o(53.5) },
  {
    de: o(57.2),
    texto: "AQUI NO SUL",
    y: 250,
    tam: 90,
    cor: COR.amarelo,
    ate: CEN.sul[1],
  },
  {
    de: o(63.2),
    texto: "PARABÉNS,",
    y: 230,
    tam: 96,
    cor: COR.amarelo,
    ate: DURACAO - 70,
  },
  {
    de: o(63.2) + 14,
    texto: "MATO GROSSO DO SUL",
    y: 340,
    tam: 70,
    ate: DURACAO - 70,
  },
  {
    de: o(75.4),
    texto: "DIAS MELHORES",
    y: 470,
    tam: 62,
    cor: COR.verdeClaro,
    ate: DURACAO - 70,
  },
];
const CPS = 0.55; // caracteres por quadro (~16 por segundo)

const relevo = (cor: string, n: number) =>
  Array.from({ length: n }, (_, k) => `0 ${k + 1}px 0 ${cor}`).join(", ") +
  ", 0 14px 26px rgba(0,0,0,0.55)";

const TextoDigitado: React.FC<{ d: Digitado }> = ({ d }) => {
  const f = useCurrentFrame();
  const n = Math.min(d.texto.length, Math.floor(f * (d.cps ?? CPS)) + 1);
  const fim = (d.ate ?? 1e9) - d.de;
  const sai = 1 - ent(f, fim - 10, fim);
  const digitou = Math.ceil(d.texto.length / (d.cps ?? CPS));
  const cursor =
    n < d.texto.length || (f < digitou + 24 && Math.floor(f / 8) % 2 === 0);
  const giro = Math.sin((f + d.de) / 50) * 8;
  return (
    <AbsoluteFill
      style={{ perspective: 1000, alignItems: "center", opacity: sai }}
    >
      <div
        style={{
          position: "absolute",
          top: d.y,
          fontFamily: FONTE,
          fontWeight: 900,
          fontSize: d.tam,
          letterSpacing: -1,
          color: d.cor ?? COR.branco,
          textShadow: relevo(
            d.cor === COR.amarelo ? "#9C7A12" : "#5E6E80",
            Math.round(d.tam / 12),
          ),
          transform: `rotateY(${giro}deg) rotateX(8deg)`,
          whiteSpace: "nowrap",
        }}
      >
        {d.texto.slice(0, n)}
        <span
          style={{
            opacity: cursor && n <= d.texto.length && f < fim - 14 ? 1 : 0,
            color: COR.amarelo,
            marginLeft: 4,
          }}
        >
          |
        </span>
      </div>
    </AbsoluteFill>
  );
};

// "49" gigante em 3D atrás dele
const Grande49: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 12, stiffness: 90 } });
  const sai =
    1 - ent(f, CEN.abertura[1] - o(7.6) - 12, CEN.abertura[1] - o(7.6));
  return (
    <AbsoluteFill
      style={{ perspective: 1200, alignItems: "center", opacity: sai }}
    >
      <div
        style={{
          position: "absolute",
          top: 520,
          left: 60,
          fontFamily: FONTE,
          fontWeight: 900,
          fontSize: 560,
          lineHeight: 1,
          letterSpacing: -30,
          color: COR.amarelo,
          textShadow: relevo("#8E6E0E", 24),
          transform: `translateZ(${interpolate(s, [0, 1], [-800, 0])}px) rotateY(${18 + Math.sin(f / 30) * 5}deg) rotateX(10deg)`,
          opacity: Math.min(1, s * 1.5),
        }}
      >
        49
      </div>
    </AbsoluteFill>
  );
};

// contador de quilômetros (sincronizado com "800 quilômetros" da fala)
const Contador: React.FC = () => {
  const f = useCurrentFrame();
  const v = Math.round(
    interpolate(f, [0, 34], [0, 800], {
      ...clamp,
      easing: (x) => 1 - (1 - x) ** 3,
    }),
  );
  const sai =
    1 - ent(f, CEN.estrada[1] - o(25.3) - 12, CEN.estrada[1] - o(25.3));
  return (
    <AbsoluteFill
      style={{ perspective: 1000, alignItems: "center", opacity: sai }}
    >
      <div
        style={{
          position: "absolute",
          top: 240,
          fontFamily: FONTE,
          fontWeight: 900,
          fontSize: 190,
          color: COR.branco,
          letterSpacing: -6,
          fontVariantNumeric: "tabular-nums",
          textShadow: relevo("#5E6E80", 14),
          transform: `rotateX(10deg) scale(${1 + Math.max(0, 1 - f / 10) * 0.2})`,
        }}
      >
        {v}
        <span style={{ fontSize: 90, color: COR.amarelo, marginLeft: 18 }}>
          KM
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ---------- legendas ----------
const Legendas: React.FC = () => {
  const f = useCurrentFrame();
  const b = BLOCOS_LEGENDA.find((x) => f >= x.de && f < x.ate);
  if (!b) return null;
  const entra = ent(f - b.de, 0, 6);
  const sai = interpolate(f, [b.ate - 4, b.ate], [1, 0], clamp);
  const cor = {
    branco: COR.branco,
    amarelo: COR.amarelo,
    verde: COR.verdeClaro,
  };
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        paddingTop: 1330,
        paddingLeft: 70,
        paddingRight: 70,
      }}
    >
      <div
        style={{
          fontFamily: FONTE,
          fontWeight: 800,
          fontSize: 54,
          lineHeight: 1.16,
          textAlign: "center",
          padding: "12px 26px",
          borderRadius: 18,
          background: "rgba(4,16,30,0.55)",
          opacity: entra * sai,
          transform: `translateY(${(1 - entra) * 14}px)`,
          textShadow: "0 3px 10px rgba(0,0,0,0.5)",
        }}
      >
        {b.palavras.map((p, i) => (
          <span key={i} style={{ color: cor[p.cor] }}>
            {p.texto}
            {i < b.palavras.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------- final: logo ----------
const LOGO = "ms/logo-ze.png";
const Logo: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 13, stiffness: 80 } });
  const W = 820;
  return (
    <AbsoluteFill style={{ perspective: 1200, alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          top: 560,
          opacity: Math.min(1, s * 1.5),
          transform: `translateZ(${interpolate(s, [0, 1], [-700, 0])}px) rotateY(${(1 - s) * -40 + Math.sin(f / 30) * 5}deg)`,
          filter: "drop-shadow(0 26px 40px rgba(0,0,0,0.5))",
        }}
      >
        <Img
          src={staticFile(LOGO)}
          style={{ width: W, height: Math.round((W * 474) / 844) }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ---------- montagem ----------

const Cenario: React.FC = () => {
  const f = useCurrentFrame();
  // fusão de 10 quadros nas trocas de cenário
  const op = (de: number, ate: number) =>
    ent(f, de, de + 10) * (1 - ent(f, ate - 2, ate + 8));
  return (
    <AbsoluteFill>
      <Palco />
      <MapaPiso />
      <AbsoluteFill style={{ opacity: op(CEN.estrada[0], CEN.estrada[1]) }}>
        {f >= CEN.estrada[0] - 2 && f < CEN.estrada[1] + 10 ? (
          <Estrada />
        ) : null}
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: op(CEN.agro[0], CEN.agro[1]) }}>
        {f >= CEN.agro[0] - 2 && f < CEN.agro[1] + 10 ? <Lavoura /> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const TECLAS = ["audio/tecla1.wav", "audio/tecla2.wav", "audio/tecla3.wav"];

export const DivisaoMS3D: React.FC = () => {
  const trilha = (f: number) => {
    let dist = 999;
    for (const [a, b] of FALA_ATIVA) {
      if (f >= a - 4 && f <= b + 4) {
        dist = 0;
        break;
      }
      dist = Math.min(dist, Math.abs(f - a), Math.abs(f - b));
    }
    const base = interpolate(dist, [0, 12], [0.14, 0.26], clamp);
    return (
      base * interpolate(f, [0, 30, DURACAO - 50, DURACAO], [0, 1, 1, 0], clamp)
    );
  };
  return (
    <AbsoluteFill style={{ backgroundColor: COR.noite }}>
      <Cenario />
      <Sequence
        from={o(7.6)}
        durationInFrames={CEN.abertura[1] - o(7.6)}
        name="49 gigante"
      >
        <Grande49 />
      </Sequence>
      {BLOCOS.map(([a, b]) => (
        <Sequence
          key={`p${a}`}
          from={o(a)}
          durationInFrames={Math.round((b - a) * FPS)}
          name={`orador ${a}`}
        >
          <Orador inicioBloco={a} inicioSaida={o(a)} />
        </Sequence>
      ))}
      <Sequence
        from={o(25.3)}
        durationInFrames={CEN.estrada[1] - o(25.3)}
        name="contador km"
      >
        <Contador />
      </Sequence>
      {DIGITADOS.map((d) => (
        <Sequence
          key={`t${d.de}`}
          from={d.de}
          durationInFrames={(d.ate ?? DURACAO) - d.de}
          name={`texto ${d.texto}`}
        >
          <TextoDigitado d={d} />
        </Sequence>
      ))}
      <Sequence from={DURACAO - 70} durationInFrames={70} name="logo">
        <Logo />
      </Sequence>
      <Legendas />

      {/* som */}
      {BLOCOS.map(([a, b]) => {
        const dur = Math.round((b - a) * FPS);
        return (
          <Sequence
            key={`v${a}`}
            from={o(a)}
            durationInFrames={dur}
            name={`voz ${a}`}
          >
            <Audio
              src={staticFile("ms/voz-final.wav")}
              trimBefore={Math.round(a * FPS)}
              volume={(x) =>
                interpolate(x, [0, 3, dur - 3, dur], [0, 1, 1, 0], clamp)
              }
            />
          </Sequence>
        );
      })}
      <Audio src={staticFile("ms/trilha.wav")} volume={trilha} />
      {DIGITADOS.flatMap((d) =>
        d.texto.split("").map((ch, j) =>
          ch === " " ? null : (
            // a letra j aparece quando floor(f·cps) + 1 > j
            <Sequence
              key={`k${d.de}-${j}`}
              from={d.de + Math.ceil(j / (d.cps ?? CPS))}
              durationInFrames={4}
              name="tecla"
              layout="none"
            >
              <Audio src={staticFile(TECLAS[j % 3])} volume={0.09} />
            </Sequence>
          ),
        ),
      )}
      {[
        CEN.chegada[0],
        UNO,
        CEN.estrada[0],
        CEN.divisao[0],
        CEN.irmaos[0],
        CEN.agro[0],
        CEN.sul[0],
        CEN.final[0],
      ].map((q) => (
        <Sequence
          key={`w${q}`}
          from={q - 6}
          durationInFrames={30}
          name="whoosh"
        >
          <Audio src={staticFile("audio/r43/whoosh.wav")} volume={0.12} />
        </Sequence>
      ))}
      {[o(7.6), CEN.divisao[0] + 20, o(63.2), DURACAO - 70].map((q) => (
        <Sequence key={`i${q}`} from={q} durationInFrames={60} name="impacto">
          <Audio src={staticFile("audio/r43/impacto.wav")} volume={0.16} />
        </Sequence>
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <Sequence
          key={`c${i}`}
          from={o(25.3) + i * 4}
          durationInFrames={4}
          name="contador"
          layout="none"
        >
          <Audio src={staticFile("audio/tick.wav")} volume={0.1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
