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

// Story de utilidade pública a partir de matéria jornalística.
// Fonte: Campo Grande News — "Hospital de Câncer vai oferecer 180 exames
// gratuitos por dia em Campo Grande" (dados conferidos em 09/10/2026).

export const STORY_DURACAO = 540; // 18 s a 30 fps

const COR = {
  marinho: "#0D355A",
  fundo: "#071B30",
  amarelo: "#F6D54A",
  rosa: "#F06BA8",
  azul: "#4C9BFF",
  branco: "#FFFFFF",
  papel: "#F8F9FB",
  tinta: "#0D2440",
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const suave = Easing.bezier(0.22, 1, 0.36, 1);
const ent = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: suave });

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

// ---------- Fundo: azul profundo com luzes desfocadas ----------
const Fundo: React.FC = () => {
  const f = useCurrentFrame();
  const luzes = [
    { x: 200, y: 420, r: 380, c: COR.rosa, v: 0.6 },
    { x: 900, y: 1500, r: 460, c: COR.azul, v: 0.5 },
    { x: 820, y: 300, r: 260, c: COR.amarelo, v: 0.22 },
    { x: 150, y: 1600, r: 300, c: COR.rosa, v: 0.3 },
  ];
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, #12385F 0%, ${COR.fundo} 70%)` }}>
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
            opacity: l.v * 0.55,
            filter: "blur(30px)",
          }}
        />
      ))}
      {/* partículas de poeira de luz */}
      {Array.from({ length: 26 }).map((_, i) => {
        const x = random(`x${i}`) * 1080;
        const y0 = random(`y${i}`) * 1920;
        const y = (y0 - f * (0.4 + random(`v${i}`) * 0.8) + 1920) % 1920;
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
              background: COR.branco,
              opacity: 0.12 + random(`o${i}`) * 0.2,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- Cena 1: título em 3D, como se estivesse sendo lido ----------
const DESTAQUE = ["180", "exames", "gratuitos", "por", "dia"];

const CartaoMateria: React.FC<StoryProps> = ({ titulo, editoria, fonte }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chega = spring({ frame: f, fps, config: { damping: 22, stiffness: 60, mass: 1.2 } });
  const palavras = titulo.split(" ");
  const iniLeitura = 22;
  const passo = 5;
  const lido = (f - iniLeitura) / passo; // índice da palavra sendo lida
  // câmera: aproxima, inclina e "desce" acompanhando a leitura
  const rotX = interpolate(chega, [0, 1], [48, 16]) - ent(f, 60, 140) * 6;
  const rotY = interpolate(chega, [0, 1], [-38, -12]) + ent(f, 60, 140) * 8;
  const rotZ = interpolate(chega, [0, 1], [8, 2]);
  const z = interpolate(chega, [0, 1], [-900, 0]);
  const desce = ent(f, 30, 140) * -60;
  // saída: gira e sobe para revelar a foto
  const sai = ent(f, 136, 156);
  const marca = ent(f, iniLeitura + 6 * passo, iniLeitura + 12 * passo);
  return (
    <AbsoluteFill style={{ perspective: 1400, alignItems: "center", justifyContent: "center", paddingBottom: 120 }}>
      <div
        style={{
          width: 880,
          padding: "64px 64px 56px",
          borderRadius: 32,
          background: COR.papel,
          fontFamily: FONTE,
          boxShadow: "0 60px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.6) inset",
          transform: `translateZ(${z + sai * 300}px) translateY(${desce - sai * 900}px) rotateX(${rotX + sai * 30}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`,
          opacity: Math.min(1, chega * 2) * (1 - sai * 0.9),
          transformStyle: "preserve-3d",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 30 }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: COR.rosa }} />
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 5, color: COR.rosa, textTransform: "uppercase" }}>{editoria}</div>
        </div>
        <div style={{ fontSize: 74, lineHeight: 1.08, fontWeight: 800, color: COR.tinta, letterSpacing: -1.5 }}>
          {palavras.map((p, i) => {
            const k = Math.max(0, Math.min(1, lido - i + 1));
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
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 40, opacity: ent(f, 90, 110) }}>
          <div style={{ width: 40, height: 2, background: COR.tinta, opacity: 0.4 }} />
          <div style={{ fontSize: 26, fontWeight: 600, color: "#5A6B80", letterSpacing: 1 }}>{fonte}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Cena 2: foto em moldura 3D com paralaxe ----------
const Foto: React.FC<{ local: string; dur: number }> = ({ local, dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entra = spring({ frame: f, fps, config: { damping: 20, stiffness: 70 } });
  const sai = ent(f, dur - 14, dur);
  const p = f / dur;
  const rotY = interpolate(entra, [0, 1], [35, 0]) + Math.sin(p * Math.PI) * -6 - sai * 30;
  const rotX = interpolate(entra, [0, 1], [-20, 4]) + sai * 10;
  const zoom = 1.02 + p * 0.1;
  return (
    <AbsoluteFill style={{ opacity: 1 - sai }}>
      <AbsoluteFill style={{ opacity: entra }}>
        <Img
          src={staticFile("story/hospital.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(36px) brightness(0.55) saturate(1.1)", transform: "scale(1.2)" }}
        />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,27,48,0.4), rgba(7,27,48,0.15) 40%, rgba(7,27,48,0.7))" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ perspective: 1500, alignItems: "center", justifyContent: "center", paddingBottom: 140 }}>
        <div
          style={{
            width: 960,
            height: 630,
            borderRadius: 28,
            overflow: "hidden",
            boxShadow: "0 50px 110px rgba(0,0,0,0.6)",
            border: "6px solid rgba(255,255,255,0.92)",
            transform: `translateZ(${interpolate(entra, [0, 1], [-700, 0])}px) rotateY(${rotY}deg) rotateX(${rotX}deg)`,
          }}
        >
          <Img src={staticFile("story/hospital.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})` }} />
          {/* reflexo de vidro que passa */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(115deg, transparent ${interpolate(f, [10, 70], [-30, 130], clamp) - 15}%, rgba(255,255,255,0.28) ${interpolate(f, [10, 70], [-30, 130], clamp)}%, transparent ${interpolate(f, [10, 70], [-30, 130], clamp) + 15}%)`,
            }}
          />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 1300, fontFamily: FONTE }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "18px 30px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.3)",
            backdropFilter: "blur(12px)",
            color: COR.branco,
            fontSize: 30,
            fontWeight: 600,
            opacity: ent(f, 18, 34),
            transform: `translateY(${(1 - ent(f, 18, 34)) * 20}px)`,
          }}
        >
          <svg width="26" height="34" viewBox="0 0 26 34">
            <path d="M13 1C6.4 1 1 6.2 1 12.7 1 21.5 13 33 13 33s12-11.5 12-20.3C25 6.2 19.6 1 13 1z" fill={COR.amarelo} />
            <circle cx="13" cy="12.5" r="4.5" fill={COR.marinho} />
          </svg>
          {local}
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
  const conta = Math.round(interpolate(f, [4, 46], [0, 180], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const t1 = ent(f, 0, 16);
  const sobe = ent(f, 64, 84); // contador sobe para dar lugar aos cartões
  const sai = ent(f, dur - 12, dur);
  const cartao = (atraso: number) => spring({ frame: f - atraso, fps, config: { damping: 18, stiffness: 110 } });
  const c1 = cartao(72);
  const c2 = cartao(82);
  const datas = ent(f, 118, 136);
  return (
    <AbsoluteFill style={{ fontFamily: FONTE, color: COR.branco, opacity: 1 - sai, perspective: 1400 }}>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: interpolate(sobe, [0, 1], [560, 300]) }}>
        <div style={{ textAlign: "center", opacity: t1, transform: `scale(${interpolate(sobe, [0, 1], [1, 0.72])})` }}>
          <div
            style={{
              fontSize: 300,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: -8,
              background: `linear-gradient(100deg, ${COR.rosa}, #FFFFFF 50%, ${COR.azul})`,
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
          { c: c1, cor: COR.rosa, num: "80", tit: "mamografias", sub: "Mulheres de 40 a 74 anos", campanha: "OUTUBRO ROSA" },
          { c: c2, cor: COR.azul, num: "100", tit: "exames de PSA", sub: "Homens de 45 a 75 anos", campanha: "NOVEMBRO AZUL" },
        ].map((k, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 30,
              padding: "26px 36px",
              borderRadius: 28,
              background: "rgba(255,255,255,0.1)",
              border: `1.5px solid ${k.cor}88`,
              backdropFilter: "blur(14px)",
              opacity: k.c,
              transform: `rotateY(${(1 - k.c) * (i ? 40 : -40)}deg) translateX(${(1 - k.c) * (i ? 200 : -200)}px)`,
            }}
          >
            <Laco cor={k.cor} p={k.c} tam={78} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 5, color: k.cor }}>{k.campanha}</div>
              <div style={{ fontSize: 62, fontWeight: 800, lineHeight: 1.05 }}>
                {k.num} <span style={{ fontWeight: 600, fontSize: 44 }}>{k.tit}</span>
              </div>
              <div style={{ fontSize: 30, fontWeight: 500, opacity: 0.85 }}>{k.sub}</div>
            </div>
          </div>
        ))}
        <div style={{ height: 14 }} />
        <div style={{ opacity: datas, transform: `translateY(${(1 - datas) * 24}px)`, textAlign: "center" }}>
          <div style={{ display: "inline-block", padding: "16px 34px", borderRadius: 999, background: COR.amarelo, color: COR.marinho, fontSize: 40, fontWeight: 800 }}>
            15 a 27 de outubro
          </div>
          <div style={{ fontSize: 30, fontWeight: 600, marginTop: 18 }}>De segunda a sexta · senhas por ordem de chegada</div>
          <div style={{ fontSize: 30, fontWeight: 500, marginTop: 8, opacity: 0.85 }}>Rua Marechal Rondon, 1053 – Centro</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- Cena 4: fechamento ----------
const Final: React.FC<{ fonte: string }> = ({ fonte }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame: f - 14, fps, config: { damping: 16, stiffness: 90 } });
  const t = ent(f, 0, 16);
  return (
    <AbsoluteFill style={{ fontFamily: FONTE, color: COR.branco, alignItems: "center", perspective: 1000 }}>
      <div style={{ marginTop: 420, textAlign: "center", opacity: t, transform: `translateY(${(1 - t) * 30}px)` }}>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 6, color: COR.amarelo }}>UTILIDADE PÚBLICA</div>
        <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.1, marginTop: 20 }}>
          Compartilhe com
          <br />
          quem precisa.
        </div>
        <div style={{ fontSize: 30, fontWeight: 500, marginTop: 26, opacity: 0.85 }}>Prevenção salva vidas.</div>
      </div>
      {/* espaço reservado para o sticker de link do Instagram */}
      <div style={{ marginTop: 90, fontSize: 28, fontWeight: 600, opacity: ent(f, 20, 36) * 0.9 }}>Leia a matéria completa no link</div>
      <div style={{ marginTop: 18, fontSize: 24, fontWeight: 500, opacity: ent(f, 24, 40) * 0.7 }}>Fonte: {fonte}</div>
      <div
        style={{
          position: "absolute",
          bottom: 360,
          width: 300,
          transform: `rotateY(${(1 - logo) * -80 + Math.sin(f / 20) * 6}deg) scale(${0.8 + 0.2 * logo})`,
          opacity: logo,
          filter: "drop-shadow(0 12px 22px rgba(0,0,0,0.4))",
        }}
      >
        <Img src={staticFile("story/logo-ze.png")} style={{ width: 300 }} />
      </div>
    </AbsoluteFill>
  );
};

export const StoryMateria: React.FC<StoryProps> = (props) => {
  return (
    <AbsoluteFill style={{ backgroundColor: COR.fundo }}>
      <Fundo />
      <Sequence durationInFrames={160} name="título 3D">
        <CartaoMateria {...props} />
      </Sequence>
      <Sequence from={146} durationInFrames={130} name="foto">
        <Foto local={props.local} dur={130} />
      </Sequence>
      <Sequence from={270} durationInFrames={186} name="números">
        <Numeros dur={186} />
      </Sequence>
      <Sequence from={450} durationInFrames={90} name="final">
        <Final fonte={props.fonte} />
      </Sequence>

      <Audio
        src={staticFile("story/trilha.wav")}
        volume={(x) => interpolate(x, [0, 15, STORY_DURACAO - 30, STORY_DURACAO], [0, 0.55, 0.55, 0], clamp)}
      />
      {[0, 140, 266, 444].map((q) => (
        <Sequence key={q} from={q} durationInFrames={30} name="whoosh">
          <Audio src={staticFile("audio/r43/whoosh.wav")} volume={0.18} />
        </Sequence>
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <Sequence key={`t${i}`} from={274 + i * 4} durationInFrames={6} name="tick">
          <Audio src={staticFile("audio/tick.wav")} volume={0.12} />
        </Sequence>
      ))}
      <Sequence from={346} durationInFrames={30} name="beep">
        <Audio src={staticFile("audio/r43/beep.wav")} volume={0.15} />
      </Sequence>
    </AbsoluteFill>
  );
};
