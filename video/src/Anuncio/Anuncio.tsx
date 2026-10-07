import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from "remotion";
import { z } from "zod";
import { CartelaFinal } from "./componentes/CartelaFinal";
import { Clipe } from "./componentes/Clipe";
import { Granulacao, Legibilidade, MarcaDagua, PassagemLaranja, Visor } from "./componentes/Efeitos";
import { ListaEtapas, TituloCinetico } from "./componentes/Textos";
import {
  CARTELA_INICIO,
  CENAS,
  DURACAO_TOTAL,
  IMPACTOS,
  WHOOSHES,
  type Cena,
} from "./timeline";

// Todos os textos ficam editáveis aqui (ou no painel de props do Studio).
export const anuncioSchema = z.object({
  marca: z.string(),
  segmento: z.string(),
  gancho: z.array(z.string()),
  servico: z.array(z.string()),
  etapas: z.array(z.string()),
  equipe: z.array(z.string()),
  tecnologia: z.array(z.string()),
  precisao: z.array(z.string()),
  seguranca: z.array(z.string()),
  slogan: z.string(),
  cta: z.string(),
  contato: z.string(),
  volumeAmbiente: z.number().min(0).max(1),
});

export type AnuncioProps = z.infer<typeof anuncioSchema>;

export const anuncioPadrao: AnuncioProps = {
  marca: "SOLVER",
  segmento: "Manutenção Industrial",
  gancho: ["Sua planta", "não pode", "parar."],
  servico: ["Manutenção", "industrial"],
  etapas: ["Inspeção", "Diagnóstico", "Manutenção"],
  equipe: ["Equipe técnica", "em campo"],
  tecnologia: ["Tecnologia", "na inspeção"],
  precisao: ["Precisão no", "diagnóstico"],
  seguranca: ["Segurança", "em cada etapa"],
  slogan: "Sua operação em boas mãos.",
  cta: "Fale com a nossa equipe",
  contato: "",
  volumeAmbiente: 0.12,
};

const Sobreposicao: React.FC<{ cena: Cena; props: AnuncioProps }> = ({ cena, props }) => {
  const d = cena.duracao;
  switch (cena.id) {
    case "gancho":
      return <TituloCinetico linhas={props.gancho} destaque={2} duracao={d} atraso={8} posicao="centro" tamanho={118} />;
    case "servico":
      return <TituloCinetico linhas={props.servico} destaque={1} duracao={d} kicker={props.marca} />;
    case "etapas":
      return <ListaEtapas itens={props.etapas} duracao={d} titulo="Do diagnóstico à solução" />;
    case "equipe":
      return <TituloCinetico linhas={props.equipe} destaque={1} duracao={d} atraso={10} />;
    case "tecnologia":
      return (
        <>
          <Visor duracao={d} rotulo="INSPEÇÃO" />
          <TituloCinetico linhas={props.tecnologia} destaque={1} duracao={d} atraso={2} />
        </>
      );
    case "precisao":
      return <TituloCinetico linhas={props.precisao} destaque={1} duracao={d} kicker="Leitura em campo" />;
    case "seguranca":
      return <TituloCinetico linhas={props.seguranca} destaque={0} duracao={d} atraso={2} />;
    default:
      return null;
  }
};

export const Anuncio: React.FC<AnuncioProps> = (props) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {CENAS.map((cena) => (
        <Sequence key={cena.id} from={cena.inicio} durationInFrames={cena.duracao} name={cena.id}>
          <Clipe cena={cena} volume={props.volumeAmbiente} />
          <Legibilidade />
          <Sobreposicao cena={cena} props={props} />
        </Sequence>
      ))}

      <MarcaDagua marca={props.marca} inicio={CENAS[2].inicio} fim={CARTELA_INICIO} />

      <Sequence from={CARTELA_INICIO} durationInFrames={DURACAO_TOTAL - CARTELA_INICIO} name="cartela">
        <CartelaFinal
          marca={props.marca}
          segmento={props.segmento}
          slogan={props.slogan}
          cta={props.cta}
          contato={props.contato}
        />
      </Sequence>

      <PassagemLaranja quadro={CARTELA_INICIO} />
      <Granulacao />

      {/* Som */}
      <Audio
        src={staticFile("audio/trilha.wav")}
        volume={(f) =>
          interpolate(f, [0, 10, DURACAO_TOTAL - 30, DURACAO_TOTAL], [0, 0.9, 0.9, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
      {WHOOSHES.map((q) => (
        <Sequence key={`w${q}`} from={q} durationInFrames={25} name="whoosh">
          <Audio src={staticFile("audio/whoosh.wav")} volume={0.55} />
        </Sequence>
      ))}
      {IMPACTOS.map((q) => (
        <Sequence key={`i${q}`} from={q} durationInFrames={55} name="impacto">
          <Audio src={staticFile("audio/impacto.wav")} volume={0.7} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
