import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
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
  FALA_ATIVA,
  FPS,
  PLANOS,
  paraSaida,
  type Plano,
} from "../DivisaoMS/edicao";
import rosto from "../DivisaoMS/rosto.json";
import { Mapa3D, type ModoMapa3D } from "./Mapa3D";

// "49 anos da divisão de MS" — v2.
// O vídeo original (cor natural, reenquadrado no rosto) conduz a fala. Só nos
// trechos em que ele EXPLICA algo o fundo dá lugar ao mapa 3D, com ele
// recortado (máscara RVM, scripts/recortar_pessoa.py — nenhuma alteração de
// rosto ou corpo) no canto, como apresentador:
//   "Mato Grosso uno" · "800 km até Cuiabá" · "houve essa divisão" · "aqui no Sul".
// O "49" e o "PARABÉNS" ficam ATRÁS dele: vídeo original → texto → recorte
// com o mesmo enquadramento.
// Fatos dos grafismos: LC nº 31, de 11/10/1977 (cria MS) — planalto.gov.br;
// 1977→2026 = 49 anos. "1962" e "800 km" são da própria fala.

const o = (src: number) => paraSaida(src); // tempo da fala (s) -> quadro
const FIM_FALA = o(78.3);
const CARTAO = 96; // cartão final com a logo
export const DIVISAO3D_DURACAO = FIM_FALA + CARTAO - 12;

const COR = {
  marinho: "#0D355A",
  noite: "#061A2E",
  azulMedio: "#1B5F8E",
  amarelo: "#F6D54A",
  verdeClaro: "#7CCB8A",
  branco: "#FFFFFF",
};

const VIDEO = "ms/fala-4k.mp4"; // original, sem filtro de cor
const RECORTE = "ms/fala-recorte-orig.webm"; // mesma cor do original

// ---------- enquadramento (o mesmo para o vídeo e para o recorte) ----------
const ROSTO = rosto.rosto as [number, number, number][];
const FPS_FONTE = rosto.fps as number;
const rostoEm = (src: number) =>
  ROSTO[Math.min(ROSTO.length - 1, Math.max(0, Math.round(src * FPS_FONTE)))];

type Quadro = { s: number; tx: number; ty: number };

// nos trechos de mapa o vídeo de fundo segue como plano médio
const BASE: Plano[] = PLANOS.map((p) =>
  p.tipo.startsWith("mapa") ? { ...p, tipo: "medio", zoom: [1.26, 1.3] } : p,
);
const planoEm = (src: number) =>
  BASE.find((p) => src >= p.de && src < p.ate) ?? BASE[BASE.length - 1];

const enquadra = (src: number): Quadro => {
  const p = planoEm(src);
  const [z0, z1] = p.zoom ?? [1.2, 1.25];
  const k = interpolate(src, [p.de, p.ate], [0, 1], clamp);
  const s = z0 + (z1 - z0) * (0.5 - Math.cos(Math.PI * k) / 2);
  const r = rostoEm(src);
  const W = 1 / s;
  const H = 1 / s;
  const cx = Math.min(Math.max(r[0], W / 2), 1 - W / 2);
  let y0 = 0;
  if (p.tipo !== "aberto") {
    const posRosto = p.tipo === "close" ? 0.3 : 0.25;
    const cy = r[1] + (0.5 - posRosto) * H;
    // nunca mostrar a faixa inferior (marca d'água do conversor no bruto)
    y0 = Math.min(Math.max(cy - H / 2, 0), 0.92 - H);
  }
  return { s, tx: -(cx - W / 2) * 1080 * s, ty: -y0 * 1920 * s };
};

const transforma = (q: Quadro) =>
  `translate(${q.tx}px, ${q.ty}px) scale(${q.s})`;

// ---------- trechos explicativos (mapa 3D + recorte) ----------
type Foto = "estrada" | "colheita" | "soja" | "gado";
type Trecho = { modo: ModoMapa3D | Foto; de: number; ate: number };
type Grupo = { de: number; ate: number; trechos: Trecho[] };
const GRUPOS: Grupo[] = [
  { de: 13.36, ate: 16.3, trechos: [{ modo: "uno", de: 13.36, ate: 16.3 }] },
  {
    de: 23.65,
    ate: 38.05,
    trechos: [
      { modo: "estrada", de: 23.65, ate: 25.3 },
      { modo: "rota", de: 25.3, ate: 29.73 },
      { modo: "divisao", de: 29.73, ate: 38.05 },
    ],
  },
  {
    de: 45.56,
    ate: 62.8,
    trechos: [
      // "...que é o agronegócio": imagem de corte, sem o apresentador
      { modo: "colheita", de: 45.56, ate: 47.99 },
      { modo: "soja", de: 47.99, ate: 56.85 },
      { modo: "sul", de: 56.85, ate: 60.1 },
      { modo: "gado", de: 60.1, ate: 62.8 },
    ],
  },
];
const SAI = 16; // quadros da volta mapa -> vídeo
// O fundo só funde enquanto o recorte está exatamente sobre o vídeo original
// (sem imagem dupla): entra o fundo, depois ele vai ao canto; na saída ele
// volta ao enquadramento original e só então o fundo some.
const FUNDE_ENTRA = 8;
const FUNDE_SAI = 9;

// posição de "apresentador": rosto médio do trecho fixo no canto direito
const canto = (g: Grupo): Quadro => {
  let x = 0;
  let y = 0;
  let n = 0;
  for (let t = g.de; t < g.ate; t += 0.2) {
    const r = rostoEm(t);
    x += r[0];
    y += r[1];
    n++;
  }
  const s = 0.92;
  return { s, tx: 770 - (x / n) * 1080 * s, ty: 1190 - (y / n) * 1920 * s };
};

const mistura = (a: Quadro, b: Quadro, m: number): Quadro => ({
  s: a.s + (b.s - a.s) * m,
  tx: a.tx + (b.tx - a.tx) * m,
  ty: a.ty + (b.ty - a.ty) * m,
});

// quanto do mapa está na tela no quadro global f (0..1)
const noMapa = (f: number) => {
  for (const g of GRUPOS) {
    const a = o(g.de);
    const b = o(g.ate);
    if (f >= a && f < b)
      return (
        ent(f - a, 0, FUNDE_ENTRA) * (1 - ent(f - a, b - a - FUNDE_SAI, b - a))
      );
  }
  return 0;
};

const FundoMapa: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background:
          `radial-gradient(ellipse 70% 45% at ${38 + Math.sin(f / 80) * 4}% 22%, rgba(120,180,240,0.28) 0%, rgba(0,0,0,0) 70%),` +
          `radial-gradient(ellipse at 45% 40%, ${COR.azulMedio} 0%, ${COR.marinho} 48%, ${COR.noite} 100%)`,
      }}
    />
  );
};

// imagens de apoio (geradas no Higgsfield pelo operador; só paisagem, sem
// pessoas) com tratamento para casar com o vídeo: menos saturação e laranja
const FOTOS: Record<
  Foto,
  { src: string; foco: string; zoom: [number, number] }
> = {
  estrada: {
    src: "ms/fundos/estrada.png",
    foco: "50% 47%",
    zoom: [1.04, 1.32],
  },
  colheita: {
    src: "ms/fundos/colheita.png",
    foco: "58% 62%",
    zoom: [1.03, 1.14],
  },
  soja: { src: "ms/fundos/soja.png", foco: "62% 40%", zoom: [1.04, 1.16] },
  gado: { src: "ms/fundos/gado.png", foco: "40% 60%", zoom: [1.06, 1.14] },
};
const ehFoto = (m: Trecho["modo"]): m is Foto => m in FOTOS;

const CenaFoto: React.FC<{ tipo: Foto; dur: number }> = ({ tipo, dur }) => {
  const f = useCurrentFrame();
  const c = FOTOS[tipo];
  const z = interpolate(f, [0, dur + 12], c.zoom, clamp);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(c.src)}
        style={{
          width: 1080,
          height: 1920,
          objectFit: "cover",
          transformOrigin: c.foco,
          transform: `scale(${z})`,
          filter: "saturate(0.78) contrast(1.05) brightness(0.9) sepia(0.06)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(6,26,46,0.45) 0%, rgba(6,26,46,0) 28%, rgba(0,0,0,0) 62%, rgba(6,20,30,0.45) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

// folhas de soja em primeiro plano, NA FRENTE do deputado (profundidade)
const FrenteSoja: React.FC<{ g: Grupo }> = ({ g }) => {
  const f = useCurrentFrame();
  const t = g.trechos.find((x) => x.modo === "soja");
  if (!t) return null;
  const de = o(t.de) - o(g.de);
  const ate = o(t.ate) - o(g.de);
  if (f < de || f > ate + 12) return null;
  const op = ent(f, de + 6, de + 24) * (1 - ent(f, ate - 2, ate + 12));
  return (
    <AbsoluteFill style={{ opacity: op, overflow: "hidden" }}>
      <Img
        src={staticFile("ms/fundos/soja-frente.png")}
        style={{
          position: "absolute",
          width: 1700,
          height: 1133,
          left: -300 - (f - de) * 0.5,
          top: 1920 - 1133 + 330 - ent(f, de, de + 30) * 60,
          filter: "blur(2px) saturate(0.8) brightness(0.85)",
        }}
      />
    </AbsoluteFill>
  );
};

const AJUSTE: Record<ModoMapa3D, [number, number]> = {
  uno: [-120, -90],
  rota: [-110, -110],
  divisao: [-110, -150],
  sul: [-120, -120],
};

const TrechoMapa: React.FC<{ t: Trecho; dur: number; primeiro: boolean }> = ({
  t,
  dur,
  primeiro,
}) => {
  const f = useCurrentFrame();
  const op = primeiro ? 1 : ent(f, 0, 12);
  if (ehFoto(t.modo))
    return (
      <AbsoluteFill style={{ opacity: op }}>
        <CenaFoto tipo={t.modo} dur={dur} />
      </AbsoluteFill>
    );
  const [dx, dy] = AJUSTE[t.modo];
  const ini = o(t.de);
  return (
    <AbsoluteFill
      style={{ opacity: op, transform: `translate(${dx}px, ${dy}px)` }}
    >
      <Mapa3D
        modo={t.modo}
        dur={dur}
        divide={o(30.4) - ini}
        rota={[o(25.4) - ini, o(28.3) - ini]}
      />
    </AbsoluteFill>
  );
};

const CenaMapa: React.FC<{ g: Grupo }> = ({ g }) => {
  const f = useCurrentFrame();
  const dur = o(g.ate) - o(g.de);
  const op = ent(f, 0, FUNDE_ENTRA) * (1 - ent(f, dur - FUNDE_SAI, dur));
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <FundoMapa />
      {g.trechos.map((t, i) => {
        const de = o(t.de) - o(g.de);
        const d = o(t.ate) - o(t.de);
        const ultimo = i === g.trechos.length - 1;
        return (
          <Sequence
            key={t.modo}
            from={de}
            durationInFrames={d + (ultimo ? 0 : 12)}
            name={`mapa ${t.modo}`}
          >
            <TrechoMapa t={t} dur={d} primeiro={i === 0} />
          </Sequence>
        );
      })}
      {/* vinheta e luz baixa para assentar o recorte */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 50% 40%, rgba(0,0,0,0) 55%, rgba(2,10,20,0.55) 100%)," +
            "linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(3,14,26,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

// recorte do deputado: do enquadramento do vídeo até o canto e de volta
const Apresentador: React.FC<{ g: Grupo }> = ({ g }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = o(g.ate) - o(g.de);
  const src = g.de + f / FPS;
  const ida = spring({
    frame: f - FUNDE_ENTRA,
    fps,
    config: { damping: 20, stiffness: 90 },
  });
  // chega exatamente ao enquadramento original antes do fundo sumir
  const volta = ent(f, dur - FUNDE_SAI - 18, dur - FUNDE_SAI);
  // grupo que abre com imagem de corte: ele só entra (já no canto) depois
  const corte = g.trechos[0].modo === "colheita";
  const entra = corte ? o(g.trechos[1].de) - o(g.de) : 0;
  const vis = corte ? ent(f, entra, entra + 16) : 1;
  if (vis <= 0) return null;
  const m = (corte ? 1 : Math.min(1, ida)) * (1 - volta);
  const q = mistura(enquadra(src), canto(g), m);
  q.tx += (1 - vis) * 120;
  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: vis }}>
      <AbsoluteFill
        style={{ transformOrigin: "0 0", transform: transforma(q) }}
      >
        <OffthreadVideo
          src={staticFile(RECORTE)}
          trimBefore={Math.round(g.de * FPS)}
          transparent
          muted
          style={{
            width: 1080,
            height: 1920,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- vídeo original ----------
const Original: React.FC<{ de: number }> = ({ de }) => {
  const f = useCurrentFrame();
  // sob o mapa totalmente opaco não precisa decodificar o vídeo
  if (noMapa(o(de) + f) >= 0.999) return null;
  const q = enquadra(de + f / FPS);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{ transformOrigin: "0 0", transform: transforma(q) }}
      >
        <OffthreadVideo
          src={staticFile(VIDEO)}
          trimBefore={Math.round(de * FPS)}
          muted
          style={{ width: 1080, height: 1920 }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// recorte por cima do original, no mesmo enquadramento (texto "atrás" dele)
const Frente: React.FC<{ de: number }> = ({ de }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transformOrigin: "0 0",
          transform: transforma(enquadra(de + f / FPS)),
        }}
      >
        <OffthreadVideo
          src={staticFile(RECORTE)}
          trimBefore={Math.round(de * FPS)}
          transparent
          muted
          style={{ width: 1080, height: 1920 }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- texto grande atrás dele ----------
const Atras: React.FC<{
  texto: string;
  top: number;
  tam: number;
  espaco: number;
  dur: number;
  cor?: string;
}> = ({ texto, top, tam, espaco, dur, cor = COR.amarelo }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 16, stiffness: 110 } });
  const sai = 1 - ent(f, dur - 10, dur);
  return (
    <AbsoluteFill style={{ alignItems: "center", opacity: sai }}>
      <div
        style={{
          position: "absolute",
          top: top + (1 - s) * 90,
          fontFamily: FONTE,
          fontWeight: 900,
          fontSize: tam,
          lineHeight: 1,
          letterSpacing: espaco,
          paddingLeft: espaco, // compensa o espaço depois da última letra
          color: cor,
          opacity: Math.min(1, s * 1.4),
          transform: `scale(${0.86 + 0.14 * s + f * 0.0006})`,
          filter: `blur(${(1 - Math.min(1, s)) * 14}px)`,
          textShadow: "0 18px 50px rgba(0,0,0,0.35)",
          whiteSpace: "nowrap",
        }}
      >
        {texto}
      </div>
    </AbsoluteFill>
  );
};

// ---------- texto digitado (letra a letra, com som de tecla) ----------
type Digitado = {
  de: number;
  ate: number;
  texto: string;
  y: number;
  tam: number;
  cor?: string;
  esq?: boolean; // alinhado à esquerda (cenas de mapa)
  sublinha?: boolean;
};
const CPS = 0.55; // caracteres por quadro (~16 por segundo)

const DIGITADOS: Digitado[] = [
  {
    de: o(3.79),
    ate: o(5.6),
    texto: "11 DE OUTUBRO",
    y: 200,
    tam: 88,
    cor: COR.amarelo,
    sublinha: true,
  },
  {
    de: o(12.25),
    ate: o(13.36) + 6,
    texto: "1962",
    y: 190,
    tam: 170,
    cor: COR.amarelo,
  },
  {
    de: o(13.36) + 14,
    ate: o(16.3) - 4,
    texto: "ANTES DA DIVISÃO",
    y: 150,
    tam: 62,
    esq: true,
  },
  {
    de: o(19.7),
    ate: o(23.6),
    texto: "O SONHO DA DIVISÃO",
    y: 200,
    tam: 72,
    sublinha: true,
  },
  {
    de: o(27.7),
    ate: o(29.73),
    texto: "ATÉ CUIABÁ",
    y: 330,
    tam: 56,
    esq: true,
    cor: COR.amarelo,
  },
  {
    de: o(29.73) + 10,
    ate: o(33.86),
    texto: "11/10/1977",
    y: 150,
    tam: 84,
    esq: true,
    cor: COR.amarelo,
  },
  {
    de: o(29.73) + 30,
    ate: o(33.86),
    texto: "LEI COMPLEMENTAR Nº 31",
    y: 250,
    tam: 44,
    esq: true,
  },
  {
    de: o(34.0),
    ate: o(38.05) - 4,
    texto: "DOIS ESTADOS",
    y: 150,
    tam: 84,
    esq: true,
    sublinha: true,
  },
  {
    de: o(38.3),
    ate: o(42.0),
    texto: "DOIS IRMÃOS",
    y: 200,
    tam: 96,
    cor: COR.amarelo,
    sublinha: true,
  },
  {
    de: o(46.6),
    ate: o(48.0),
    texto: "AGRONEGÓCIO",
    y: 200,
    tam: 96,
    cor: COR.amarelo,
  },
  {
    de: o(48.3),
    ate: o(53.6),
    texto: "TERRAS FÉRTEIS",
    y: 150,
    tam: 84,
    esq: true,
    sublinha: true,
  },
  {
    de: o(57.1),
    ate: o(60.1),
    texto: "AQUI NO SUL",
    y: 150,
    tam: 92,
    esq: true,
    cor: COR.amarelo,
    sublinha: true,
  },
  { de: o(63.11), ate: o(68.7), texto: "MATO GROSSO DO SUL", y: 110, tam: 50 },
  {
    de: o(75.4),
    ate: FIM_FALA,
    texto: "DIAS MELHORES",
    y: 200,
    tam: 90,
    cor: COR.verdeClaro,
    sublinha: true,
  },
];

const TextoDigitado: React.FC<{ d: Digitado }> = ({ d }) => {
  const f = useCurrentFrame();
  const fim = d.ate - d.de;
  const digitou = Math.ceil(d.texto.length / CPS);
  const sai = ent(f, fim - 10, fim);
  const cursor =
    f < digitou + 18 &&
    f < fim - 12 &&
    (f < digitou || Math.floor(f / 8) % 2 === 0);
  const linha = d.sublinha ? ent(f, digitou + 2, digitou + 18) * (1 - sai) : 0;
  return (
    <AbsoluteFill
      style={{
        alignItems: d.esq ? "flex-start" : "center",
        paddingLeft: d.esq ? 70 : 0,
        opacity: 1 - sai,
        transform: `translateY(${-sai * 18}px)`,
        filter: `blur(${sai * 8}px)`,
      }}
    >
      <div style={{ position: "absolute", top: d.y }}>
        <div
          style={{
            fontFamily: FONTE,
            fontWeight: 800,
            fontSize: d.tam,
            lineHeight: 1.05,
            letterSpacing: d.tam > 120 ? -4 : 1,
            color: d.cor ?? COR.branco,
            whiteSpace: "nowrap",
            textShadow:
              "0 6px 28px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.3)",
          }}
        >
          {d.texto.split("").map((ch, j) => {
            const t = f - j / CPS;
            if (t < 0) return null;
            const p = ent(t, 0, 5);
            return (
              <span
                key={j}
                style={{
                  display: "inline-block",
                  whiteSpace: "pre",
                  opacity: p,
                  transform: `translateY(${(1 - p) * 16}px)`,
                  filter: `blur(${(1 - p) * 6}px)`,
                }}
              >
                {ch}
              </span>
            );
          })}
          <span
            style={{
              display: "inline-block",
              width: Math.max(4, d.tam * 0.06),
              height: d.tam * 0.82,
              marginLeft: d.tam * 0.08,
              background: COR.amarelo,
              verticalAlign: "-0.06em",
              opacity: cursor ? 1 : 0,
            }}
          />
        </div>
        <div
          style={{
            height: Math.max(5, d.tam * 0.07),
            marginTop: d.tam * 0.12,
            width: `${linha * 100}%`,
            marginLeft: d.esq ? 0 : `${(1 - linha) * 50}%`,
            background: d.cor === COR.amarelo ? COR.branco : COR.amarelo,
            borderRadius: 4,
            boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// contador de km, preso ao desenho da rota (Dourados -> Cuiabá)
const Contador: React.FC<{ de: number; ate: number; fim: number }> = ({
  de,
  ate,
  fim,
}) => {
  const f = useCurrentFrame();
  if (f < de - 10 || f > fim) return null;
  const k = interpolate(f, [de, ate], [0, 1], {
    ...clamp,
    easing: (x) => 0.5 - Math.cos(Math.PI * x) / 2,
  });
  const v = Math.round(800 * k);
  const entra = ent(f, de - 8, de + 4);
  const sai = ent(f, fim - 10, fim);
  const pulso = f >= ate ? 1 + 0.06 * Math.max(0, 1 - (f - ate) / 8) : 1;
  return (
    <AbsoluteFill
      style={{
        paddingLeft: 70,
        opacity: entra * (1 - sai),
        filter: `blur(${sai * 8}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 140,
          fontFamily: FONTE,
          fontWeight: 900,
          fontSize: 176,
          lineHeight: 1,
          letterSpacing: -6,
          color: COR.branco,
          fontVariantNumeric: "tabular-nums",
          textShadow: "0 8px 34px rgba(0,0,0,0.5)",
          transform: `scale(${pulso})`,
          transformOrigin: "0 50%",
        }}
      >
        {v}
        <span
          style={{
            fontSize: 76,
            color: COR.amarelo,
            marginLeft: 16,
            letterSpacing: 2,
          }}
        >
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
  if (!b || f >= FIM_FALA - 6) return null;
  const entra = ent(f - b.de, 0, 6);
  const sai = interpolate(f, [b.ate - 4, b.ate], [1, 0], clamp);
  const mapa = noMapa(f) > 0.5;
  const cor = {
    branco: COR.branco,
    amarelo: COR.amarelo,
    verde: COR.verdeClaro,
  };
  return (
    <AbsoluteFill
      style={{
        alignItems: mapa ? "flex-start" : "center",
        paddingTop: mapa ? 1300 : 1330,
        paddingLeft: mapa ? 56 : 70,
        paddingRight: mapa ? 0 : 70,
      }}
    >
      <div
        style={{
          fontFamily: FONTE,
          fontWeight: 800,
          fontSize: mapa ? 46 : 54,
          lineHeight: 1.18,
          textAlign: mapa ? "left" : "center",
          maxWidth: mapa ? 470 : undefined,
          padding: mapa ? "12px 20px" : "12px 26px",
          borderRadius: 18,
          background: "rgba(4,16,30,0.6)",
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

// ---------- cartão final ----------
const LOGO = "ms/logo-ze.png";
const Cartao: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fundo = ent(f, 0, 14);
  const s = spring({
    frame: f - 8,
    fps,
    config: { damping: 14, stiffness: 80 },
  });
  const brilho = interpolate(f, [26, 56], [-30, 130], clamp);
  const W = 860;
  const H = Math.round((W * 474) / 844);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: fundo, overflow: "hidden" }}>
        {/* Pantanal (MT e MS dividem o bioma): fundo desfocado e escurecido */}
        <Img
          src={staticFile("ms/fundos/pantanal.png")}
          style={{
            width: 1080,
            height: 1920,
            objectFit: "cover",
            transform: `scale(${1.12 + f * 0.0008})`,
            filter: "blur(7px) saturate(0.7) brightness(0.75)",
          }}
        />
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 50% 42%, rgba(27,95,142,0.55) 0%, rgba(13,53,90,0.82) 55%, rgba(6,26,46,0.95) 100%)`,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ perspective: 1400, alignItems: "center" }}>
        <div
          style={{
            position: "absolute",
            top: 620,
            width: W,
            height: H,
            opacity: Math.min(1, s * 1.4),
            transform: `translateZ(${interpolate(s, [0, 1], [-600, 0])}px) rotateY(${(1 - s) * -28 + Math.sin(f / 34) * 3}deg) rotateX(${(1 - s) * 10}deg)`,
            filter: "drop-shadow(0 34px 50px rgba(0,0,0,0.5))",
          }}
        >
          <Img src={staticFile(LOGO)} style={{ width: W, height: H }} />
          {/* reflexo de luz passando pela logo */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              mixBlendMode: "soft-light",
              background: `linear-gradient(105deg, rgba(255,255,255,0) ${brilho - 18}%, rgba(255,255,255,0.9) ${brilho}%, rgba(255,255,255,0) ${brilho + 18}%)`,
              WebkitMaskImage: `url(${staticFile(LOGO)})`,
              WebkitMaskSize: "100% 100%",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            top: 620 + H + 70,
            fontFamily: FONTE,
            fontWeight: 800,
            fontSize: 50,
            letterSpacing: 6,
            color: COR.amarelo,
            opacity: ent(f, 30, 46),
            transform: `translateY(${(1 - ent(f, 30, 46)) * 20}px)`,
            textShadow: "0 4px 18px rgba(0,0,0,0.4)",
          }}
        >
          49 ANOS · 11 DE OUTUBRO
        </div>
        <div
          style={{
            position: "absolute",
            top: 620 + H + 140,
            fontFamily: FONTE,
            fontWeight: 600,
            fontSize: 38,
            letterSpacing: 10,
            color: COR.branco,
            opacity: ent(f, 40, 56),
          }}
        >
          MATO GROSSO DO SUL
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- montagem ----------
const TECLAS = ["audio/tecla1.wav", "audio/tecla2.wav", "audio/tecla3.wav"];
const ROTA = { de: o(25.4), ate: o(28.3), fim: o(29.73) };
const QUARENTA_NOVE = { de: o(7.39), ate: o(10.09) };
const PARABENS = { de: o(63.11), ate: o(68.7) };
const TRILHA = 2304; // 76,8 s

export const DivisaoMS3D: React.FC = () => {
  const total = DIVISAO3D_DURACAO;
  const trilha = (f: number) => {
    if (f > FIM_FALA) return 0.34;
    let dist = 999;
    for (const [a, b] of FALA_ATIVA) {
      if (f >= a - 4 && f <= b + 4) {
        dist = 0;
        break;
      }
      dist = Math.min(dist, Math.abs(f - a), Math.abs(f - b));
    }
    return interpolate(dist, [0, 12], [0.13, 0.24], clamp);
  };
  const transicoes = GRUPOS.flatMap((g) => [
    { q: o(g.de) },
    { q: o(g.ate) - SAI },
  ]);
  return (
    <AbsoluteFill style={{ backgroundColor: COR.noite }}>
      {/* 1. vídeo original */}
      {BLOCOS.map(([a, b]) => (
        <Sequence
          key={`o${a}`}
          from={o(a)}
          durationInFrames={Math.round((b - a) * FPS)}
          name={`original ${a}`}
        >
          <Original de={a} />
        </Sequence>
      ))}

      {/* 2. textos atrás dele + recorte por cima */}
      <Sequence
        from={QUARENTA_NOVE.de}
        durationInFrames={QUARENTA_NOVE.ate - QUARENTA_NOVE.de}
        name="49 atrás"
      >
        <Atras
          texto="49"
          top={110}
          tam={480}
          espaco={360}
          dur={QUARENTA_NOVE.ate - QUARENTA_NOVE.de}
        />
        <Frente de={7.39} />
      </Sequence>
      <Sequence
        from={PARABENS.de}
        durationInFrames={PARABENS.ate - PARABENS.de}
        name="parabéns atrás"
      >
        <Atras
          texto="PARABÉNS"
          top={190}
          tam={150}
          espaco={-4}
          dur={PARABENS.ate - PARABENS.de}
          cor={COR.branco}
        />
        <Frente de={63.11} />
      </Sequence>

      {/* 3. trechos explicativos: mapa 3D + apresentador */}
      {GRUPOS.map((g) => (
        <Sequence
          key={`m${g.de}`}
          from={o(g.de)}
          durationInFrames={o(g.ate) - o(g.de)}
          name={`mapa ${g.de}`}
        >
          <CenaMapa g={g} />
          <Apresentador g={g} />
          <FrenteSoja g={g} />
        </Sequence>
      ))}
      <Contador de={ROTA.de} ate={ROTA.ate} fim={ROTA.fim} />

      {/* 4. tipografia */}
      {DIGITADOS.map((d) => (
        <Sequence
          key={`t${d.de}`}
          from={d.de}
          durationInFrames={d.ate - d.de}
          name={`texto ${d.texto}`}
        >
          <TextoDigitado d={d} />
        </Sequence>
      ))}
      <Legendas />
      <Sequence
        from={FIM_FALA - 12}
        durationInFrames={CARTAO}
        name="cartão final"
      >
        <Cartao />
      </Sequence>

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
      {/* a trilha (76,8 s) entra depois da primeira frase e fecha no cartão */}
      <Sequence from={total - TRILHA} name="trilha">
        <Audio
          src={staticFile("ms/trilha.wav")}
          volume={(x) =>
            trilha(x + total - TRILHA) *
            interpolate(x, [0, 40, TRILHA - 40, TRILHA], [0, 1, 1, 0], clamp)
          }
        />
      </Sequence>
      {DIGITADOS.flatMap((d) =>
        d.texto.split("").map((ch, j) =>
          ch === " " ? null : (
            <Sequence
              key={`k${d.de}-${j}`}
              from={d.de + Math.ceil(j / CPS)}
              durationInFrames={4}
              name="tecla"
              layout="none"
            >
              <Audio src={staticFile(TECLAS[j % 3])} volume={0.08} />
            </Sequence>
          ),
        ),
      )}
      {transicoes.map(({ q }) => (
        <Sequence
          key={`w${q}`}
          from={q - 6}
          durationInFrames={30}
          name="whoosh"
        >
          <Audio src={staticFile("audio/r43/whoosh.wav")} volume={0.12} />
        </Sequence>
      ))}
      {[QUARENTA_NOVE.de, o(30.4), PARABENS.de, FIM_FALA].map((q) => (
        <Sequence key={`i${q}`} from={q} durationInFrames={60} name="impacto">
          <Audio src={staticFile("audio/r43/impacto.wav")} volume={0.15} />
        </Sequence>
      ))}
      {Array.from({ length: Math.floor((ROTA.ate - ROTA.de) / 4) }).map(
        (_, i) => (
          <Sequence
            key={`c${i}`}
            from={ROTA.de + i * 4}
            durationInFrames={4}
            name="contador"
            layout="none"
          >
            <Audio src={staticFile("audio/tick.wav")} volume={0.06} />
          </Sequence>
        ),
      )}
    </AbsoluteFill>
  );
};
