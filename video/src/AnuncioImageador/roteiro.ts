import voz from "./voz.json";
import { FPS } from "./tema";

// Tudo é derivado da locução: cada frase começa quando a anterior termina.

export type Palavra = { palavra: string; inicio: number; fim: number };
export type Frase = {
  arquivo: string;
  duracao: number;
  legenda: string;
  palavras: Palavra[];
  inicio: number; // quadro
  quadros: number;
};

const ENTRADA = 6; // respiro antes da primeira fala

export const FRASES: Frase[] = (() => {
  let q = ENTRADA;
  return voz.frases.map((f) => {
    const quadros = Math.round(f.duracao * FPS);
    const frase = { ...f, inicio: q, quadros };
    q += quadros;
    return frase;
  });
})();

const fimFrase = (i: number) => FRASES[i].inicio + FRASES[i].quadros;
// Quadro em que uma palavra é dita (busca a primeira ocorrência na frase).
export const quadroDaPalavra = (frase: number, palavra: string) => {
  const f = FRASES[frase];
  const p = f.palavras.find((w) => w.palavra.toLowerCase().startsWith(palavra.toLowerCase()));
  if (!p) throw new Error(`Palavra "${palavra}" não encontrada na frase ${frase}`);
  return f.inicio + Math.round(p.inicio * FPS);
};

const FIM_FALA = fimFrase(FRASES.length - 1);
export const DURACAO = FIM_FALA + 2 * FPS;

export type Cena = {
  id: string;
  inicio: number;
  fim: number;
};

// Cortes ancorados na fala.
const corteOuvir = quadroDaPalavra(0, "empresa") + 12;
const corteProblema = quadroDaPalavra(2, "mostra") - 4;

export const CENAS = {
  gancho: { id: "gancho", inicio: 0, fim: corteOuvir },
  silencio: { id: "silencio", inicio: corteOuvir, fim: FRASES[1].inicio },
  marca: { id: "marca", inicio: FRASES[1].inicio, fim: FRASES[2].inicio },
  somImagem: { id: "somImagem", inicio: FRASES[2].inicio, fim: corteProblema },
  problema: { id: "problema", inicio: corteProblema, fim: FRASES[3].inicio },
  dados: { id: "dados", inicio: FRASES[3].inicio, fim: FRASES[4].inicio + 12 },
  campo: { id: "campo", inicio: FRASES[4].inicio + 12, fim: FRASES[5].inicio },
  final: { id: "final", inicio: FRASES[5].inicio, fim: DURACAO },
} satisfies Record<string, Cena>;

export const SOBREPOSICAO = 10; // quadros de fusão entre cenas
