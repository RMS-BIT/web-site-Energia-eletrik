import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from "remotion";
import { z } from "zod";
import { SombraLateral, TituloLateral, quadrosDasLinhas } from "./componentes/Abertura";
import { CenaComFusao, Clipe } from "./componentes/Cena";
import {
  Acabamento,
  AneisSonar,
  Assinatura,
  CartoesLeitura,
  MiraFoco,
  OndaSonora,
} from "./componentes/Graficos";
import { Legendas } from "./componentes/Legendas";
import { CartelaFinal, MarcaEscura } from "./componentes/Marca";
import { CENAS, DURACAO, FRASES, SOBREPOSICAO, quadroDaPalavra, type Cena } from "./roteiro";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const imageadorSchema = z.object({
  kicker: z.string(),
  cta: z.string(),
  volumeTrilha: z.number().min(0).max(1),
  comVoz: z.boolean(),
  comTrilha: z.boolean(),
});
export type ImageadorProps = z.infer<typeof imageadorSchema>;
export const imageadorPadrao: ImageadorProps = {
  kicker: "Inspeção por imagem acústica",
  cta: "Agende sua inspeção",
  volumeTrilha: 0.2,
  // Versão atual: só os efeitos sonoros das animações.
  comVoz: false,
  comTrilha: false,
};

// Converte quadro absoluto para o quadro local de uma cena com fusão.
const local = (cena: Cena, quadro: number) => quadro - (cena.inicio - SOBREPOSICAO);
const dur = (cena: Cena) => cena.fim - cena.inicio + SOBREPOSICAO;

export const AnuncioImageador: React.FC<ImageadorProps> = ({ kicker, cta, volumeTrilha, comVoz, comTrilha }) => {
  const { gancho, silencio, marca, somImagem, problema, dados, campo, final } = CENAS;
  // Abertura: título lateral em dois tempos (gancho e "nem consegue ouvir").
  const ganchoLinhas = [
    { texto: "Um vazamento", peso: 400 },
    { texto: "de ar comprimido", peso: 700 },
    { texto: "pode estar", peso: 400 },
    { texto: "custando caro.", peso: 800, destaque: true },
  ];
  const silencioLinhas = [
    { texto: "E você nem", peso: 400 },
    { texto: "consegue ouvir.", peso: 800, destaque: true },
  ];
  const INICIO_GANCHO = 4;
  const SAIDA_GANCHO = gancho.fim - 16;
  const INICIO_SILENCIO = SOBREPOSICAO + 2;
  const SAIDA_SILENCIO = dur(silencio) - 14;
  const qNem = silencio.inicio - SOBREPOSICAO + INICIO_SILENCIO + 10;
  const qOuvir = qNem + 7 + 30;
  const ticksAbertura = [
    ...quadrosDasLinhas(INICIO_GANCHO, ganchoLinhas.length),
    ...quadrosDasLinhas(INICIO_SILENCIO, silencioLinhas.length).map((q) => q + silencio.inicio - SOBREPOSICAO),
  ];
  const leituras = [
    { rotulo: "Taxa de vazamento", unidade: "L/min", destaque: local(dados, quadroDaPalavra(3, "taxa")) },
    { rotulo: "Custo estimado", unidade: "R$/ano", destaque: local(dados, quadroDaPalavra(3, "custo")) },
    { rotulo: "Emissão de CO₂", unidade: "kg/ano", destaque: local(dados, quadroDaPalavra(3, "CO₂")) },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/* 1. Gancho: tela do imageador, o vazamento vira imagem */}
      <CenaComFusao cena={gancho} primeira>
        <Clipe src="clips/6514.mp4" inicioNoClipe={0} duracao={gancho.fim} escala={[1.0, 1.14]} origem={[516, 936]} />
        <Acabamento />
        <AneisSonar x={516} y={936} inicio={18} intervalo={20} quantidade={7} />
        <SombraLateral inicio={0} fim={gancho.fim + 6} />
        <TituloLateral
          indice="01"
          kicker="Imageador acústico"
          linhas={ganchoLinhas}
          inicio={INICIO_GANCHO}
          saida={SAIDA_GANCHO}
        />
      </CenaComFusao>

      {/* 2. "e você nem consegue ouvir": a onda se apaga */}
      <CenaComFusao cena={silencio}>
        <Clipe src="clips/6514.mp4" inicioNoClipe={6.9} duracao={dur(silencio)} escala={[1.1, 1.0]} />
        <Acabamento />
        <OndaSonora
          y={880}
          amplitude={(f) => interpolate(f, [local(silencio, qNem), local(silencio, qOuvir) + 10], [110, 0], clamp)}
        />
        <SombraLateral inicio={0} fim={dur(silencio)} />
        <TituloLateral
          indice="02"
          kicker="O problema invisível"
          linhas={silencioLinhas}
          inicio={INICIO_SILENCIO}
          saida={SAIDA_SILENCIO}
        />
      </CenaComFusao>

      {/* 3. Marca */}
      <CenaComFusao cena={marca}>
        <MarcaEscura duracao={dur(marca)} />
      </CenaComFusao>

      {/* 4. O som vira imagem */}
      <CenaComFusao cena={somImagem}>
        <Clipe
          src="clips/6519.mp4"
          inicioNoClipe={0}
          velocidade={0.7}
          duracao={dur(somImagem)}
          escala={[1.0, 1.12]}
          origem={[600, 380]}
        />
        <Acabamento />
        <AneisSonar x={600} y={380} inicio={14} intervalo={16} quantidade={5} raioMax={420} />
      </CenaComFusao>

      {/* 5. Onde está o problema */}
      <CenaComFusao cena={problema}>
        <Clipe src="clips/6518.mp4" inicioNoClipe={0.3} duracao={dur(problema)} escala={[1.14, 1.02]} origem={[680, 985]} />
        <Acabamento />
        <MiraFoco x={680} y={985} largura={170} altura={140} inicio={SOBREPOSICAO + 6} rotulo="Localização" />
      </CenaComFusao>

      {/* 6. Leituras na tela do equipamento */}
      <CenaComFusao cena={dados}>
        <Clipe src="clips/6514.mp4" inicioNoClipe={0.4} duracao={dur(dados)} escala={[1.2, 1.5]} origem={[590, 700]} />
        <Acabamento />
        <CartoesLeitura leituras={leituras} inicio={local(dados, quadroDaPalavra(3, "estima")) - 6} fim={dur(dados)} />
      </CenaComFusao>

      {/* 7. Benefícios, equipe em campo */}
      <CenaComFusao cena={campo}>
        <Clipe src="clips/6510.mp4" inicioNoClipe={8.6} duracao={dur(campo)} escala={[1.0, 1.1]} origem={[540, 900]} />
        <Acabamento />
      </CenaComFusao>

      {/* 8. Cartela final */}
      <CenaComFusao cena={final}>
        <CartelaFinal cta={cta} kicker={kicker} />
      </CenaComFusao>

      <Assinatura inicio={silencio.inicio} fim={marca.inicio} />
      <Assinatura inicio={somImagem.inicio} fim={dados.inicio} />
      <Assinatura inicio={campo.inicio} fim={final.inicio} />

      {/* Legendas (fora da vinheta de dados e da cartela, que já mostram o texto) */}
      <Legendas frases={FRASES.slice(1, 3)} />
      <Legendas frases={FRASES.slice(4, 5)} />

      {/* Som */}
      {comTrilha ? (
        <Audio
          src={staticFile("audio/imageador-trilha.wav")}
          volume={(f) =>
            interpolate(f, [0, 8, DURACAO - 40, DURACAO], [0, volumeTrilha, volumeTrilha, 0], clamp)
          }
        />
      ) : null}
      {comVoz
        ? FRASES.map((f) => (
            <Sequence key={f.arquivo} from={f.inicio} durationInFrames={f.quadros + 15} name={f.arquivo}>
              <Audio src={staticFile(f.arquivo)} volume={1} />
            </Sequence>
          ))
        : null}
      <Sequence from={INICIO_GANCHO} durationInFrames={30} name="abertura">
        <Audio src={staticFile("audio/transicao.wav")} volume={0.22} />
      </Sequence>
      {ticksAbertura.map((q) => (
        <Sequence key={`a${q}`} from={q} durationInFrames={6} name="tick-abertura">
          <Audio src={staticFile("audio/tick.wav")} volume={0.2} />
        </Sequence>
      ))}
      {[silencio, marca, somImagem, problema, dados, campo, final].map((c) => (
        <Sequence key={`t${c.id}`} from={c.inicio - SOBREPOSICAO - 6} durationInFrames={30} name="transicao">
          <Audio src={staticFile("audio/transicao.wav")} volume={0.18} />
        </Sequence>
      ))}
      {[18, somImagem.inicio + 4, final.inicio + 4].map((q) => (
        <Sequence key={`p${q}`} from={q} durationInFrames={66} name="ping">
          <Audio src={staticFile("audio/ping.wav")} volume={0.16} />
        </Sequence>
      ))}
      {leituras.map((l) => (
        <Sequence key={l.rotulo} from={dados.inicio - SOBREPOSICAO + l.destaque - 4} durationInFrames={6} name="tick">
          <Audio src={staticFile("audio/tick.wav")} volume={0.25} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
