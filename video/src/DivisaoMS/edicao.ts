// Edição do vídeo "49 anos da divisão de MS" (fala do Deputado Zé Teixeira).
// Todos os tempos de origem (s) referem-se ao arquivo bruto; a saída remove o
// silêncio inicial e encurta duas pausas longas (jump cuts nas pausas).

export const FPS = 30;

export type Tipo = "aberto" | "medio" | "close" | "mapaUno" | "mapaCuiaba" | "mapaDivisao";
export type Plano = { de: number; ate: number; tipo: Tipo; zoom?: [number, number] };

// Blocos contínuos do bruto (os intervalos entre eles são cortados).
export const BLOCOS: [number, number][] = [
  [1.35, 10.09],
  [10.82, 18.89],
  [19.41, 79.2],
];

export const PLANOS: Plano[] = [
  { de: 1.35, ate: 5.65, tipo: "medio", zoom: [1.24, 1.3] },
  { de: 5.65, ate: 10.09, tipo: "close", zoom: [1.55, 1.62] },
  { de: 10.82, ate: 13.36, tipo: "medio", zoom: [1.26, 1.3] },
  { de: 13.36, ate: 16.3, tipo: "mapaUno" },
  { de: 16.3, ate: 18.89, tipo: "close", zoom: [1.5, 1.58] },
  { de: 19.41, ate: 23.65, tipo: "medio", zoom: [1.22, 1.27] },
  { de: 23.65, ate: 25.3, tipo: "close", zoom: [1.5, 1.54] },
  { de: 25.3, ate: 29.73, tipo: "mapaCuiaba" },
  { de: 29.73, ate: 33.86, tipo: "mapaDivisao" },
  { de: 33.86, ate: 38.05, tipo: "medio", zoom: [1.22, 1.26] },
  { de: 38.05, ate: 42.1, tipo: "aberto", zoom: [1.1, 1.12] },
  { de: 42.1, ate: 47.99, tipo: "medio", zoom: [1.24, 1.34] },
  { de: 47.99, ate: 53.8, tipo: "close", zoom: [1.5, 1.58] },
  { de: 53.8, ate: 56.85, tipo: "medio", zoom: [1.26, 1.28] },
  { de: 56.85, ate: 62.8, tipo: "aberto", zoom: [1.1, 1.14] },
  { de: 62.8, ate: 68.81, tipo: "close", zoom: [1.42, 1.52] },
  { de: 68.81, ate: 75.08, tipo: "medio", zoom: [1.24, 1.3] },
  { de: 75.08, ate: 79.2, tipo: "close", zoom: [1.42, 1.5] },
];

// tempo de origem -> quadro de saída
export const paraSaida = (src: number) => {
  let acumulado = 0;
  for (const [a, b] of BLOCOS) {
    if (src < a) return Math.round(acumulado * FPS);
    if (src <= b) return Math.round((acumulado + src - a) * FPS);
    acumulado += b - a;
  }
  return Math.round(acumulado * FPS);
};

export const DURACAO = paraSaida(79.2);

// Legendas: *amarelo* e _verde_ marcam as palavras de destaque.
export const FALAS: [number, number, string][] = [
  [1.6, 3.01, "Meu *Mato Grosso do Sul*,"],
  [3.79, 5.31, "no dia *11 de outubro*,"],
  [5.99, 6.74, "comemora"],
  [7.39, 9.84, "*49 anos* da divisão."],
  [11.07, 13.18, "Eu, que cheguei aqui em 62,"],
  [13.54, 15.92, "ainda no _Mato Grosso uno_,"],
  [16.68, 18.67, "fiz parte desse processo. Ajudei"],
  [19.66, 23.42, "o _sonho_ que o sul-mato-grossense tinha em fazer essa divisão,"],
  [23.88, 27.11, "porque era muito distante, *800 quilômetros*"],
  [27.8, 29.38, "para ir a Cuiabá."],
  [30.08, 33.58, "Houve essa divisão. Hoje tem _dois estados prósperos_"],
  [34.14, 36.43, "no Centro-Oeste: Mato Grosso do Sul"],
  [36.87, 37.81, "e Mato Grosso."],
  [38.29, 39.19, "*Dois irmãos*"],
  [39.57, 41.92, "que se dividiram, mas continuam únicos."],
  [42.28, 44.95, "Os dois fazem parte da maior economia"],
  [45.56, 47.71, "do nosso país, que é o _agronegócio_."],
  [48.25, 49.26, "_Terras férteis_."],
  [49.68, 50.93, "Hoje, Mato Grosso"],
  [51.44, 53.54, "produz *um terço*"],
  [54.05, 56.65, "do que produz a soja no Brasil."],
  [57.04, 59.85, "E nós, aqui no Sul, fazemos parte. Ficamos menor,"],
  [60.26, 62.5, "mas produzimos muito pelas nossas _terras férteis_."],
  [63.11, 66.51, "*Parabéns, Mato Grosso do Sul*, que você continua sempre desenvolvendo,"],
  [66.95, 68.63, "crescendo e dando _dias melhores_"],
  [68.99, 71.68, "à sua população. E, como deputado reeleito,"],
  [72.09, 74.85, "quero continuar ajudando nessa grande construção"],
  [75.31, 78.06, "de *dias melhores* para Mato Grosso do Sul e para o Brasil."],
];

export type Palavra = { texto: string; cor: "branco" | "amarelo" | "verde" };
export type Bloco = { de: number; ate: number; palavras: Palavra[] }; // quadros de saída

const lerMarcacao = (texto: string): Palavra[] => {
  const out: Palavra[] = [];
  let estado: Palavra["cor"] = "branco";
  for (const bruto of texto.split(" ")) {
    let t = bruto;
    let cor = estado;
    if (t.startsWith("*")) {
      cor = "amarelo";
      t = t.slice(1);
      estado = "amarelo";
    } else if (t.startsWith("_")) {
      cor = "verde";
      t = t.slice(1);
      estado = "verde";
    }
    const fecha = /[*_]([,.:?!]*)$/.exec(t);
    if (fecha) {
      t = t.slice(0, fecha.index) + fecha[1];
      estado = "branco";
    }
    out.push({ texto: t, cor });
  }
  return out;
};

// Divide cada fala em blocos de até 2 linhas. A quebra é escolhida para:
// equilibrar o tamanho, preferir pontuação, nunca separar um destaque nem
// nomes como "Mato Grosso do Sul" e evitar terminar em palavra de ligação.
const LIGACAO = new Set(["de", "do", "da", "dos", "das", "o", "a", "os", "as", "e", "em", "no", "na", "nas", "nos", "para", "que", "pelas", "nossas", "um", "à", "mas"]);
const NAO_QUEBRAR_ANTES = new Set(["Grosso", "Sul", "do", "quilômetros", "irmãos", "férteis", "melhores", "prósperos"]);
const MAX = 38;

const melhorQuebra = (ps: Palavra[]): number => {
  const tam = (a: number, b: number) => ps.slice(a, b).reduce((n, p) => n + p.texto.length + 1, 0);
  const total = tam(0, ps.length);
  let melhor = -1;
  let nota = -Infinity;
  for (let i = 1; i < ps.length; i++) {
    const esq = tam(0, i);
    const dir = total - esq;
    let n = -Math.abs(esq - dir) / 6;
    const ultima = ps[i - 1].texto;
    if (/[,.:?!]$/.test(ultima)) n += 5;
    if (ps[i - 1].cor !== "branco" && ps[i].cor === ps[i - 1].cor) n -= 30; // dentro do destaque
    if (LIGACAO.has(ultima.toLowerCase().replace(/[,.:?!]/g, ""))) n -= 8;
    if (NAO_QUEBRAR_ANTES.has(ps[i].texto.replace(/[,.:?!]/g, ""))) n -= 12;
    if (esq > MAX + 6 || dir > MAX + 6) n -= 20;
    if (n > nota) {
      nota = n;
      melhor = i;
    }
  }
  return melhor;
};

const dividir = (ps: Palavra[], ini: number): number[][] => {
  const tam = ps.reduce((n, p) => n + p.texto.length + 1, 0);
  if (tam <= MAX || ps.length < 3) return [ps.map((_, i) => ini + i)];
  const q = melhorQuebra(ps);
  return [...dividir(ps.slice(0, q), ini), ...dividir(ps.slice(q), ini + q)];
};

export const BLOCOS_LEGENDA: Bloco[] = (() => {
  const blocos: Bloco[] = [];
  for (const [a, b, texto] of FALAS) {
    const palavras = lerMarcacao(texto);
    const pesos = palavras.map((p) => Math.max(2, p.texto.replace(/\W/g, "").length) + 1.2);
    const total = pesos.reduce((s, x) => s + x, 0);
    let t = a;
    for (const g of dividir(palavras, 0)) {
      const d = ((b - a) * g.reduce((s, i) => s + pesos[i], 0)) / total;
      blocos.push({ de: paraSaida(t), ate: paraSaida(t + d), palavras: g.map((i) => palavras[i]) });
      t += d;
    }
  }
  // cada bloco fica até o próximo começar (no máximo +0,6 s)
  for (let i = 0; i < blocos.length; i++) {
    const prox = blocos[i + 1]?.de ?? DURACAO;
    blocos[i].ate = Math.min(prox, blocos[i].ate + Math.round(0.6 * FPS));
  }
  return blocos;
})();

// Pausas (origem, s) — usadas no "ducking" da trilha.
export const FALA_ATIVA = FALAS.map(([a, b]) => [paraSaida(a), paraSaida(b)] as [number, number]);
