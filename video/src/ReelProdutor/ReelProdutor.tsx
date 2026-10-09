import { loadFont } from "@remotion/fonts";
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
import { clamp, ent } from "../Materia/comum";
import linha from "./linha.json";

// Reels comemorativo "Dia do Produtor Rural" (10 de outubro, MS).
// Estilo de homenagem (não é matéria): fotos em tela cheia com luz quente,
// frases curtas, música emocional e selo discreto da lei.
// Fonte da lei: Lei Estadual nº 2.141, de 28/08/2000 (DOE nº 5.338, de
// 29/08/2000); autoria: zeteixeira.com (matéria de 10/10/2017).
// Conferido em 09/10/2026. Linha do tempo em linha.json (também usada pela
// trilha, scripts/gerar_trilha_produtor.py).

const MANUSCRITA = "Dancing Script Var";
loadFont({
  family: MANUSCRITA,
  url: staticFile("fontes/DancingScript-var.ttf"),
  weight: "400 700",
  format: "truetype",
});

const C = linha.cenas;
export const REEL_PRODUTOR_DURACAO = linha.total;
const TRANSICAO = 16; // quadros de fusão entre cenas

const COR = {
  amarelo: "#F6D54A",
  verde: "#44B552",
  verdeEscuro: "#1E6B3A",
  branco: "#FFFFFF",
};

const LOGO = "reel-produtor/logo-ze-verde.png";
const LOGO_PROP = 478 / 850; // altura / largura
const SOMBRA_TEXTO = "0 4px 24px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.35)";

export const reelProdutorSchema = z.object({
  titulo: z.string(),
  local: z.string(),
});
export type ReelProdutorProps = z.infer<typeof reelProdutorSchema>;
export const reelProdutorPadrao: ReelProdutorProps = {
  titulo: "Dia do Produtor Rural",
  local: "Mato Grosso do Sul",
};

// ---------- Foto em tela cheia: fundo desfocado + faixa nítida com bordas suaves ----------
const FotoCinema: React.FC<{
  src: string;
  dur: number;
  foco: string;
  deriva?: number;
  topo?: number; // início da faixa nítida (px)
  borda?: number; // % de esfumado no topo da faixa (menor = rosto mais nítido)
}> = ({ src, dur, foco, deriva = 1, topo = 380, borda = 16 }) => {
  const mascara = `linear-gradient(180deg, transparent 0%, #000 ${borda}%, #000 84%, transparent 100%)`;
  const f = useCurrentFrame();
  const p = f / dur;
  return (
    <AbsoluteFill>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: foco,
          filter: "blur(28px) brightness(0.72) saturate(1.2)",
          transform: "scale(1.3)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: topo,
          height: 980,
          overflow: "hidden",
          WebkitMaskImage: mascara,
          maskImage: mascara,
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: foco,
            filter: "saturate(1.08) contrast(1.04)",
            transform: `scale(${1.04 + p * 0.1}) translateX(${(p - 0.5) * 30 * deriva}px)`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ---------- Luz quente (fim de tarde) e vinheta, por cima de tudo ----------
const LuzQuente: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at ${78 + Math.sin(f / 80) * 6}% 8%, rgba(255,196,90,0.55) 0%, rgba(255,170,60,0.18) 35%, transparent 65%)`,
          mixBlendMode: "screen",
        }}
      />
      <AbsoluteFill
        style={{
          background: "rgba(255,170,80,0.10)",
          mixBlendMode: "soft-light",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(10,8,0,0.45) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

// clarão quente em cada troca de cena
const Clarao: React.FC = () => {
  const f = useCurrentFrame();
  const trocas = [C.terra.de, C.cria.de, C.futuro.de, C.lei.de, C.final.de];
  const k = Math.max(
    ...trocas.map((q) =>
      Math.max(0, 1 - Math.abs(f - (q + TRANSICAO / 2)) / 14),
    ),
  );
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 30% 40%, rgba(255,214,140,0.9) 0%, rgba(255,170,80,0.4) 40%, transparent 75%)",
        mixBlendMode: "screen",
        opacity: k * 0.55,
        pointerEvents: "none",
      }}
    />
  );
};

// ---------- Frase: manuscrita ("A quem") + linha forte ----------
const Frase: React.FC<{
  manuscrita?: string;
  forte: string;
  atraso?: number;
  tamanho?: number;
}> = ({ manuscrita, forte, atraso = 10, tamanho = 92 }) => {
  const f = useCurrentFrame();
  const m = ent(f, atraso, atraso + 22);
  const palavras = forte.split(" ");
  return (
    <div
      style={{
        textAlign: "center",
        color: COR.branco,
        textShadow: SOMBRA_TEXTO,
      }}
    >
      {manuscrita ? (
        <div
          style={{
            fontFamily: MANUSCRITA,
            fontWeight: 700,
            fontSize: 104,
            lineHeight: 1,
            color: COR.amarelo,
            clipPath: `inset(-20% ${(1 - m) * 100}% -20% -5%)`,
            marginBottom: 4,
          }}
        >
          {manuscrita}
        </div>
      ) : null}
      <div
        style={{
          fontFamily: FONTE,
          fontWeight: 800,
          fontSize: tamanho,
          lineHeight: 1.04,
          letterSpacing: -2,
          padding: "0 60px",
        }}
      >
        {palavras.map((p, i) => {
          const k = ent(f, atraso + 12 + i * 4, atraso + 30 + i * 4);
          if (p === "|") return <br key={i} />;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: "0.22em",
                opacity: k,
                transform: `translateY(${(1 - k) * 26}px)`,
                filter: `blur(${(1 - k) * 8}px)`,
              }}
            >
              {p}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const Cena: React.FC<{ primeira?: boolean; children: React.ReactNode }> = ({
  primeira,
  children,
}) => {
  const f = useCurrentFrame();
  const entra = primeira ? 1 : ent(f, 0, TRANSICAO);
  return (
    <AbsoluteFill
      style={{ opacity: entra, transform: `scale(${1.03 - 0.03 * entra})` }}
    >
      {children}
    </AbsoluteFill>
  );
};

// ---------- Cena 1: abertura ----------
const Abertura: React.FC<ReelProdutorProps> = ({ titulo, local }) => {
  const f = useCurrentFrame();
  const data = ent(f, 8, 26);
  const sub = ent(f, 44, 62);
  return (
    <Cena primeira>
      <FotoCinema
        src="reel-produtor/foto-soja.jpg"
        dur={C.abertura.dur}
        foco="50% 55%"
      />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 250 }}>
        <div
          style={{
            fontFamily: FONTE,
            fontWeight: 700,
            fontSize: 34,
            letterSpacing: 10 + (1 - data) * 14,
            color: COR.amarelo,
            textShadow: SOMBRA_TEXTO,
            opacity: data,
            marginBottom: 18,
          }}
        >
          10 DE OUTUBRO
        </div>
        <Frase
          forte={titulo.replace(" Produtor", " | Produtor")}
          atraso={16}
          tamanho={104}
        />
        <div
          style={{
            fontFamily: FONTE,
            fontWeight: 600,
            fontSize: 38,
            color: COR.branco,
            textShadow: SOMBRA_TEXTO,
            marginTop: 16,
            opacity: sub,
            transform: `translateY(${(1 - sub) * 14}px)`,
          }}
        >
          {local}
        </div>
      </AbsoluteFill>
    </Cena>
  );
};

// ---------- Cenas 2–4: homenagem ----------
const Homenagem: React.FC<{
  src: string;
  dur: number;
  foco: string;
  manuscrita: string;
  forte: string;
  deriva?: number;
  topo?: number;
  borda?: number;
  textoBaixo?: boolean; // texto abaixo do rosto (fotos com pessoas em destaque)
}> = ({
  src,
  dur,
  foco,
  manuscrita,
  forte,
  deriva,
  topo,
  borda,
  textoBaixo,
}) => (
  <Cena>
    <FotoCinema
      src={src}
      dur={dur}
      foco={foco}
      deriva={deriva}
      topo={topo}
      borda={borda}
    />
    <AbsoluteFill
      style={{ alignItems: "center", paddingTop: textoBaixo ? 1170 : 210 }}
    >
      <Frase manuscrita={manuscrita} forte={forte} atraso={12} />
    </AbsoluteFill>
  </Cena>
);

// ---------- Cena 5: selo da lei ----------
const Selo: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: f - 8,
    fps,
    config: { damping: 18, stiffness: 90 },
  });
  const aut = ent(f, 34, 52);
  return (
    <Cena>
      <FotoCinema
        src="reel-produtor/foto-milho.jpg"
        dur={C.lei.dur}
        foco="70% 50%"
      />
      <AbsoluteFill style={{ background: "rgba(12,20,8,0.35)" }} />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: 120,
        }}
      >
        <div
          style={{
            width: 860,
            padding: "52px 56px",
            borderRadius: 28,
            border: `2px solid ${COR.amarelo}AA`,
            background: "rgba(14,24,10,0.45)",
            backdropFilter: "blur(10px)",
            textAlign: "center",
            color: COR.branco,
            fontFamily: FONTE,
            opacity: Math.min(1, s * 1.4),
            transform: `scale(${0.88 + 0.12 * s})`,
            filter: `blur(${(1 - Math.min(1, s * 1.2)) * 8}px)`,
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 6,
              color: COR.amarelo,
            }}
          >
            DATA INSTITUÍDA PELA
          </div>
          <div
            style={{
              fontSize: 66,
              fontWeight: 800,
              letterSpacing: -1,
              marginTop: 14,
            }}
          >
            Lei Estadual nº 2.141
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 500,
              marginTop: 6,
              opacity: 0.85,
            }}
          >
            de 28 de agosto de 2000
          </div>
          <div
            style={{
              width: 120,
              height: 2,
              background: `${COR.amarelo}AA`,
              margin: "30px auto",
            }}
          />
          <div
            style={{
              opacity: aut,
              transform: `translateY(${(1 - aut) * 12}px)`,
            }}
          >
            <span
              style={{
                fontFamily: MANUSCRITA,
                fontWeight: 700,
                fontSize: 52,
                color: COR.amarelo,
              }}
            >
              de autoria do{" "}
            </span>
            <span style={{ fontSize: 40, fontWeight: 700 }}>
              deputado Zé Teixeira
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </Cena>
  );
};

// ---------- Cena 6: "Parabéns, produtor rural!" + logo ----------
const Final: React.FC<ReelProdutorProps> = ({ local }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({
    frame: f - 30,
    fps,
    config: { damping: 13, stiffness: 70, mass: 1.1 },
  });
  const rod = ent(f, 52, 70);
  const ciclo = Math.max(0, f - 50) % 60;
  const brilho = interpolate(ciclo, [0, 30], [-0.4, 1.4], clamp);
  const mascara = `url(${staticFile(LOGO)})`;
  const W = 900;
  const H = Math.round(W * LOGO_PROP);
  return (
    <Cena>
      <FotoCinema
        src="reel-produtor/foto-soja.jpg"
        dur={C.final.dur}
        foco="57% 40%"
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(10,14,6,0.35) 0%, rgba(10,14,6,0.15) 45%, rgba(10,14,6,0.45) 100%)",
        }}
      />
      <AbsoluteFill
        style={{ alignItems: "center", paddingTop: 250, perspective: 1300 }}
      >
        <Frase
          manuscrita="Parabéns,"
          forte="produtor rural!"
          atraso={4}
          tamanho={98}
        />
        <div
          style={{
            position: "relative",
            width: W,
            height: H,
            marginTop: 70,
            opacity: Math.min(1, logo * 1.5),
            transform: `rotateY(${(1 - logo) * -50 + Math.sin(f / 26) * 5}deg) translateY(${Math.sin(f / 20) * 6}px) scale(${0.6 + 0.4 * logo})`,
            filter: `drop-shadow(0 24px 50px rgba(0,0,0,0.45)) blur(${(1 - Math.min(1, logo * 1.3)) * 10}px)`,
          }}
        >
          {/* halo claro atrás da logo */}
          <div
            style={{
              position: "absolute",
              inset: -120,
              borderRadius: "50%",
              background:
                "radial-gradient(ellipse, rgba(255,236,170,0.55) 0%, rgba(255,220,120,0.2) 40%, transparent 70%)",
              filter: "blur(10px)",
            }}
          />
          <Img
            src={staticFile(LOGO)}
            style={{ position: "relative", width: W, height: H }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              WebkitMaskImage: mascara,
              WebkitMaskSize: "100% 100%",
              maskImage: mascara,
              maskSize: "100% 100%",
              background: `linear-gradient(105deg, transparent ${brilho * 100 - 16}%, rgba(255,255,255,0.7) ${brilho * 100}%, transparent ${brilho * 100 + 16}%)`,
              mixBlendMode: "screen",
            }}
          />
        </div>
        <div
          style={{
            fontFamily: FONTE,
            fontWeight: 600,
            fontSize: 34,
            letterSpacing: 2,
            color: COR.branco,
            textShadow: SOMBRA_TEXTO,
            marginTop: 40,
            opacity: rod,
            transform: `translateY(${(1 - rod) * 14}px)`,
          }}
        >
          10 de outubro · {local}
        </div>
      </AbsoluteFill>
    </Cena>
  );
};

// ---------- Marca d'água: logo no canto inferior direito ----------
const MarcaDagua: React.FC = () => {
  const f = useCurrentFrame();
  const op = ent(f, 10, 28) * (1 - ent(f, C.final.de, C.final.de + TRANSICAO));
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
        filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.35))",
      }}
    />
  );
};

export const ReelProdutor: React.FC<ReelProdutorProps> = (props) => {
  const f = useCurrentFrame();
  const abre = ent(f, 0, 14); // sai do preto
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill style={{ opacity: abre }}>
        <Sequence
          from={C.abertura.de}
          durationInFrames={C.abertura.dur}
          name="abertura"
        >
          <Abertura {...props} />
        </Sequence>
        <Sequence from={C.terra.de} durationInFrames={C.terra.dur} name="terra">
          <Homenagem
            src="reel-produtor/foto-semente.jpg"
            dur={C.terra.dur}
            foco="55% 45%"
            manuscrita="A quem"
            forte="cuida da terra"
          />
        </Sequence>
        <Sequence from={C.cria.de} durationInFrames={C.cria.dur} name="cria">
          <Homenagem
            src="reel-produtor/ze-gado.jpg"
            dur={C.cria.dur}
            foco="85% 50%"
            manuscrita="A quem"
            forte="cria e produz"
            deriva={-1}
            topo={290}
            borda={9}
            textoBaixo
          />
        </Sequence>
        <Sequence
          from={C.futuro.de}
          durationInFrames={C.futuro.dur}
          name="futuro"
        >
          <Homenagem
            src="reel-produtor/ze-soja.jpg"
            dur={C.futuro.dur}
            foco="62% 50%"
            manuscrita="A quem"
            forte="faz o futuro | do campo"
            topo={290}
            borda={9}
            textoBaixo
          />
        </Sequence>
        <Sequence
          from={C.lei.de}
          durationInFrames={C.lei.dur}
          name="selo da lei"
        >
          <Selo />
        </Sequence>
        <Sequence from={C.final.de} durationInFrames={C.final.dur} name="final">
          <Final {...props} />
        </Sequence>
        <LuzQuente />
        <Clarao />
        <MarcaDagua />
      </AbsoluteFill>

      <Audio
        src={staticFile("reel-produtor/trilha-v3.wav")}
        volume={(x) =>
          interpolate(
            x,
            [0, 10, REEL_PRODUTOR_DURACAO - 20, REEL_PRODUTOR_DURACAO],
            [0, 1, 1, 0],
            clamp,
          )
        }
      />
      {[C.terra.de, C.cria.de, C.futuro.de, C.lei.de, C.final.de].map((q) => (
        <Sequence key={q} from={q - 4} durationInFrames={30} name="whoosh">
          <Audio src={staticFile("audio/r43/whoosh.wav")} volume={0.1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
