import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { FONTE } from "../AnuncioImageador/tema";
import voz from "./voz.json";

// Story de utilidade pública a partir de matéria jornalística, com locução.
// Fonte: Campo Grande News — "Hospital de Câncer vai oferecer 180 exames
// gratuitos por dia em Campo Grande" (dados conferidos em 09/10/2026).
// A linha do tempo vem da locução (voz.json, gerado por gerar_voz_story.py).

const LINHA = voz.cenas;
type Cena = keyof typeof LINHA;
// quadro (relativo à cena) em que começa a frase n da locução
const frase = (cena: Cena, n: number) => LINHA[cena].voz - LINHA[cena].de + Math.round(LINHA[cena].frases[n] * voz.fps);
const fimVoz = (cena: Cena) => LINHA[cena].voz - LINHA[cena].de + Math.round(LINHA[cena].duracao * voz.fps);

export const STORY_DURACAO = voz.total;

const COR = {
  marinho: "#0D355A",
  amarelo: "#F6D54A",
  rosa: "#F06BA8",
  rosaTexto: "#D23F86",
  azul: "#4C9BFF",
  azulTexto: "#307ABC",
  branco: "#FFFFFF",
  papel: "#FFFFFF",
  jornal: "#F4F1EA",
  tinta: "#0D2440",
  cinza: "#5A6B80",
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const suave = Easing.bezier(0.22, 1, 0.36, 1);
const ent = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: suave });
const SOMBRA = "0 40px 90px rgba(13,36,64,0.28), 0 8px 24px rgba(13,36,64,0.12)";

export const storySchema = z.object({
  titulo: z.string(),
  editoria: z.string(),
  fonte: z.string(),
  local: z.string(),
});
export type StoryProps = z.infer<typeof storySchema>;
export const storyPadrao: StoryProps = {
  titulo: "Hospital de Câncer vai oferecer 180 exames gratuitos por dia em Campo Grande",
  editoria: "Saúde e bem-estar",
  fonte: "Campo Grande News",
  local: "Hospital de Câncer Alfredo Abrão · Campo Grande",
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

const BLOCOS = [
  ...colunas(840, 700, 1150, 2, 270, "a"),
  ...colunas(110, 1300, 2420, 4, 300, "b"),
];

const Fundo: React.FC = () => {
  const f = useCurrentFrame();
  const p = f / STORY_DURACAO;
  const luzes = [
    { x: 160, y: 380, r: 420, c: COR.rosa, v: 0.16 },
    { x: 960, y: 1550, r: 480, c: COR.azul, v: 0.14 },
    { x: 880, y: 260, r: 300, c: COR.amarelo, v: 0.12 },
  ];
  return (
    <AbsoluteFill style={{ background: COR.jornal, overflow: "hidden" }}>
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
          <rect width={PAGINA_W} height={PAGINA_H} fill={COR.jornal} />
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
          src={staticFile("story/hospital.jpg")}
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

// ---------- Cena 1: título em 3D, lido junto com a locução ----------
const DESTAQUE = ["180", "exames", "gratuitos", "por", "dia"];

const CartaoMateria: React.FC<StoryProps & { dur: number }> = ({ titulo, editoria, fonte, dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chega = spring({ frame: f, fps, config: { damping: 22, stiffness: 60, mass: 1.2 } });
  const palavras = titulo.split(" ");
  // a leitura acompanha a voz: "O Hospital ... gratuitos..." (frase 1), "por dia." (frase 2)
  const f1 = frase("titulo", 1);
  const f2 = frase("titulo", 2);
  const lido = interpolate(f, [f1 - 6, f2 - 12, f2, f2 + 26], [-1, 8, 8, palavras.length], clamp);
  const rotX = interpolate(chega, [0, 1], [48, 16]) - ent(f, 40, dur - 30) * 6;
  const rotY = interpolate(chega, [0, 1], [-38, -12]) + ent(f, 40, dur - 30) * 8;
  const rotZ = interpolate(chega, [0, 1], [8, 2]);
  const z = interpolate(chega, [0, 1], [-900, 0]);
  const desce = ent(f, 30, dur - 20) * -60;
  const sai = ent(f, dur - 22, dur - 2);
  return (
    <AbsoluteFill style={{ perspective: 1400, alignItems: "center", justifyContent: "center", paddingBottom: 20 }}>
      <div
        style={{
          width: 930,
          padding: "72px 66px 72px",
          borderRadius: 32,
          background: COR.papel,
          fontFamily: FONTE,
          boxShadow: SOMBRA,
          transform: `translateX(30px) translateZ(${z + sai * 300}px) translateY(${desce - sai * 900}px) rotateX(${rotX + sai * 30}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`,
          opacity: Math.min(1, chega * 2) * (1 - sai * 0.9),
          transformStyle: "preserve-3d",
        }}
      >
        {/* cabeçalho do veículo: logo do Campo Grande News + editoria */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 26,
            marginBottom: 34,
            borderBottom: "2px solid rgba(13,36,64,0.1)",
            opacity: ent(f, 8, 26),
          }}
        >
          <Img src={staticFile("story/logo-cgn.png")} alt={fonte} style={{ height: 132, width: (132 * 252) / 148 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: COR.rosa }} />
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 4, color: COR.rosaTexto, textTransform: "uppercase" }}>{editoria}</div>
          </div>
        </div>
        <div style={{ fontSize: 84, lineHeight: 1.06, fontWeight: 800, color: COR.tinta, letterSpacing: -2 }}>
          {palavras.map((p, i) => {
            const k = Math.max(0, Math.min(1, lido - i + 1));
            const marca = Math.max(0, Math.min(1, (lido - i) * 1.4));
            const ehDestaque = DESTAQUE.includes(p);
            return (
              <span key={i} style={{ position: "relative", display: "inline-block", marginRight: "0.24em" }}>
                {ehDestaque ? (
                  <span
                    style={{
                      position: "absolute",
                      left: -6,
                      right: -6,
                      bottom: 6,
                      height: "38%",
                      background: COR.amarelo,
                      borderRadius: 6,
                      transform: `scaleX(${marca})`,
                      transformOrigin: "left",
                      zIndex: 0,
                    }}
                  />
                ) : null}
                <span
                  style={{
                    position: "relative",
                    zIndex: 1,
                    opacity: 0.12 + 0.88 * k,
                    filter: `blur(${(1 - k) * 4}px)`,
                  }}
                >
                  {p}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Cena 2: foto em moldura 3D, com manchete e informações ----------
const Foto: React.FC<{ local: string; dur: number }> = ({ local, dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entra = spring({ frame: f, fps, config: { damping: 20, stiffness: 70 } });
  const sai = ent(f, dur - 14, dur);
  const p = f / dur;
  const rotY = interpolate(entra, [0, 1], [30, 0]) + Math.sin(p * Math.PI) * -4 - sai * 25;
  const rotX = interpolate(entra, [0, 1], [-18, 3]) + sai * 8;
  const zoom = 1.04 + p * 0.1;
  const brilho = interpolate(f, [16, 76], [-30, 130], clamp);
  const t1 = ent(f, 8, 26);
  const t2 = ent(f, 40, 58);
  const marca = ent(f, 30, 52);
  const lanc = frase("foto", 1) - 4; // "O lançamento é no dia 14 de outubro"
  return (
    <AbsoluteFill style={{ opacity: 1 - sai, fontFamily: FONTE, color: COR.tinta }}>
      {/* manchete-resumo */}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 290, textAlign: "center" }}>
        <div style={{ opacity: t1, transform: `translateY(${(1 - t1) * 24}px)` }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 14, fontSize: 26, fontWeight: 700, letterSpacing: 5 }}>
            <span style={{ color: COR.rosaTexto }}>OUTUBRO ROSA</span>
            <span style={{ opacity: 0.5 }}>+</span>
            <span style={{ color: COR.azulTexto }}>NOVEMBRO AZUL</span>
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.08, marginTop: 18, letterSpacing: -1 }}>
            Exames gratuitos
            <br />
            <span style={{ position: "relative", display: "inline-block" }}>
              <span
                style={{
                  position: "absolute",
                  left: -10,
                  right: -10,
                  bottom: 6,
                  height: "40%",
                  background: COR.amarelo,
                  borderRadius: 8,
                  transform: `scaleX(${marca})`,
                  transformOrigin: "left",
                }}
              />
              <span style={{ position: "relative" }}>em Campo Grande</span>
            </span>
          </div>
        </div>
      </AbsoluteFill>
      {/* foto */}
      <AbsoluteFill style={{ perspective: 1600, alignItems: "center", paddingTop: 560 }}>
        <div
          style={{
            position: "relative",
            width: 1000,
            height: 656,
            borderRadius: 30,
            overflow: "hidden",
            boxShadow: `${SOMBRA}, 0 0 0 8px #FFFFFF`,
            transform: `translateZ(${interpolate(entra, [0, 1], [-650, 0])}px) rotateY(${rotY}deg) rotateX(${rotX}deg)`,
          }}
        >
          <Img src={staticFile("story/hospital.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})` }} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(115deg, transparent ${brilho - 15}%, rgba(255,255,255,0.28) ${brilho}%, transparent ${brilho + 15}%)`,
            }}
          />
          {/* faixa inferior com o local, dentro da foto */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              padding: "26px 32px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              background: "linear-gradient(180deg, transparent, rgba(7,27,48,0.85))",
              color: COR.branco,
              fontSize: 30,
              fontWeight: 600,
              opacity: t2,
            }}
          >
            <svg width="24" height="32" viewBox="0 0 26 34">
              <path d="M13 1C6.4 1 1 6.2 1 12.7 1 21.5 13 33 13 33s12-11.5 12-20.3C25 6.2 19.6 1 13 1z" fill={COR.amarelo} />
              <circle cx="13" cy="12.5" r="4.5" fill={COR.marinho} />
            </svg>
            {local}
          </div>
        </div>
      </AbsoluteFill>
      {/* informações abaixo da foto (entram com "o lançamento...") */}
      <AbsoluteFill style={{ paddingTop: 1290, paddingLeft: 40, paddingRight: 40 }}>
        <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
          {[
            { k: "LANÇAMENTO", v: "14 de outubro", c: COR.amarelo, t: COR.marinho, d: lanc },
            { k: "EXAMES", v: "15 a 27/10", c: COR.rosa, t: COR.rosaTexto, d: lanc + 10 },
            { k: "ATENDIMENTO", v: "seg. a sex.", c: COR.azul, t: COR.azulTexto, d: lanc + 20 },
          ].map((x) => {
            const e = ent(f, x.d, x.d + 16);
            return (
              <div
                key={x.k}
                style={{
                  flex: 1,
                  padding: "20px 18px 24px",
                  borderRadius: 22,
                  background: "rgba(255,255,255,0.94)",
                  borderTop: `7px solid ${x.c}`,
                  boxShadow: "0 18px 40px rgba(13,36,64,0.16)",
                  textAlign: "center",
                  opacity: e,
                  transform: `translateY(${(1 - e) * 30}px)`,
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 4, color: x.t }}>{x.k}</div>
                <div style={{ fontSize: 36, fontWeight: 800, marginTop: 6 }}>{x.v}</div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- Cena 3: os números, com os laços das campanhas ----------
const Laco: React.FC<{ cor: string; p: number; tam?: number }> = ({ cor, p, tam = 120 }) => (
  <svg width={tam} height={tam * 1.4} viewBox="0 0 100 140">
    <path
      d="M50 70 C 20 40, 25 8, 50 8 C 75 8, 80 40, 50 70 L 22 132 M50 70 L 78 132"
      fill="none"
      stroke={cor}
      strokeWidth={13}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - p}
    />
  </svg>
);

const Numeros: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [fMamo, fPsa, fDatas, fSenhas] = [0, 1, 2, 3].map((n) => frase("numeros", n));
  const conta = Math.round(interpolate(f, [2, 34], [0, 180], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const t1 = ent(f, 0, 14);
  const sobe = ent(f, fMamo - 12, fMamo + 8); // contador sobe para dar lugar aos cartões
  const sai = ent(f, dur - 12, dur);
  const cartao = (atraso: number) => spring({ frame: f - atraso, fps, config: { damping: 18, stiffness: 110 } });
  const c1 = cartao(fMamo - 2);
  const c2 = cartao(fPsa - 2);
  // destaque do cartão que está sendo narrado
  const ativo = [ent(f, fMamo, fMamo + 10) - ent(f, fPsa - 6, fPsa + 4), ent(f, fPsa, fPsa + 10) - ent(f, fDatas - 6, fDatas + 4)];
  const datas = ent(f, fDatas - 4, fDatas + 14);
  const senhas = ent(f, fSenhas - 4, fSenhas + 12);
  return (
    <AbsoluteFill style={{ fontFamily: FONTE, color: COR.tinta, opacity: 1 - sai, perspective: 1400 }}>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: interpolate(sobe, [0, 1], [560, 300]) }}>
        <div style={{ textAlign: "center", opacity: t1, transform: `scale(${interpolate(sobe, [0, 1], [1, 0.72])})` }}>
          <div
            style={{
              fontSize: 330,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: -8,
              background: `linear-gradient(100deg, ${COR.rosaTexto}, ${COR.marinho} 50%, ${COR.azulTexto})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {conta}
          </div>
          <div style={{ fontSize: 46, fontWeight: 700, marginTop: 6 }}>exames gratuitos por dia</div>
        </div>
      </AbsoluteFill>
      {/* cartões rosa e azul */}
      <AbsoluteFill style={{ paddingTop: 820, paddingLeft: 70, paddingRight: 70, gap: 28 }}>
        {[
          { c: c1, cor: COR.rosa, txt: COR.rosaTexto, num: "80", tit: "mamografias", sub: "Mulheres de 40 a 74 anos", campanha: "OUTUBRO ROSA" },
          { c: c2, cor: COR.azul, txt: COR.azulTexto, num: "100", tit: "exames de PSA", sub: "Homens de 45 a 75 anos", campanha: "NOVEMBRO AZUL" },
        ].map((k, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 30,
              padding: "26px 36px",
              borderRadius: 28,
              background: "rgba(255,255,255,0.95)",
              border: `2px solid ${k.cor}${ativo[i] > 0.5 ? "" : "66"}`,
              boxShadow: `0 ${18 + ativo[i] * 14}px ${40 + ativo[i] * 30}px rgba(13,36,64,${0.14 + ativo[i] * 0.1})`,
              opacity: k.c,
              transform: `rotateY(${(1 - k.c) * (i ? 40 : -40)}deg) translateX(${(1 - k.c) * (i ? 200 : -200)}px) scale(${1 + ativo[i] * 0.035})`,
            }}
          >
            <Laco cor={k.cor} p={k.c} tam={78} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 5, color: k.txt }}>{k.campanha}</div>
              <div style={{ fontSize: 62, fontWeight: 800, lineHeight: 1.05 }}>
                {k.num} <span style={{ fontWeight: 600, fontSize: 44 }}>{k.tit}</span>
              </div>
              <div style={{ fontSize: 30, fontWeight: 500, color: COR.cinza }}>{k.sub}</div>
            </div>
          </div>
        ))}
        <div style={{ height: 14 }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ opacity: datas, transform: `translateY(${(1 - datas) * 24}px)` }}>
            <div style={{ display: "inline-block", padding: "16px 34px", borderRadius: 999, background: COR.amarelo, color: COR.marinho, fontSize: 40, fontWeight: 800, boxShadow: "0 14px 30px rgba(13,36,64,0.16)" }}>
              15 a 27 de outubro
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, marginTop: 18 }}>De segunda a sexta</div>
          </div>
          <div style={{ opacity: senhas, transform: `translateY(${(1 - senhas) * 20}px)` }}>
            <div style={{ fontSize: 30, fontWeight: 600, marginTop: 8 }}>Senhas por ordem de chegada</div>
            <div style={{ fontSize: 28, fontWeight: 500, marginTop: 8, color: COR.cinza }}>Rua Marechal Rondon, 1053 – Centro</div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- Cena 4: fechamento — a logo é a protagonista ----------
const Final: React.FC<{ fonte: string }> = ({ fonte }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame: f - 2, fps, config: { damping: 13, stiffness: 70, mass: 1.1 } });
  const t = ent(f, frase("final", 0) - 2, frase("final", 0) + 14); // "Prevenção salva vidas."
  const t2 = ent(f, frase("final", 1) - 2, frase("final", 1) + 14); // "Compartilhe com quem precisa."
  const ciclo = Math.max(0, f - 22) % 50;
  const brilho = interpolate(ciclo, [0, 26], [-0.4, 1.4], clamp);
  const mascara = `url(${staticFile("story/logo-ze-rosa.png")})`;
  const W = 1000;
  const H = Math.round((W * 533) / 971);
  const pulso = 1 + Math.sin(f / 14) * 0.012;
  return (
    <AbsoluteFill style={{ fontFamily: FONTE, color: COR.tinta, alignItems: "center", justifyContent: "center", perspective: 1300 }}>
      {/* halo e raios de luz atrás da logo */}
      <div
        style={{
          position: "absolute",
          width: 1300,
          height: 1000,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, #FFFFFF 0%, ${COR.rosa}44 38%, transparent 68%)`,
          opacity: logo,
          transform: `scale(${0.6 + 0.4 * logo})`,
          filter: "blur(10px)",
        }}
      />
      <svg width={1080} height={1920} style={{ position: "absolute", opacity: logo * 0.14 }}>
        {Array.from({ length: 14 }).map((_, i) => {
          const a = (i / 14) * Math.PI * 2 + f / 90;
          return (
            <line
              key={i}
              x1={540}
              y1={940}
              x2={540 + Math.cos(a) * 1100}
              y2={940 + Math.sin(a) * 1100}
              stroke={COR.rosa}
              strokeWidth={36}
              strokeLinecap="round"
              opacity={0.5}
            />
          );
        })}
      </svg>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 7, color: COR.marinho, opacity: t, marginBottom: 34 }}>
        UTILIDADE PÚBLICA
      </div>
      <div
        style={{
          position: "relative",
          width: W,
          height: H,
          opacity: Math.min(1, logo * 1.5),
          transform: `rotateY(${(1 - logo) * -60 + Math.sin(f / 22) * 6}deg) rotateX(${Math.sin(f / 30) * 3}deg) translateY(${Math.sin(f / 18) * 6}px) scale(${(0.55 + 0.45 * logo) * pulso})`,
          filter: `drop-shadow(0 26px 40px rgba(13,36,64,0.28)) blur(${(1 - Math.min(1, logo * 1.3)) * 10}px)`,
        }}
      >
        <Img src={staticFile("story/logo-ze-rosa.png")} style={{ width: W, height: H }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            WebkitMaskImage: mascara,
            WebkitMaskSize: "100% 100%",
            maskImage: mascara,
            maskSize: "100% 100%",
            background: `linear-gradient(105deg, transparent ${brilho * 100 - 16}%, rgba(255,255,255,0.85) ${brilho * 100}%, transparent ${brilho * 100 + 16}%)`,
            mixBlendMode: "screen",
          }}
        />
      </div>
      <div style={{ marginTop: 40, textAlign: "center" }}>
        <div style={{ fontSize: 46, fontWeight: 800, opacity: t, transform: `translateY(${(1 - t) * 20}px)` }}>Prevenção salva vidas.</div>
        <div style={{ opacity: t2, transform: `translateY(${(1 - t2) * 20}px)` }}>
          <div style={{ fontSize: 32, fontWeight: 600, marginTop: 14 }}>Compartilhe com quem precisa · Leia a matéria no link</div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
              marginTop: 26,
              padding: "10px 22px 10px 24px",
              borderRadius: 18,
              background: COR.branco,
              boxShadow: "0 12px 30px rgba(13,36,64,0.18)",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 600, color: COR.cinza, letterSpacing: 1 }}>Fonte</div>
            <Img src={staticFile("story/logo-cgn.png")} alt={fonte} style={{ height: 80, width: (80 * 252) / 148 }} />
          </div>
        </div>
      </div>
      {/* espaço do sticker de link (adicionado no Instagram) */}
      <div style={{ height: 120 }} />
    </AbsoluteFill>
  );
};

// trilha mais baixa enquanto a locução fala; sobe quando a voz termina
const volumeTrilha = (x: number) =>
  interpolate(
    x,
    [0, 8, LINHA.foto.de, LINHA.foto.de + 20, LINHA.numeros.de, LINHA.numeros.de + 20, LINHA.final.de + fimVoz("final"), STORY_DURACAO - 30, STORY_DURACAO],
    [0, 0.55, 0.55, 0.4, 0.4, 0.24, 0.24, 0.75, 0],
    clamp,
  );

export const StoryMateria: React.FC<StoryProps> = (props) => {
  const cenas = (["titulo", "foto", "numeros", "final"] as const).map((c) => LINHA[c]);
  return (
    <AbsoluteFill style={{ backgroundColor: COR.jornal }}>
      <Fundo />
      <Sequence from={LINHA.titulo.de} durationInFrames={LINHA.titulo.dur} name="título 3D">
        <CartaoMateria {...props} dur={LINHA.titulo.dur} />
      </Sequence>
      <Sequence from={LINHA.foto.de} durationInFrames={LINHA.foto.dur} name="foto">
        <Foto local={props.local} dur={LINHA.foto.dur} />
      </Sequence>
      <Sequence from={LINHA.numeros.de} durationInFrames={LINHA.numeros.dur} name="números">
        <Numeros dur={LINHA.numeros.dur} />
      </Sequence>
      <Sequence from={LINHA.final.de} durationInFrames={LINHA.final.dur} name="final">
        <Final fonte={props.fonte} />
      </Sequence>

      <Audio src={staticFile("story/trilha-v3.wav")} volume={volumeTrilha} />
      {(["titulo", "foto", "numeros", "final"] as const).map((c) => (
        <Sequence key={`voz-${c}`} from={LINHA[c].voz} name={`voz ${c}`}>
          <Audio src={staticFile(`story/voz/${c}.wav`)} volume={1} />
        </Sequence>
      ))}
      {cenas.map((c, i) => (
        <Sequence key={`w${i}`} from={Math.max(0, c.de - (i ? 6 : 0))} durationInFrames={30} name="whoosh">
          <Audio src={staticFile("audio/r43/whoosh.wav")} volume={0.16} />
        </Sequence>
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <Sequence key={`t${i}`} from={LINHA.numeros.de + 2 + i * 4} durationInFrames={6} name="tick">
          <Audio src={staticFile("audio/tick.wav")} volume={0.1} />
        </Sequence>
      ))}
      <Sequence from={LINHA.numeros.de + frase("numeros", 2) - 4} durationInFrames={30} name="beep">
        <Audio src={staticFile("audio/r43/beep.wav")} volume={0.12} />
      </Sequence>
    </AbsoluteFill>
  );
};
