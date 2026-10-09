# Remotion video

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Welcome to your Remotion project!

## Commands

**Install Dependencies**

```console
npm i --loglevel=error
```

**Start Preview**

```console
npm run dev
```

**Render video**

```console
npx remotion render
```

**Render em ambiente sem acesso a remotion.media** (ex.: sessões em nuvem com rede restrita)

```console
npx remotion render HelloWorld out/video.mp4 --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
```

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Anúncio SOLVER (AnuncioSolver)

Anúncio vertical 9:16 (1080×1920, 30 fps, 27 s) com textos animados, visor de
inspeção, cartela final e trilha sintetizada. Código em `src/Anuncio/`.

Os clipes e os áudios não vão para o Git. Para gerar de novo:

```console
# 1. Clipes do iPhone (HDR HLG) -> H.264 SDR marcado como BT.709
for f in IMG_*.mov; do
  n=${f#IMG_}; n=${n%.mov}
  ffmpeg -i "$f" -vf "scale=1080:1920:flags=lanczos,eq=contrast=1.05:saturation=1.05,unsharp=5:5:0.25" \
    -c:v libx264 -crf 18 -pix_fmt yuv420p -r 30 \
    -bsf:v h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1 \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a aac public/clips/$n.mp4
done

# 2. Trilha e efeitos (sintetizados, sem samples de terceiros)
python3 scripts/gerar_audio.py public/audio

# 3. Render + normalização de volume para redes (-14 LUFS)
npx remotion render AnuncioSolver out/anuncio-solver.mp4
ffmpeg -i out/anuncio-solver.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k out/anuncio-solver-final.mp4
```

Os textos (marca, títulos, slogan, CTA, contato) são props editáveis no Studio
(`npm run dev`) ou em `anuncioPadrao`, em `src/Anuncio/Anuncio.tsx`.
A fonte Montserrat está em `public/fontes` (licença SIL OFL 1.1).

## Anúncio do imageador acústico (AnuncioImageador)

Vertical 9:16, ~32 s, com locução de IA, legendas sincronizadas palavra a
palavra, anéis de sonar, cartões de leitura e cartela com o logo animado.
Código em `src/AnuncioImageador/`. Tempos de cena e legendas saem de
`src/AnuncioImageador/voz.json`.

Arquivos fora do Git: `public/clips/6514.mp4` (+ clipes do anúncio anterior),
`public/marca/` (logos enviados pela empresa e o fundo limpo gerado a partir
do logo claro) e `public/voz/`.

```console
# Locução (Kokoro, TTS local, voz pt-BR) + tempos das palavras
pip install kokoro-onnx soundfile   # modelos: github.com/thewh1teagle/kokoro-onnx/releases
python scripts/gerar_voz.py <pasta_modelos> pf_dora 1.05
python3 scripts/alinhar_legendas.py

# Trilha e efeitos
python3 scripts/gerar_audio_imageador.py 31.7 public/audio

npx remotion render AnuncioImageador out/imageador.mp4
ffmpeg -i out/imageador.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k out/imageador-final.mp4
```

A versão padrão sai **sem voz e sem trilha**, só com os efeitos sonoros das
animações (`comVoz: false`, `comTrilha: false` em `imageadorPadrao`). Os efeitos
saem baixos; antes de publicar, suba o ganho:
`ffmpeg -i out/imageador.mp4 -c:v copy -af "volume=12dB,alimiter=limit=0.84:level=false" -c:a aac -b:a 192k out/imageador-sem-voz.mp4`.

Para trocar a voz por outra (ex.: ElevenLabs), basta gravar um WAV por frase
em `public/voz/fraseNN.wav`, atualizar as durações em `voz.json` e rodar
`alinhar_legendas.py`.

## Roteiro Master 43 s (Roteiro43)

Vídeo vertical de 43 s (1290 quadros): técnico → máquina → preparação →
equipamento → sensor → análise → montagem → assinatura. HUD minimalista
(retículos, scan 3D, chamadas técnicas, TARGET DETECTED, ANALYZING/ANALYSIS
COMPLETE) ancorado por **rastreamento de movimento real** (OpenCV, fluxo
óptico Lucas-Kanade). Os dados da tela do equipamento não são alterados.
Código em `src/Roteiro43/`.

```console
# 1. Brutos em public/clips/: r1.mp4 (1007_1), r11.mp4 (1007_11), r12.mp4 (1007_12), 6518.mp4
python3 scripts/preparar_planos_r43.py          # corta os planos (câmera lenta com minterpolate)
# 2. Rastreamento (pip install opencv-python-headless)
python scripts/rastrear_r43.py                  # gera src/Roteiro43/rastreio.json
# 3. Sound design (sintetizado)
python3 scripts/gerar_audio_r43.py
# 4. Render
npx remotion render Roteiro43 out/roteiro43.mp4
```

`comTrilha: false` nas props tira a trilha e deixa só os efeitos sonoros.

## Reel institucional "49 anos da divisão de MS" (DivisaoMS)

Edição documental de uma fala de 79 s: corte do silêncio inicial e de duas
pausas longas, reenquadramento digital seguindo o rosto (4K → 1080x1920),
legendas pt-BR sincronizadas com destaques, mapa da divisão MT/MS com
contornos reais, voz tratada (redução de ruído, EQ, compressão) e trilha
instrumental com ducking. Transcrição em `docs/divisao-ms-transcricao.md`.

```console
# bruto em public/ms/ (fora do Git)
python scripts/transcrever.py voz16k.wav <sherpa-onnx-whisper-turbo> transcricao.json
python scripts/rastrear_rosto.py <video> src/DivisaoMS/rosto.json   # opencv-python-headless<5
python3 scripts/mapa_ms.py br_mt.json br_ms.json                   # src/DivisaoMS/mapa.json
python3 scripts/gerar_trilha_ms.py 76.8 27.0 59.0 public/ms/trilha.wav
npx remotion render DivisaoMS out/divisao-ms.mp4
```

## Story de matéria (StoryMateria)

Story de utilidade pública a partir de uma matéria (Campo Grande News):
título em 3D lido junto com a locução feminina em tom de reportagem, foto,
números com os laços do Outubro Rosa e do Novembro Azul e fechamento com a
logo. Fundo de jornal claro e desfocado. A locução define a linha do tempo
(`src/StoryMateria/voz.json`), usada pelas cenas e pela trilha.

```console
# fotos e logos em public/story/ (fora do Git)
python scripts/gerar_voz_story.py <pasta_modelos_kokoro> src/StoryMateria/roteiro.json   # voz + voz.json
python3 scripts/gerar_trilha_story.py src/StoryMateria/voz.json public/story/trilha-v3.wav
npx remotion render StoryMateria out/story-materia.mp4
```

O texto da locução e o ritmo de cada cena ficam no `roteiro.json`. O fundo
de jornal e os helpers são compartilhados em `src/Materia/comum.tsx`.

## Reels "Dia do Produtor Rural" (ReelProdutor)

Reels comemorativo do 10 de outubro em MS, em estilo de homenagem (não é
matéria): fotos em tela cheia com luz quente de fim de tarde, frases curtas
("A quem cuida da terra", "cria e produz", "faz o futuro do campo"), com duas
fotos reais do deputado (no curral e em evento do agro), com
detalhe em fonte manuscrita (Dancing Script, licença OFL), selo discreto da
Lei Estadual nº 2.141/2000 e fechamento "Parabéns, produtor rural!" com a
logo. Sem locução; trilha emocional de piano e pads. Logo como marca d'água no
canto inferior direito. A linha do tempo fica em `src/ReelProdutor/linha.json`
(cenas e trilha).

```console
# fotos e logo em public/reel-produtor/ (fora do Git)
python3 scripts/gerar_trilha_produtor.py src/ReelProdutor/linha.json public/reel-produtor/trilha-v3.wav
npx remotion render ReelProdutor out/reel-produtor.mp4
```

## Reels viral "Dia do Produtor Rural" (ReelProdutorViral)

Formato de alto alcance, diferente dos demais: gancho nos 2 primeiros
segundos ("Se você comeu hoje, agradeça a um produtor rural"), montagem com
um corte a cada 2 tempos da batida (120 BPM) e palavras gigantes com impacto
(zoom, tremor e clarão), "10/10" na quebra, Lei nº 2.141/2000 e autoria sobre
as fotos do deputado, chamada "Marque um produtor rural que você admira" e
final com a logo. Marcas de tempo em `src/ReelProdutorViral/linha.json`
(cenas e batida).

```console
python3 scripts/gerar_trilha_viral.py src/ReelProdutorViral/linha.json public/reel-produtor/trilha-viral.wav
npx remotion render ReelProdutorViral out/reel-produtor-viral.mp4
```

## Reels "Dia do Produtor Rural" — versão equilibrada (ReelProdutorCampo)

Padrão de um deputado experiente, só com fotos reais do deputado,
empilhadas em camadas 3D: cada foto nova entra pela frente e as anteriores
recuam em profundidade (deslocadas, giradas e desfocadas), com uma leve órbita
de câmera que dá paralaxe. No final a pilha se abre em leque ao fundo e a
câmera foca na logo (com espessura 3D) e em "10 de outubro · Dia do Produtor
Rural" em perspectiva. Frases calmas (uma por compasso ≈ 2,7 s) com o gancho "Se você comeu
hoje, agradeça a um produtor rural", a lei, a chamada "Marque um produtor
rural" e "Parabéns, produtor rural!". Luz dourada, partículas de luz e trilha
de violão dedilhado (Karplus-Strong) que cresce até o final.

```console
python3 scripts/gerar_trilha_campo.py src/ReelProdutorCampo/linha.json public/reel-produtor/trilha-campo.wav
npx remotion render ReelProdutorCampo out/reel-produtor-campo.mp4
```

## Reels "Dia do Produtor Rural" — versão definitiva (ReelProdutorAutor)

Junta o roteiro "a data tem autor" com o visual em camadas 3D: gancho de
curiosidade ("O Dia do Produtor Rural em MS tem autor."), autoria da Lei
Estadual nº 2.141/2000 logo no início, o produtor como herói no texto
("planta, cria e colhe", "Há 26 anos…"), chamada "Marque um produtor rural"
e final com a logo grande em 3D e "10 de outubro · Dia do Produtor Rural".
As fotos do deputado se empilham em camadas (a nova na frente, as anteriores
recuam desfocadas) e no final se abrem ao fundo. Cada frase fica na tela o
tempo de leitura (~3 palavras/s + respiro); 26 s no total. Trilha em pagode
de viola (batida recortada 3+3+2, solo em terças, "pa-ra-pá" no final),
sintetizada em `scripts/gerar_trilha_pagode.py`; a toada de viola
(`scripts/gerar_trilha_viola.py`) fica como alternativa.

```console
python3 scripts/gerar_trilha_pagode.py src/ReelProdutorAutor/linha.json public/reel-produtor/trilha-pagode.wav
npx remotion render ReelProdutorAutor out/reel-produtor-autor.mp4
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
