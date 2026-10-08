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

Para trocar a voz por outra (ex.: ElevenLabs), basta gravar um WAV por frase
em `public/voz/fraseNN.wav`, atualizar as durações em `voz.json` e rodar
`alinhar_legendas.py`.

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
