import { Composition, Folder } from "remotion";
import { Anuncio, anuncioPadrao, anuncioSchema } from "./Anuncio/Anuncio";
import { DURACAO_TOTAL, FPS } from "./Anuncio/timeline";
import {
  AnuncioImageador,
  imageadorPadrao,
  imageadorSchema,
} from "./AnuncioImageador/AnuncioImageador";
import { DURACAO as DURACAO_IMAGEADOR } from "./AnuncioImageador/roteiro";
import { Roteiro43, r43Padrao, r43Schema } from "./Roteiro43/Roteiro43";
import { DURACAO as DURACAO_R43 } from "./Roteiro43/timeline";
import { DivisaoMS, divisaoPadrao, divisaoSchema } from "./DivisaoMS/DivisaoMS";
import { DURACAO as DURACAO_MS } from "./DivisaoMS/edicao";
import { STORY_DURACAO, StoryMateria, storyPadrao, storySchema } from "./StoryMateria/StoryMateria";
import {
  REEL_PRODUTOR_DURACAO,
  ReelProdutor,
  reelProdutorPadrao,
  reelProdutorSchema,
} from "./ReelProdutor/ReelProdutor";
import { ReelProdutorViral, VIRAL_DURACAO } from "./ReelProdutorViral/ReelProdutorViral";
import { HelloWorld } from "./HelloWorld";
import { Logo } from "./HelloWorld/Logo";
import { Title } from "./HelloWorld/Title";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Elements">
        <Composition
          id="Logo"
          component={Logo}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            logoColor1: "#91EAE4",
            logoColor2: "#86A8E7",
          }}
        />
        <Composition
          id="Title"
          component={Title}
          durationInFrames={115}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            titleText: "Welcome to Remotion",
            titleColor: "#000000",
          }}
        />
      </Folder>
      <Composition
        // You can take the "id" to render a video:
        // bunx remotion render HelloWorld
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        // You can override these props for each render:
        // https://www.remotion.dev/docs/parametrized-rendering
        defaultProps={{
          titleText: "Welcome to Remotion",
          titleColor: "#000000",
        }}
      />
      <Composition
        // Anúncio vertical 9:16 para Reels/Stories:
        // npx remotion render AnuncioSolver out/anuncio.mp4
        id="AnuncioSolver"
        component={Anuncio}
        durationInFrames={DURACAO_TOTAL}
        fps={FPS}
        width={1080}
        height={1920}
        schema={anuncioSchema}
        defaultProps={anuncioPadrao}
      />
      <Composition
        // Anúncio do imageador acústico com locução:
        // npx remotion render AnuncioImageador out/imageador.mp4
        id="AnuncioImageador"
        component={AnuncioImageador}
        durationInFrames={DURACAO_IMAGEADOR}
        fps={FPS}
        width={1080}
        height={1920}
        schema={imageadorSchema}
        defaultProps={imageadorPadrao}
      />
      <Composition
        // Roteiro Master 43 s (HUD, rastreamento e sound design):
        // npx remotion render Roteiro43 out/roteiro43.mp4
        id="Roteiro43"
        component={Roteiro43}
        durationInFrames={DURACAO_R43}
        fps={FPS}
        width={1080}
        height={1920}
        schema={r43Schema}
        defaultProps={r43Padrao}
      />
      <Composition
        // Reel institucional "49 anos da divisão de MS":
        // npx remotion render DivisaoMS out/divisao-ms.mp4
        id="DivisaoMS"
        component={DivisaoMS}
        durationInFrames={DURACAO_MS}
        fps={FPS}
        width={1080}
        height={1920}
        schema={divisaoSchema}
        defaultProps={divisaoPadrao}
      />
      <Composition
        // Story animado de matéria (utilidade pública):
        // npx remotion render StoryMateria out/story-materia.mp4
        id="StoryMateria"
        component={StoryMateria}
        durationInFrames={STORY_DURACAO}
        fps={FPS}
        width={1080}
        height={1920}
        schema={storySchema}
        defaultProps={storyPadrao}
      />
      <Composition
        // Reels comemorativo "Dia do Produtor Rural" (10/10, MS):
        // npx remotion render ReelProdutor out/reel-produtor.mp4
        id="ReelProdutor"
        component={ReelProdutor}
        durationInFrames={REEL_PRODUTOR_DURACAO}
        fps={FPS}
        width={1080}
        height={1920}
        schema={reelProdutorSchema}
        defaultProps={reelProdutorPadrao}
      />
      <Composition
        // Reels viral "Dia do Produtor Rural" (gancho + cortes na batida):
        // npx remotion render ReelProdutorViral out/reel-produtor-viral.mp4
        id="ReelProdutorViral"
        component={ReelProdutorViral}
        durationInFrames={VIRAL_DURACAO}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
