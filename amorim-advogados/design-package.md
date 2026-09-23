# Pacote de design: Amorim e Advogados Associados

Conceito escolhido: **O café da conversa**.

Mudança de rota (23/09/2026): a cena de abertura virou uma **ilustração em SVG controlada pela rolagem**, no lugar do vídeo gerado. Motivo: a conta Higgsfield está no plano gratuito, que não permite gerar pela conexão, e o teste grátis deixou de aparecer. Decisão do usuário. Nenhum crédito foi gasto.
Todo texto entre aspas neste documento vai para o site exatamente como está escrito.
Números de faixa e altura são pontos de partida, validados depois pelo teste de rolagem.

## 0. Fatos, fontes e pendências

Fatos usados (fonte: site do escritório, lido via busca, 23/09/2026; o acesso direto ao domínio está bloqueado pela rede do ambiente):
- Nome: Amorim e Advogados Associados.
- Fundado em 2011, em Bandeirantes (MS), pela Dra. Rafaela Amorim.
- Atende em Bandeirantes, Campo Grande e Jaraguari (MS).
- Áreas: previdenciário, trabalhista, cível, consumidor e família.

Pendências. Nada disto pode ser inventado; o site não vai ao ar sem estes dados:
- [ ] Número de inscrição da sociedade na OAB/MS e da Dra. Rafaela Amorim (Código de Ética, art. 44).
- [ ] WhatsApp oficial, telefone e e-mail.
- [ ] Endereço de cada unidade e horário de atendimento.
- [ ] Se há atendimento a distância.
- [ ] Quais benefícios e assuntos o escritório atende de fato (listas das seções 01 e 02).
- [ ] Política contra golpe: o escritório confirma que nunca pede pagamento por mensagem para liberar valores?

Validação jurídica pela advogada responsável antes de publicar:
- Prazo de 30 dias do recurso administrativo (Decreto 3.048/1999, art. 305, § 1º).
- Lista de documentos da seção 05.
- Frase "Tudo fica combinado por escrito antes de começar." (Provimento 205/2021 veda referência a valores, forma de pagamento ou gratuidade; a frase não cita nenhum dos três).

Regras da OAB aplicadas (Provimento 205/2021, ainda vigente; revisão em preparo, sem publicação oficial encontrada):
- Sem promessa de resultado, sem casos ou resultados de clientes, sem depoimentos, sem honorários, sem "consulta gratuita", sem comparação, sem autoelogio, sem a palavra "especialista".
- Nome e número de inscrição visíveis. Conteúdo informativo.
- Desvio assumido do padrão da skill: sai a seção de depoimentos e a de preços; entram passo a passo, lista de documentos, dúvidas reais e alerta contra golpe.

## 1. A premissa

**Tempo.** Quem procura o escritório dedicou uma vida inteira ao trabalho, e muitas vezes ouviu um "não" do INSS sem entender por quê. O site inteiro oferece uma coisa só: tempo para ouvir essa história do começo ao fim. O café servido com calma é a imagem disso, e a cadeira vazia do outro lado da mesa é o convite. Cada seção serve a essa ideia: o passo a passo mostra onde o tempo é gasto com cuidado, a lista de documentos prepara a conversa, as dúvidas são respondidas sem pressa, e o fim da página volta à mesma mesa, com a cadeira livre.

## 2. Paleta (direção; valores finais tirados do vídeo aprovado)

Mundo da cena: parede caiada na luz fria da manhã, madeira da mesa, café torrado, porcelana branca, a borda azul-cobalto da xícara.

```css
:root{
  --canvas:#EEF0EC;         /* parede caiada na luz da manhã, levemente fria; nunca branco puro */
  --panel:#F8F8F5;          /* superfícies elevadas */
  --accent:#2F5E8E;         /* borda azul da xícara: botão principal, foco, um ou dois destaques */
  --accent-hover:#244B73;
  --accent-muted:rgba(47,94,142,.16);
  --text-secondary:#5B4E45; /* madeira escura */
  --text-primary:#2A1C15;   /* café torrado */
}
```

Longe dos visuais proibidos: nada de creme com terracota, nada de fundo quase preto com âmbar.

## 3. Fontes

- Títulos: **Young Serif** 400. Serifa macia e firme, acolhedora sem ser frágil.
- Texto: **Atkinson Hyperlegible Next** 400 e 600. Criada para leitores com baixa visão; o público inclui pessoas mais velhas e pessoas com deficiência.
- Etiquetas pequenas: **Courier Prime** 400. Máquina de escrever, como as anotações antigas da carteira de trabalho.
- Hospedadas junto do site (sem chamadas ao Google Fonts).

## 4. Mapa de faixas do herói

Herói com 500vh no computador (faixa de rolagem de 400vh) e 420vh no celular. Desvio assumido dos 400vh padrão: três faixas precisam de mais espaço para cada platô passar de 80vh. No computador, o texto fica na metade esquerda, sobre a parede calma; no celular, no alto da tela. A xícara e a cadeira ficam livres.

| Faixa | Intervalo (ponto de partida) | Momento da cena | Texto (literal) | Entrada |
|---|---|---|---|---|
| 1 | 0,00 a 0,28 | O café começa a cair na xícara quase vazia; o vapor começa | "Uma vida inteira de trabalho" / "merece ser ouvida com calma." | Descida (drift-down), ecoa o café caindo; abre já montada no carregamento |
| 2 | 0,32 a 0,64 | A xícara enche, a câmera desce devagar, o vapor faz curvas | "O INSS negou seu benefício?" / "A gente lê a decisão com você e explica os caminhos possíveis." | Do desfocado ao nítido, ecoa o vapor abrindo a vista |
| 3 (repouso) | 0,70 a 1,00 | O café para, a xícara cheia descansa, o vapor sobe, a cadeira vazia espera | Etiqueta "Amorim e Advogados Associados" / título "Sente-se. Vamos conversar." / linha "Direito previdenciário e outras áreas, em Bandeirantes, Campo Grande e Jaraguari." / botão "Agendar uma conversa" / link "Como funciona" | Palavra por palavra subindo, ecoa o vapor subindo; depois a linha, depois os botões |

Legibilidade: a região calma é uma parede clara e iluminada, então o sistema é invertido: texto escuro sobre véu claro (scrim de névoa) com halo claro no lugar da sombra escura. A auditoria procura o pixel mais escuro sob o texto, com o véu aplicado, e exige contraste de pelo menos 3,5:1. Resultado medido em 23/09/2026: pior caso 4,43:1 no computador e 5,0:1 no celular.

Teste de rolagem (computador, 900px de altura): com passos de 120px, as faixas ficam inteiras por 7, 6 e 18 passos; com passos de 360px, nenhuma faixa é pulada.

## 5. Herói estático (movimento reduzido e navegador sem JavaScript)

Como não há vídeo pesado, o celular recebe a cena animada. A versão parada fica para quem pede movimento reduzido e para navegadores sem JavaScript, sobre o quadro final da cena:
- Etiqueta: "Amorim e Advogados Associados"
- Título: "Sente-se. Vamos conversar."
- Linha: "Uma vida inteira de trabalho merece ser ouvida com calma. Direito previdenciário e outras áreas, em Bandeirantes, Campo Grande e Jaraguari."
- Botão: "Agendar uma conversa"

## 6. Seções abaixo do herói (todas levam ao contato)

Navegação: marca "Amorim e Advogados Associados" · "Previdenciário" · "Outras áreas" · "Como funciona" · "Dúvidas" · "Contato" · botão "Agendar conversa".

### 01 · Previdenciário (duas colunas: título fixo à esquerda, lista à direita)
- Etiqueta: "01 · Previdenciário"
- Título: "Cada ano de trabalho conta."
- Texto: "A gente confere seu histórico no INSS, explica as regras que valem para o seu caso e cuida do pedido, do recurso ou da ação na Justiça."
- Lista (a confirmar com o escritório):
  - "Aposentadorias" · "Por idade, por tempo de contribuição, rural, especial e da pessoa com deficiência."
  - "BPC/LOAS" · "Para idosos e pessoas com deficiência de famílias de baixa renda."
  - "Auxílio por incapacidade" · "Quando uma doença ou um acidente afastam você do trabalho."
  - "Pensão por morte" · "Para a família de quem contribuía."
  - "Revisões" · "Quando o valor do benefício parece errado."
- Nota: "Não precisa saber o nome do benefício. Conte sua situação que a gente descobre junto."

### 02 · Outras áreas (três cartões em linha, com ícone desenhado)
- Etiqueta: "02 · Outras áreas"
- Título: "Também atuamos em outras áreas."
- "Trabalhista" · "Rescisão, horas extras, registro em carteira e acidente de trabalho."
- "Família" · "Divórcio, guarda, pensão alimentícia e inventário."
- "Cível e consumidor" · "Contratos, cobranças indevidas, nome negativado e problemas com compras ou serviços."

### 03 · O escritório (tipográfica: o ano grande como imagem)
- Etiqueta: "03 · O escritório"
- Numeral grande: "2011"
- Título: "Desde 2011, em Bandeirantes."
- Texto: "O escritório nasceu em Bandeirantes, fundado pela Dra. Rafaela Amorim. Hoje atende também em Campo Grande e Jaraguari, do mesmo jeito: ouvindo com atenção, explicando com clareza e mantendo você informado."

### 04 · Como funciona (linha do tempo vertical; o fio de vapor passa pelos quatro pontos)
- Etiqueta: "04 · Como funciona"
- Título: "Sem pressa, do começo ao fim."
- 1 "Você conta sua história." · "Do seu jeito, com calma. Não precisa saber termos jurídicos."
- 2 "A gente olha tudo com cuidado." · "Documentos, carteiras de trabalho, o extrato do INSS (CNIS) e o que mais fizer parte do caso."
- 3 "Você entende os caminhos." · "Explicamos o que pode ser feito, os prazos e os riscos, em palavras simples. Tudo fica combinado por escrito antes de começar."
- 4 "Você acompanha cada passo." · "Sabe em que pé está o seu caso e com quem falar."

### 05 · Antes da conversa (o momento interativo: lista à esquerda, xícara desenhada à direita)
- Etiqueta: "05 · Antes da conversa"
- Título: "Separe o que tiver em casa."
- Texto: "Marque o que já está com você. Não tem tudo? Tudo bem, a gente ajuda a encontrar o resto."
- Itens:
  - "Documento com foto e CPF"
  - "Carteiras de trabalho, todas que tiver"
  - "Extrato do CNIS, que você baixa no Meu INSS"
  - "Carnês ou comprovantes de contribuição"
  - "Laudos, exames e receitas, se o caso for de saúde"
  - "Carta do INSS com a negativa, se houver"
  - "Comprovante de endereço"
- Contador visível no canto da xícara: "0/7" até "7/7". Mecânica: cada item marcado enche a xícara desenhada um pouco mais, com transição suave; desmarcar esvazia com suavidade. Com tudo marcado, o vapor aparece e surge o texto "Pronto. Com isso em mãos, a primeira conversa rende muito mais." com o botão "Agendar uma conversa". Movimento reduzido: sem animação, estado final imediato.

### 06 · Dúvidas (sanfona em coluna estreita)
- Etiqueta: "06 · Dúvidas"
- Título: "Dúvidas comuns sobre o INSS."
- "Posso pedir o benefício sozinho, pelo Meu INSS?" · "Pode. O pedido não exige advogado. O que a gente faz é olhar seu histórico antes, escolher a regra que vale para o seu caso e conferir se nenhum documento ficou de fora. Falta de documento está entre os motivos mais comuns de negativa."
- "O INSS negou. E agora?" · "A negativa não encerra o assunto. Dá para fazer um novo pedido, recorrer no próprio INSS ou levar o caso à Justiça. Cada caminho tem prazo: o recurso ao INSS, por exemplo, precisa ser feito em até 30 dias depois que você toma ciência da decisão. Traga a carta da negativa e a gente explica o que faz sentido para você."
- "A perícia foi rápida e deu negativa. Ainda dá para fazer algo?" · "Dá para contestar. Laudos, exames e relatórios médicos atualizados ajudam a mostrar como a condição afeta o seu dia a dia. Na Justiça, pode haver uma nova perícia, feita por um perito nomeado pelo juiz."
- "Como sei que estou falando com o escritório de verdade?" · "Desconfie de qualquer mensagem que peça dinheiro para liberar valores de processo. Esse é o golpe do falso advogado. [PENDENTE: política do escritório.] Na dúvida, ligue para o número deste site antes de fazer qualquer pagamento."
- "Onde vocês atendem?" · "Em Bandeirantes, Campo Grande e Jaraguari. [PENDENTE: endereços, horários e atendimento a distância.]"

### 07 · Contato (quadro final da cena, fixo enquanto o cartão com o formulário rola por cima)
- Etiqueta: "07 · Contato"
- Título: "A cadeira está livre."
- Texto: "Conte sua situação e a gente marca um horário para conversar."
- Botão principal: "Chamar no WhatsApp" [PENDENTE: número]
- Formulário: "Seu nome" · "Telefone com DDD" · "Cidade" (Bandeirantes, Campo Grande, Jaraguari, Outra) · "Sobre o que você quer conversar?" (exemplo: "Meu auxílio foi negado em março.")
- Botão do formulário: "Enviar pelo WhatsApp"
- Aviso: "Sua mensagem abre no WhatsApp do escritório. Este site não guarda seus dados. Não precisa mandar documentos nem detalhes de saúde por aqui."
- Estado de sucesso: "Abrimos o WhatsApp com a sua mensagem. É só tocar em enviar."
- Destino do formulário: monta a mensagem e abre o WhatsApp do escritório (nada passa por servidor). A confirmar com o escritório.
- Mensagens de validação: "Preencha seu nome." · "Preencha um telefone com DDD."
- Modelo da mensagem enviada ao WhatsApp: "Nome:" · "Telefone:" · "Cidade:" · "Assunto:" seguidos do que a pessoa digitou.

### Rodapé
- "Amorim e Advogados Associados" · "OAB/MS [PENDENTE]" · "Dra. Rafaela Amorim · OAB/MS [PENDENTE]"
- Endereços e horários [PENDENTE]
- "Conteúdo informativo. Não substitui a análise do seu caso por um advogado."
- "Ilustrações criadas com auxílio de inteligência artificial."
- "© 2026 Amorim e Advogados Associados"

## 7. Camada vetorial

- A cena de abertura, em camadas (parede e luz, cadeira desfocada e nítida, mesa, café, xícara, vapor, poeira na luz). A rolagem enche a xícara, afina e corta o fio de café, deixa cair a última gota, faz a cadeira entrar em foco e aproxima a câmera um pouco.
- Elemento assinatura, **o fio de vapor**: uma única linha desenhada à mão em SVG que continua o vapor da xícara do herói e se desenha pela página conforme a rolagem, passando pelos quatro pontos do "Como funciona" e terminando enrolada no botão do contato. Sem ela, a página perde o fio que liga a xícara à conversa.
- Ambiente fixo atrás de tudo: uma mancha de luz de janela, bem desfocada, que desliza devagar (ciclo de 80s), mais uma textura leve de linho.
- Ícones de linha que se desenham na entrada: três em "Outras áreas" (uma carteira de trabalho, duas alianças, uma sacola de compras) e quatro no "Como funciona" (balão de conversa, pasta aberta, bifurcação de caminho, duas cadeiras frente a frente).
- A xícara desenhada da seção 05, que enche conforme a lista.
- Um elemento vivo por seção, em nível de sussurro, pausado fora da tela e com a aba oculta.
- Movimento reduzido: linhas já desenhadas, xícara no estado final, laços parados.

## 8. Lista de engenharia

Blob fetch com anel de carregamento (streamed se o vídeo passar de 8 MB), lerp normalizado por dt em laço rAF que descansa, seeks com trava contra sobreposição, escrita no DOM só quando muda, faixas medidas em vh e validadas pelo teste de rolagem (120, 240 e 360px), sistema de legibilidade em quatro camadas (aqui invertido, texto escuro sobre véu claro) com auditoria do pior quadro, os cinco portões do herói estático idênticos no CSS e no JS e mantidos vivos com listeners, site completo sem o vídeo, overflow-x clip em html e body, movimento reduzido honrado nos dois sentidos, piso de qualidade (fontes aparadas, contraste calculado, landmarks, skip link, foco visível, alvos de 44px, favicon SVG, comentário DEPLOY STEP nas tags og), e o padrão de site todo animado da Fase 8.

## 9. Portão de texto

Todo texto acima vai literal para o site. Antes de qualquer pessoa ver, o `index.html` passa pelo portão da Fase 9: zero travessões, zero palavras de estoque (e seus equivalentes em português, como "soluções", "excelência", "humanizado", "especialista"), mais a varredura de vícios de IA. Recursos de marca escolhidos aqui de propósito ficam.
