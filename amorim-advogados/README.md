# Amorim e Advogados Associados: landing page

Site de uma página. A abertura é uma cena ilustrada (café servido, cadeira vazia) que avança conforme a rolagem.
HTML, CSS e JavaScript puros, sem etapa de build. Só a pasta `site/` vai para o ar.

## Situação em 23/09/2026

- Pronto: pesquisa de público e regras da OAB, pacote de design (`design-package.md`) e o site (`site/`).
- Testado: sem erros no console (computador e celular), sem rolagem lateral, teste de rolagem das faixas, contraste do texto sobre a cena (pior caso 4,43:1), formulário, lista interativa, movimento reduzido ligado e desligado com a página aberta, página sem JavaScript.
- Pendente do escritório (seção 0 do `design-package.md`): números da OAB, WhatsApp, e-mail, endereços, horários, serviços atendidos e política contra golpe. No site, cada lacuna aparece marcada como `[PENDENTE: ...]`.
- Pendente antes de publicar: preencher `CONTATO.whatsapp` no script do `site/index.html`, trocar `ENDERECO-DO-SITE` nas tags `og:` (comentário DEPLOY STEP) e validar os textos jurídicos com a advogada responsável.

## Como ver a prévia

Na pasta `site/`, rode `npx http-server` e abra o endereço local no navegador.
Abrir o `index.html` com dois cliques também funciona.

## Estrutura

- `design-package.md`: decisões e textos finais. Não vai para o ar.
- `site/index.html`: a página inteira.
- `site/assets/fonts/`: Young Serif, Atkinson Hyperlegible Next e Courier Prime, hospedadas junto do site (licença em `OFL.txt`).
- `site/assets/og.jpg`: imagem de compartilhamento do link.
