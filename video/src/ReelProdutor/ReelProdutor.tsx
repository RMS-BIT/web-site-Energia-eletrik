import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { FONTE } from "../AnuncioImageador/tema";
import { COR_JORNAL, FundoJornal, SOMBRA, clamp, ent, quadroFimVoz, quadroFrase } from "../Materia/comum";
import voz from "./voz.json";

// Reels "Dia do Produtor Rural" (10 de outubro, MS) em formato de matéria.
// Fontes: Lei Estadual nº 2.141, de 28/08/2000 (DOE nº 5.338, de 29/08/2000),
// base de legislação do Governo de MS; autoria e título da matéria:
// zeteixeira.com (10/10/2017). Conferido em 09/10/2026.
// A linha do tempo vem da locução (roteiro.json -> voz.json).

const LINHA = voz.cenas;
type Cena = keyof typeof LINHA;
const frase = (cena: Cena, n: number) => quadroFrase(voz, cena, n);
const fimVoz = (cena: Cena) => quadroFimVoz(voz, cena);

export const REEL_PRODUTOR_DURACAO = voz.total;

const COR = {
  marinho: "#0D355A",
  amarelo: "#F6D54A",
  verde: "#44B552",
  verdeEscuro: "#1E6B3A",
  azul: "#307ABC",
  branco: "#FFFFFF",
  tinta: "#0D2440",
  cinza: "#5A6B80",
};

const LOGO = "reel-produtor/logo-ze-verde.png";
const LOGO_PROP = 478 / 850; // altura / largura

export const reelProdutorSchema = z.object({
  titulo: z.string(),
  editoria: z.string(),
  fonte: z.string(),
});
export type ReelProdutorProps = z.infer<typeof reelProdutorSchema>;
export const reelProdutorPadrao: ReelProdutorProps = {
  titulo: "No MS, Dia Estadual do Produtor Rural é celebrado todo dia 10 de outubro",
  editoria: "Agro e desenvolvimento",
  fonte: "zeteixeira.com",
};

// marca-texto amarelo que "pinta" da esquerda para a direita
const Marca: React.FC<{ p: number; style: React.CSSProperties }> = ({ p, style }) => (
  <span
    style={{
      position: "absolute",
      background: COR.amarelo,
      borderRadius: 6,
      transform: `scaleX(${p})`,
      transformOrigin: "left",
      ...style,
    }}
  />
);

// ---------- Cena 1: matéria em 3D (título lido pela locução + foto) ----------
const Materia: React.FC<ReelProdutorProps & { dur: number }> = ({ titulo, editoria, fonte, dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chega = spring({ frame: f, fps, config: { damping: 22, stiffness: 60, mass: 1.2 } });
  const palavras = titulo.split(" ");
  const iniDestaque = palavras.indexOf("todo"); // "todo dia 10 de outubro"
  const lido = interpolate(f, [frase("titulo", 1) - 4, fimVoz("titulo") - 20], [-1, palavras.length], clamp);
  const rotX = interpolate(chega, [0, 1], [48, 14]) - ent(f, 40, dur - 30) * 6;
  const rotY = interpolate(chega, [0, 1], [-38, -11]) + ent(f, 40, dur - 30) * 8;
  const rotZ = interpolate(chega, [0, 1], [8, 2]);
  const z = interpolate(chega, [0, 1], [-900, 0]);
  const desce = ent(f, 30, dur - 20) * -50;
  const sai = ent(f, dur - 22, dur - 2);
  const foto = ent(f, 14, 40);
  return (
    <AbsoluteFill style={{ perspective: 1400, alignItems: "center", justifyContent: "center", paddingBottom: 60 }}>
      <div
        style={{
          width: 930,
          padding: "60px 64px 64px",
          borderRadius: 32,
          background: COR.branco,
          fontFamily: FONTE,
          boxShadow: SOMBRA,
          transform: `translateX(30px) translateZ(${z + sai * 300}px) translateY(${desce - sai * 900}px) rotateX(${rotX + sai * 30}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`,
          opacity: Math.min(1, chega * 2) * (1 - sai * 0.9),
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 22,
            marginBottom: 30,
            borderBottom: "2px solid rgba(13,36,64,0.1)",
            opacity: ent(f, 8, 26),
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: COR.verde }} />
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 4, color: COR.verdeEscuro, textTransform: "uppercase" }}>{editoria}</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, color: COR.cinza }}>{fonte}</div>
        </div>
        <div style={{ fontSize: 76, lineHeight: 1.08, fontWeight: 800, color: COR.tinta, letterSpacing: -2 }}>
          {palavras.map((p, i) => {
            const k = Math.max(0, Math.min(1, lido - i + 1));
            const marca = Math.max(0, Math.min(1, (lido - i) * 1.4));
            return (
              <span key={i} style={{ position: "relative", display: "inline-block", marginRight: "0.24em" }}>
                {i >= iniDestaque ? <Marca p={marca} style={{ left: -6, right: -6, bottom: 6, height: "38%" }} /> : null}
                <span style={{ position: "relative", opacity: 0.12 + 0.88 * k, filter: `blur(${(1 - k) * 4}px)` }}>{p}</span>
              </span>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 34,
            height: 380,
            borderRadius: 20,
            overflow: "hidden",
            opacity: foto,
            transform: `translateY(${(1 - foto) * 30}px)`,
          }}
        >
          <Img
            src={staticFile("reel-produtor/foto-soja.jpg")}
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.04 + (f / dur) * 0.08})` }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Cena 2: o documento da lei, com marca-texto ----------
const DOC_W = 1390;
const DOC_H = 680;
// linhas do documento recortado (px da imagem original)
const LINHA_LEI = { x: 47, y: 120, w: 614, h: 28 }; // "LEI Nº 2.141, DE 28 DE AGOSTO DE 2000."
const LINHA_ART1 = { x: 50, y: 488, w: 943, h: 26 }; // "Art. 1º Fica instituído o dia 10 de outubro como Dia do Produtor Rural."

const Documento: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entra = spring({ frame: f, fps, config: { damping: 20, stiffness: 70 } });
  const sai = ent(f, dur - 14, dur);
  const fAutoria = frase("documento", 1);
  const t1 = ent(f, 4, 22);
  const mArt1 = ent(f, 16, 40);
  const mLei = ent(f, 80, 98);
  const aut = spring({ frame: f - (fAutoria - 4), fps, config: { damping: 14, stiffness: 120 } });
  const dou = ent(f, fAutoria + 14, fAutoria + 30);
  const lupa = spring({ frame: f - 34, fps, config: { damping: 16, stiffness: 110 } });
  const mLupa = ent(f, 44, 64);
  const W = 960;
  const esc = W / DOC_W;
  const marca = (l: typeof LINHA_ART1, p: number) => (
    <div
      style={{
        position: "absolute",
        left: (l.x - 8) * esc,
        top: (l.y - 4) * esc,
        width: (l.w + 16) * esc,
        height: (l.h + 10) * esc,
        background: COR.amarelo,
        borderRadius: 4,
        mixBlendMode: "multiply",
        transform: `scaleX(${p})`,
        transformOrigin: "left",
      }}
    />
  );
  return (
    <AbsoluteFill style={{ fontFamily: FONTE, color: COR.tinta, opacity: 1 - sai }}>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 230, textAlign: "center" }}>
        <div style={{ opacity: t1, transform: `translateY(${(1 - t1) * 24}px)` }}>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 6, color: COR.verdeEscuro }}>A ORIGEM DA DATA</div>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, marginTop: 12, letterSpacing: -1 }}>Lei Estadual nº 2.141</div>
          <div style={{ fontSize: 36, fontWeight: 600, marginTop: 8, color: COR.cinza }}>de 28 de agosto de 2000</div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ perspective: 1500, alignItems: "center", paddingTop: 530 }}>
        <div
          style={{
            position: "relative",
            padding: 26,
            borderRadius: 14,
            background: "#FBFAF6",
            boxShadow: SOMBRA,
            transform: `translateZ(${interpolate(entra, [0, 1], [-600, 0])}px) rotateX(${interpolate(entra, [0, 1], [30, 7]) + sai * 10}deg) rotateZ(${interpolate(entra, [0, 1], [-6, -1.2])}deg) scale(${1 + (f / dur) * 0.05})`,
            opacity: entra,
          }}
        >
          <div style={{ position: "relative", width: W, height: DOC_H * esc }}>
            <Img src={staticFile("reel-produtor/lei-2141.png")} style={{ width: W, height: DOC_H * esc }} />
            {marca(LINHA_ART1, mArt1)}
            {marca(LINHA_LEI, mLei)}
          </div>
        </div>
      </AbsoluteFill>
      {/* lupa: o Art. 1º em letra grande (texto literal da lei) */}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 1090, perspective: 1200 }}>
        <div
          style={{
            width: 960,
            padding: "26px 34px",
            borderRadius: 24,
            background: COR.branco,
            borderLeft: `10px solid ${COR.verde}`,
            boxShadow: "0 24px 50px rgba(13,36,64,0.22)",
            fontSize: 42,
            fontWeight: 600,
            lineHeight: 1.28,
            opacity: Math.min(1, lupa * 1.5),
            transform: `translateY(${(1 - lupa) * 60}px) rotateX(${(1 - lupa) * 30}deg) scale(${0.9 + 0.1 * lupa})`,
          }}
        >
          <span style={{ fontWeight: 800, color: COR.verdeEscuro }}>Art. 1º </span>
          Fica instituído o dia{" "}
          <span style={{ position: "relative", display: "inline-block" }}>
            <Marca p={mLupa} style={{ left: -4, right: -4, bottom: 4, height: "40%" }} />
            <span style={{ position: "relative", fontWeight: 800 }}>10 de outubro</span>
          </span>{" "}
          como{" "}
          <span style={{ position: "relative", display: "inline-block" }}>
            <Marca p={ent(f, 56, 76)} style={{ left: -4, right: -4, bottom: 4, height: "40%" }} />
            <span style={{ position: "relative", fontWeight: 800, fontStyle: "italic" }}>Dia do Produtor Rural.</span>
          </span>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 1300, textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 16,
            padding: "20px 36px",
            borderRadius: 999,
            background: COR.verdeEscuro,
            color: COR.branco,
            fontSize: 38,
            fontWeight: 700,
            boxShadow: "0 18px 40px rgba(13,36,64,0.22)",
            opacity: Math.min(1, aut * 1.4),
            transform: `scale(${0.7 + 0.3 * aut})`,
          }}
        >
          <span style={{ color: COR.amarelo, fontWeight: 800 }}>Autoria:</span> Deputado Zé Teixeira
        </div>
        <div style={{ fontSize: 26, fontWeight: 500, marginTop: 20, color: COR.cinza, opacity: dou }}>
          Publicada no Diário Oficial nº 5.338, de 29/08/2000
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- Cena 3: homenagem, uma foto por frase ----------
const FOTOS = ["reel-produtor/foto-semente.jpg", "reel-produtor/foto-milho.jpg", "reel-produtor/foto-tablet.jpg"];
const TEXTOS: { t: string; d: string[] }[] = [
  { t: "Homens e mulheres do campo", d: ["campo"] },
  { t: "Com o suor do rosto, produzem alimento", d: ["alimento"] },
  { t: "E movem a economia sul-mato-grossense", d: ["economia"] },
];

const Homenagem: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const sai = ent(f, dur - 12, dur);
  const inicios = [0, 1, 2].map((n) => frase("homenagem", n));
  const fins = [inicios[1], inicios[2], fimVoz("homenagem")];
  const t0 = ent(f, 0, 16);
  return (
    <AbsoluteFill style={{ fontFamily: FONTE, color: COR.tinta, opacity: 1 - sai }}>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 300, textAlign: "center", opacity: t0 }}>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 6, color: COR.verdeEscuro }}>HOMENAGEM A QUEM PRODUZ</div>
      </AbsoluteFill>
      {/* fotos: cada uma entra em 3D quando sua frase começa */}
      <AbsoluteFill style={{ perspective: 1600, alignItems: "center", paddingTop: 400 }}>
        <div style={{ position: "relative", width: 1000, height: 667 }}>
          {FOTOS.map((src, i) => {
            const e = ent(f, inicios[i] - 10, inicios[i] + 12);
            const s = i < 2 ? ent(f, inicios[i + 1] - 10, inicios[i + 1] + 12) : 0;
            if (e <= 0 || s >= 1) return null;
            const local = (f - inicios[i] + 10) / (fins[i] - inicios[i] + 20);
            return (
              <div
                key={src}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 30,
                  overflow: "hidden",
                  boxShadow: `${SOMBRA}, 0 0 0 8px #FFFFFF`,
                  opacity: Math.min(e, 1 - s),
                  transform: `translateX(${(1 - e) * 260 - s * 260}px) rotateY(${(1 - e) * -28 + s * 28}deg) scale(${0.92 + 0.08 * e - 0.06 * s})`,
                }}
              >
                <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.04 + local * 0.08})` }} />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      {/* frase da locução, palavra por palavra */}
      <AbsoluteFill style={{ paddingTop: 1150, paddingLeft: 70, paddingRight: 70, alignItems: "center", textAlign: "center" }}>
        {TEXTOS.map((x, i) => {
          const palavras = x.t.split(" ");
          const vis = ent(f, inicios[i] - 6, inicios[i] + 6) * (1 - ent(f, fins[i] - 4, fins[i] + 6));
          if (vis <= 0 && i < 2) return null;
          const lido = interpolate(f, [inicios[i], fins[i] - 10], [0, palavras.length], clamp);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 70,
                right: 70,
                fontSize: 64,
                fontWeight: 800,
                lineHeight: 1.12,
                letterSpacing: -1,
                opacity: i === 2 ? ent(f, inicios[i] - 6, inicios[i] + 6) : vis,
              }}
            >
              {palavras.map((p, j) => {
                const k = Math.max(0, Math.min(1, lido - j + 0.6));
                const destaque = x.d.includes(p.replace(/[,.]/g, ""));
                return (
                  <span key={j} style={{ position: "relative", display: "inline-block", marginRight: "0.24em" }}>
                    {destaque ? <Marca p={Math.max(0, Math.min(1, (lido - j) * 1.5))} style={{ left: -6, right: -6, bottom: 6, height: "36%" }} /> : null}
                    <span
                      style={{
                        position: "relative",
                        display: "inline-block",
                        opacity: 0.15 + 0.85 * k,
                        transform: `translateY(${(1 - k) * 14}px)`,
                      }}
                    >
                      {p}
                    </span>
                  </span>
                );
              })}
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- Cena 4: fechamento — a logo é a protagonista ----------
const Final: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame: f - 2, fps, config: { damping: 13, stiffness: 70, mass: 1.1 } });
  const t = ent(f, frase("final", 0) - 2, frase("final", 0) + 14);
  const t2 = ent(f, frase("final", 1) - 2, frase("final", 1) + 14);
  const ciclo = Math.max(0, f - 22) % 50;
  const brilho = interpolate(ciclo, [0, 26], [-0.4, 1.4], clamp);
  const mascara = `url(${staticFile(LOGO)})`;
  const W = 960;
  const H = Math.round(W * LOGO_PROP);
  const pulso = 1 + Math.sin(f / 14) * 0.012;
  return (
    <AbsoluteFill style={{ fontFamily: FONTE, color: COR.tinta, alignItems: "center", justifyContent: "center", perspective: 1300 }}>
      <div
        style={{
          position: "absolute",
          width: 1300,
          height: 1000,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, #FFFFFF 0%, ${COR.amarelo}55 38%, transparent 68%)`,
          opacity: logo,
          transform: `scale(${0.6 + 0.4 * logo})`,
          filter: "blur(10px)",
        }}
      />
      <svg width={1080} height={1920} style={{ position: "absolute", opacity: logo * 0.16 }}>
        {Array.from({ length: 14 }).map((_, i) => {
          const a = (i / 14) * Math.PI * 2 + f / 90;
          return (
            <line
              key={i}
              x1={540}
              y1={900}
              x2={540 + Math.cos(a) * 1100}
              y2={900 + Math.sin(a) * 1100}
              stroke={i % 2 ? COR.verde : COR.amarelo}
              strokeWidth={36}
              strokeLinecap="round"
              opacity={0.55}
            />
          );
        })}
      </svg>
      <div
        style={{
          padding: "14px 30px",
          borderRadius: 999,
          background: COR.amarelo,
          color: COR.marinho,
          fontSize: 34,
          fontWeight: 800,
          letterSpacing: 3,
          opacity: t,
          transform: `translateY(${(1 - t) * 20}px)`,
          marginBottom: 30,
        }}
      >
        10 DE OUTUBRO
      </div>
      <div
        style={{
          position: "relative",
          width: W,
          height: H,
          opacity: Math.min(1, logo * 1.5),
          transform: `rotateY(${(1 - logo) * -60 + Math.sin(f / 22) * 6}deg) rotateX(${Math.sin(f / 30) * 3}deg) translateY(${Math.sin(f / 18) * 6}px) scale(${(0.55 + 0.45 * logo) * pulso})`,
          filter: `drop-shadow(0 26px 40px rgba(13,36,64,0.25)) blur(${(1 - Math.min(1, logo * 1.3)) * 10}px)`,
        }}
      >
        <Img src={staticFile(LOGO)} style={{ width: W, height: H }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            WebkitMaskImage: mascara,
            WebkitMaskSize: "100% 100%",
            maskImage: mascara,
            maskSize: "100% 100%",
            background: `linear-gradient(105deg, transparent ${brilho * 100 - 16}%, rgba(255,255,255,0.75) ${brilho * 100}%, transparent ${brilho * 100 + 16}%)`,
            mixBlendMode: "screen",
          }}
        />
      </div>
      <div style={{ marginTop: 30, textAlign: "center", padding: "0 70px" }}>
        <div style={{ fontSize: 62, fontWeight: 800, color: COR.verdeEscuro, opacity: t, transform: `translateY(${(1 - t) * 20}px)` }}>
          Dia do Produtor Rural
        </div>
        <div style={{ fontSize: 34, fontWeight: 600, marginTop: 16, lineHeight: 1.3, opacity: t2, transform: `translateY(${(1 - t2) * 20}px)` }}>
          Parabéns a todos os produtores rurais
          <br />
          de Mato Grosso do Sul.
        </div>
      </div>
      <div style={{ height: 160 }} />
    </AbsoluteFill>
  );
};

// ---------- Marca d'água: logo no canto inferior direito ----------
const MarcaDagua: React.FC = () => {
  const f = useCurrentFrame();
  const op = ent(f, 6, 24) * (1 - ent(f, LINHA.final.de - 12, LINHA.final.de + 6));
  const W = 210;
  return (
    <Img
      src={staticFile(LOGO)}
      style={{
        position: "absolute",
        right: 44,
        bottom: 64,
        width: W,
        height: Math.round(W * LOGO_PROP),
        opacity: op * 0.92,
        filter: "drop-shadow(0 6px 14px rgba(13,36,64,0.25))",
      }}
    />
  );
};

// trilha mais baixa enquanto a locução fala; sobe quando a voz termina
const volumeTrilha = (x: number) =>
  interpolate(
    x,
    [0, 8, LINHA.documento.de, LINHA.documento.de + 20, LINHA.homenagem.de, LINHA.homenagem.de + 20, LINHA.final.de + fimVoz("final"), REEL_PRODUTOR_DURACAO - 30, REEL_PRODUTOR_DURACAO],
    [0, 0.55, 0.55, 0.4, 0.4, 0.26, 0.26, 0.75, 0],
    clamp,
  );

export const ReelProdutor: React.FC<ReelProdutorProps> = (props) => {
  const ordem = ["titulo", "documento", "homenagem", "final"] as const;
  const doc = LINHA.documento.de;
  return (
    <AbsoluteFill style={{ backgroundColor: COR_JORNAL }}>
      <FundoJornal
        duracao={REEL_PRODUTOR_DURACAO}
        foto="reel-produtor/foto-soja.jpg"
        luzes={[
          { x: 160, y: 380, r: 420, c: COR.verde, v: 0.14 },
          { x: 960, y: 1550, r: 480, c: COR.amarelo, v: 0.16 },
          { x: 880, y: 260, r: 300, c: COR.azul, v: 0.08 },
        ]}
      />
      <Sequence from={LINHA.titulo.de} durationInFrames={LINHA.titulo.dur} name="matéria 3D">
        <Materia {...props} dur={LINHA.titulo.dur} />
      </Sequence>
      <Sequence from={doc} durationInFrames={LINHA.documento.dur} name="documento">
        <Documento dur={LINHA.documento.dur} />
      </Sequence>
      <Sequence from={LINHA.homenagem.de} durationInFrames={LINHA.homenagem.dur} name="homenagem">
        <Homenagem dur={LINHA.homenagem.dur} />
      </Sequence>
      <Sequence from={LINHA.final.de} durationInFrames={LINHA.final.dur} name="final">
        <Final />
      </Sequence>
      <MarcaDagua />

      <Audio src={staticFile("reel-produtor/trilha.wav")} volume={volumeTrilha} />
      {ordem.map((c) => (
        <Sequence key={`voz-${c}`} from={LINHA[c].voz} name={`voz ${c}`}>
          <Audio src={staticFile(`reel-produtor/voz/${c}.wav`)} />
        </Sequence>
      ))}
      {ordem.map((c, i) => (
        <Sequence key={`w${c}`} from={Math.max(0, LINHA[c].de - (i ? 6 : 0))} durationInFrames={30} name="whoosh">
          <Audio src={staticFile("audio/r43/whoosh.wav")} volume={0.16} />
        </Sequence>
      ))}
      {[doc + 16, doc + 44, doc + 80].map((q) => (
        <Sequence key={`m${q}`} from={q} durationInFrames={30} name="marca-texto">
          <Audio src={staticFile("audio/r43/swish.wav")} volume={0.1} />
        </Sequence>
      ))}
      <Sequence from={doc + frase("documento", 1) - 4} durationInFrames={30} name="autoria">
        <Audio src={staticFile("audio/r43/beep.wav")} volume={0.12} />
      </Sequence>
    </AbsoluteFill>
  );
};
