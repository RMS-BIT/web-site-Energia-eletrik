import {
  AbsoluteFill,
  Audio,
  Easing,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";
import { FONTE } from "../AnuncioImageador/tema";
import { BLOCOS, BLOCOS_LEGENDA, DURACAO, FALA_ATIVA, FPS, PLANOS, paraSaida, type Plano } from "./edicao";
import mapa from "./mapa.json";
import rosto from "./rosto.json";

// Identidade do projeto: azul-marinho, branco, verde suave e amarelo contido.
const COR = {
  marinho: "#0D355A",
  azul: "#124A78",
  azulMedio: "#1B5F8E",
  amarelo: "#F6D54A",
  verde: "#7CCB8A",
  verdeForte: "#44B552",
  branco: "#FFFFFF",
  preenche: "#2A6E9E",
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const suave = Easing.bezier(0.22, 1, 0.36, 1);
const ent = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: suave });
const FUSAO = 8;

export const divisaoSchema = z.object({
  mostrarNome: z.boolean(),
  nome: z.string(),
  cargo: z.string(),
  volumeTrilha: z.number().min(0).max(1),
});
export type DivisaoProps = z.infer<typeof divisaoSchema>;
export const divisaoPadrao: DivisaoProps = {
  mostrarNome: true,
  nome: "Zé Teixeira",
  cargo: "Deputado Estadual · MS",
  volumeTrilha: 1,
};

const ROSTO = rosto.rosto as [number, number, number][];
const FPS_FONTE = rosto.fps as number;

// ---------- Orador: reenquadramento digital seguindo o rosto ----------
const Orador: React.FC<{ plano: Plano }> = ({ plano }) => {
  const f = useCurrentFrame();
  const dur = (plano.ate - plano.de) * FPS;
  const [z0, z1] = plano.zoom ?? [1.2, 1.25];
  const s = z0 + (z1 - z0) * interpolate(f, [0, dur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const src = plano.de + f / FPS;
  const r = ROSTO[Math.min(ROSTO.length - 1, Math.round(src * FPS_FONTE))];
  const W = 1 / s;
  const H = 1 / s;
  const cx = Math.min(Math.max(r[0], W / 2), 1 - W / 2);
  let y0 = 0;
  if (plano.tipo !== "aberto") {
    const posRosto = plano.tipo === "close" ? 0.3 : 0.25; // altura do rosto dentro do quadro
    const cy = r[1] + (0.5 - posRosto) * H;
    // nunca mostrar a faixa inferior (marca d'água do conversor no bruto)
    y0 = Math.min(Math.max(cy - H / 2, 0), 0.92 - H);
  }
  const x0 = cx - W / 2;
  return (
    <AbsoluteFill style={{ backgroundColor: "black", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transformOrigin: "0 0",
          transform: `translate(${-x0 * 1080 * s}px, ${-y0 * 1920 * s}px) scale(${s})`,
        }}
      >
        <OffthreadVideo
          src={staticFile("ms/fala-4k.mp4")}
          trimBefore={Math.round(plano.de * FPS)}
          muted
          style={{ width: 1080, height: 1920 }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 52%, rgba(4,16,30,0.42) 68%, rgba(4,16,30,0.5) 80%, rgba(4,16,30,0.2) 100%)," +
            "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.22) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

// ---------- Mapas (contornos oficiais dos estados) ----------
const MAPA_ESCALA = 0.76;
const MAPA_X = (1080 - mapa.largura * MAPA_ESCALA) / 2;
const MAPA_Y = 400;

const FundoMapa: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 50% 38%, ${COR.azulMedio} 0%, ${COR.marinho} 55%, #071E35 100%)`,
    }}
  >
    <svg width={1080} height={1920} style={{ opacity: 0.07 }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 100 + 40} y1={0} x2={i * 100 + 40} y2={1920} stroke="white" strokeWidth={1} />
      ))}
      {Array.from({ length: 20 }).map((_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 100} x2={1080} y2={i * 100} stroke="white" strokeWidth={1} />
      ))}
    </svg>
  </AbsoluteFill>
);

const Rotulo: React.FC<{ x: number; y: number; texto: string; p: number; tam?: number; cor?: string; peso?: number }> = ({
  x,
  y,
  texto,
  p,
  tam = 30,
  cor = COR.branco,
  peso = 700,
}) => (
  <text
    x={x}
    y={y + (1 - p) * 10}
    textAnchor="middle"
    fill={cor}
    opacity={p}
    fontFamily={FONTE}
    fontWeight={peso}
    fontSize={tam}
    letterSpacing={tam * 0.18}
  >
    {texto}
  </text>
);

type ModoMapa = "uno" | "cuiaba" | "divisao";

const Mapa: React.FC<{ modo: ModoMapa; dur: number }> = ({ modo, dur }) => {
  const f = useCurrentFrame();
  const entra = ent(f, 0, FUSAO);
  const sai = interpolate(f, [dur, dur + FUSAO], [1, 0], clamp);
  const desenho = modo === "uno" ? ent(f, 2, 34) : 1;
  const preenche = modo === "uno" ? ent(f, 10, 36) : 1;
  // divisão
  const linha = modo === "divisao" ? ent(f, 8, 44) : 0;
  const verde = modo === "divisao" ? ent(f, 30, 62) : 0;
  const separa = modo === "divisao" ? ent(f, 40, 72) * 14 : 0;
  // Cuiabá
  const caminho = modo === "cuiaba" ? ent(f, 22, 92) : 0;
  const pulso = modo === "cuiaba" ? (f % 40) / 40 : 0;
  // câmera (Ken Burns)
  const zoom =
    modo === "uno"
      ? interpolate(f, [0, dur], [1.0, 1.05], clamp)
      : modo === "cuiaba"
        ? interpolate(f, [0, dur], [1.08, 1.0], { ...clamp, easing: Easing.inOut(Easing.sin) })
        : interpolate(f, [0, dur], [1.05, 1.0], clamp);
  const origemY = modo === "cuiaba" ? interpolate(f, [0, dur], [1000, 640], clamp) : 760;

  const [cxC, cyC] = mapa.cuiaba;
  const [mtX, mtY] = mapa.centroMT;
  const [msX, msY] = mapa.centroMS;
  const sulX = msX + 10;
  const sulY = msY + 150;

  return (
    <AbsoluteFill style={{ opacity: entra * sai }}>
      <FundoMapa />
      <AbsoluteFill style={{ transformOrigin: `540px ${MAPA_Y + origemY * MAPA_ESCALA}px`, transform: `scale(${zoom})` }}>
        <svg width={1080} height={1920}>
          <g transform={`translate(${MAPA_X} ${MAPA_Y}) scale(${MAPA_ESCALA})`}>
            {/* contorno externo único (os preenchimentos cobrem a divisa interna) */}
            <path d={mapa.mt} fill="none" stroke={COR.branco} strokeWidth={5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - desenho} />
            <g transform={`translate(0 ${separa})`}>
              <path d={mapa.ms} fill="none" stroke={COR.branco} strokeWidth={5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - desenho} />
            </g>
            <path d={mapa.mt} fill={COR.preenche} fillOpacity={preenche} stroke={COR.preenche} strokeOpacity={preenche} strokeWidth={1.5} />
            <g transform={`translate(0 ${separa})`}>
              <path d={mapa.ms} fill={COR.preenche} fillOpacity={preenche} stroke={COR.preenche} strokeOpacity={preenche} strokeWidth={1.5} />
              <path d={mapa.ms} fill={COR.verdeForte} fillOpacity={0.55 * verde} />
              {modo === "divisao" ? (
                <path d={mapa.ms} fill="none" stroke={COR.amarelo} strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - linha} />
              ) : null}
            </g>
            {modo === "cuiaba" ? (
              <g>
                <path
                  d={`M ${sulX} ${sulY} C ${sulX + 60} ${sulY - 260}, ${cxC + 80} ${cyC + 200}, ${cxC} ${cyC + 6}`}
                  fill="none"
                  stroke={COR.amarelo}
                  strokeWidth={4}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={`${caminho} 1`}
                />
                <circle cx={sulX} cy={sulY} r={7} fill={COR.branco} opacity={ent(f, 10, 20)} />
                <circle cx={cxC} cy={cyC} r={9 + 26 * pulso} fill="none" stroke={COR.amarelo} strokeWidth={2} opacity={(1 - pulso) * ent(f, 6, 16)} />
                <circle cx={cxC} cy={cyC} r={9} fill={COR.amarelo} opacity={ent(f, 6, 16)} />
                <Rotulo x={cxC} y={cyC - 30} texto="CUIABÁ" p={ent(f, 12, 28)} tam={30} />
              </g>
            ) : null}
            {modo === "uno" ? (
              <Rotulo x={mtX + 20} y={mtY + 120} texto="MATO GROSSO" p={ent(f, 22, 42)} tam={40} />
            ) : null}
            {modo === "divisao" ? (
              <>
                <Rotulo x={mtX} y={mtY} texto="MATO GROSSO" p={ent(f, 52, 72)} tam={36} />
                <Rotulo x={msX} y={msY + separa + 6} texto="MATO GROSSO" p={ent(f, 58, 78)} tam={30} />
                <Rotulo x={msX} y={msY + separa + 46} texto="DO SUL" p={ent(f, 58, 78)} tam={30} />
              </>
            ) : null}
          </g>
        </svg>
      </AbsoluteFill>
      {/* títulos fixos no topo */}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 290, fontFamily: FONTE }}>
        {modo === "uno" ? (
          <Titulo kicker="ANTES DA DIVISÃO" titulo="Mato Grosso uno" p={ent(f, 6, 24)} />
        ) : modo === "divisao" ? (
          <Titulo kicker="11 DE OUTUBRO DE 1977" titulo="Lei Complementar nº 31" p={ent(f, 14, 32)} />
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Titulo: React.FC<{ kicker: string; titulo: string; p: number }> = ({ kicker, titulo, p }) => (
  <div style={{ textAlign: "center", opacity: p, transform: `translateY(${(1 - p) * 12}px)` }}>
    <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: 7, color: COR.amarelo }}>{kicker}</div>
    <div style={{ width: 50 * p, height: 2, background: COR.amarelo, margin: "14px auto" }} />
    <div style={{ fontSize: 40, fontWeight: 600, color: COR.branco, letterSpacing: 0.5 }}>{titulo}</div>
  </div>
);

// ---------- Legendas ----------
const Legendas: React.FC = () => {
  const f = useCurrentFrame();
  const b = BLOCOS_LEGENDA.find((x) => f >= x.de && f < x.ate);
  if (!b) return null;
  const k = f - b.de;
  const entra = ent(k, 0, 6);
  const sai = interpolate(f, [b.ate - 4, b.ate], [1, 0], clamp);
  const cor = { branco: COR.branco, amarelo: COR.amarelo, verde: COR.verde };
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 1300, paddingLeft: 80, paddingRight: 80 }}>
      <div
        style={{
          fontFamily: FONTE,
          fontWeight: 700,
          fontSize: 58,
          lineHeight: 1.18,
          textAlign: "center",
          maxWidth: 920,
          letterSpacing: -0.3,
          opacity: entra * sai,
          transform: `translateY(${(1 - entra) * 14}px)`,
          textShadow: "0 3px 14px rgba(0,0,0,0.55), 0 0 2px rgba(0,0,0,0.5)",
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

// ---------- Identificação e marcas de data ----------
const Identificacao: React.FC<{ nome: string; cargo: string }> = ({ nome, cargo }) => {
  const f = useCurrentFrame();
  const de = 24;
  const ate = 165;
  const p = ent(f, de, de + 16);
  const s = interpolate(f, [ate - 12, ate], [1, 0], clamp);
  if (f < de || f > ate) return null;
  return (
    <AbsoluteFill style={{ paddingTop: 1090, paddingLeft: 80, fontFamily: FONTE, opacity: s }}>
      <div style={{ display: "flex", alignItems: "stretch", gap: 22 }}>
        <div style={{ width: 6, background: COR.amarelo, transform: `scaleY(${p})`, transformOrigin: "top", borderRadius: 3 }} />
        <div style={{ overflow: "hidden" }}>
          <div style={{ fontSize: 50, fontWeight: 700, color: COR.branco, transform: `translateY(${(1 - p) * 100}%)`, textShadow: "0 3px 14px rgba(0,0,0,0.5)" }}>
            {nome}
          </div>
          <div style={{ fontSize: 28, fontWeight: 500, color: "#E8EEF5", letterSpacing: 2, transform: `translateY(${(1 - ent(f, de + 6, de + 22)) * 140}%)`, textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
            {cargo}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const MarcaData: React.FC = () => {
  const f = useCurrentFrame();
  const de = paraSaida(7.3);
  const ate = paraSaida(10.0);
  if (f < de || f > ate) return null;
  const p = ent(f, de, de + 14) * interpolate(f, [ate - 10, ate], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ paddingTop: 300, paddingLeft: 80, fontFamily: FONTE, opacity: p, alignItems: "flex-start" }}>
      <div style={{ display: "inline-block", padding: "18px 26px", borderRadius: 14, background: "rgba(13,53,90,0.78)", borderLeft: `4px solid ${COR.amarelo}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, color: COR.branco }}>
        <span style={{ fontSize: 34, fontWeight: 600 }}>1977</span>
        <span style={{ width: 80 * p, height: 2, background: COR.amarelo }} />
        <span style={{ fontSize: 34, fontWeight: 600 }}>2026</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 24, fontWeight: 600, letterSpacing: 6, color: COR.amarelo }}>49 ANOS DA DIVISÃO</div>
      </div>
    </AbsoluteFill>
  );
};

const Encerramento: React.FC = () => {
  const f = useCurrentFrame();
  const de = DURACAO - 34;
  const p = interpolate(f, [de, DURACAO - 4], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  if (p <= 0) return null;
  return (
    <AbsoluteFill style={{ backgroundColor: COR.marinho, opacity: p, alignItems: "center", justifyContent: "center", fontFamily: FONTE }}>
      <div style={{ textAlign: "center", opacity: ent(f, de + 8, de + 22) }}>
        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: 8, color: COR.amarelo }}>49 ANOS</div>
        <div style={{ width: 50, height: 2, background: COR.amarelo, margin: "16px auto" }} />
        <div style={{ fontSize: 44, fontWeight: 600, color: COR.branco, letterSpacing: 1 }}>Mato Grosso do Sul</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Composição ----------
const ehMapa = (t: Plano["tipo"]) => t.startsWith("mapa");
const modoMapa = (t: Plano["tipo"]): ModoMapa => (t === "mapaUno" ? "uno" : t === "mapaCuiaba" ? "cuiaba" : "divisao");

export const DivisaoMS: React.FC<DivisaoProps> = ({ mostrarNome, nome, cargo, volumeTrilha }) => {
  const trilha = (f: number) => {
    // "ducking": mais baixa durante a fala, sobe um pouco nas pausas
    let dist = 999;
    for (const [a, b] of FALA_ATIVA) {
      if (f >= a - 4 && f <= b + 4) {
        dist = 0;
        break;
      }
      dist = Math.min(dist, Math.abs(f - a), Math.abs(f - b));
    }
    const base = interpolate(dist, [0, 12], [0.16, 0.3], clamp);
    const fade = interpolate(f, [0, 30, DURACAO - 50, DURACAO], [0, 1, 1, 0], clamp);
    return base * fade * volumeTrilha;
  };
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {PLANOS.filter((p) => !ehMapa(p.tipo)).map((p) => (
        <Sequence key={`o${p.de}`} from={paraSaida(p.de)} durationInFrames={paraSaida(p.ate) - paraSaida(p.de) + FUSAO} name={`orador ${p.de}`}>
          <Orador plano={p} />
        </Sequence>
      ))}
      {PLANOS.filter((p) => ehMapa(p.tipo)).map((p) => {
        const dur = paraSaida(p.ate) - paraSaida(p.de);
        return (
          <Sequence key={`m${p.de}`} from={paraSaida(p.de)} durationInFrames={dur + FUSAO} name={`mapa ${p.tipo}`}>
            <Mapa modo={modoMapa(p.tipo)} dur={dur} />
          </Sequence>
        );
      })}

      {mostrarNome ? <Identificacao nome={nome} cargo={cargo} /> : null}
      <MarcaData />
      <Legendas />
      <Encerramento />

      {/* Voz original tratada, em blocos (os cortes caem dentro das pausas) */}
      {BLOCOS.map(([a, b]) => {
        const dur = Math.round((b - a) * FPS);
        return (
          <Sequence key={`v${a}`} from={paraSaida(a)} durationInFrames={dur} name={`voz ${a}`}>
            <Audio
              src={staticFile("ms/voz-final.wav")}
              trimBefore={Math.round(a * FPS)}
              volume={(f) => interpolate(f, [0, 3, dur - 3, dur], [0, 1, 1, 0], clamp)}
            />
          </Sequence>
        );
      })}
      <Audio src={staticFile("ms/trilha.wav")} volume={trilha} />
      {/* efeitos discretos */}
      {PLANOS.filter((p) => ehMapa(p.tipo) && p.tipo !== "mapaDivisao").map((p) => (
        <Sequence key={`w${p.de}`} from={paraSaida(p.de) - 10} durationInFrames={30} name="whoosh">
          <Audio src={staticFile("audio/r43/whoosh.wav")} volume={0.1} />
        </Sequence>
      ))}
      <Sequence from={paraSaida(33.86) - 8} durationInFrames={30} name="whoosh volta">
        <Audio src={staticFile("audio/r43/whoosh.wav")} volume={0.08} />
      </Sequence>
      <Sequence from={paraSaida(16.3) - 8} durationInFrames={30} name="whoosh volta">
        <Audio src={staticFile("audio/r43/whoosh.wav")} volume={0.08} />
      </Sequence>
      {[7.39, 63.11].map((t) => (
        <Sequence key={`i${t}`} from={paraSaida(t)} durationInFrames={80} name="impacto suave">
          <Audio src={staticFile("audio/r43/impacto.wav")} volume={0.1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
