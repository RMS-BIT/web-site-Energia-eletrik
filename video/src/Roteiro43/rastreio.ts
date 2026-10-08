import dados from "./rastreio.json";

type Ponto = [number, number, number];
type Nuvem = ([number, number] | null)[][];
type Tabela = Record<string, Record<string, unknown>>;

const T = dados as unknown as Tabela;

// Posição rastreada (com média móvel de 5 quadros para tirar o tremido).
export const ponto = (plano: string, nome: string, f: number) => {
  const arr = T[plano]?.[nome] as Ponto[] | undefined;
  if (!arr) throw new Error(`Rastreio ausente: ${plano}/${nome}`);
  const i = Math.max(0, Math.min(arr.length - 1, Math.round(f)));
  let x = 0;
  let y = 0;
  let s = 0;
  let n = 0;
  for (let k = -2; k <= 2; k++) {
    const p = arr[Math.max(0, Math.min(arr.length - 1, i + k))];
    x += p[0];
    y += p[1];
    s += p[2];
    n++;
  }
  return { x: x / n, y: y / n, s: s / n };
};

export const nuvem = (plano: string, nome: string, f: number) => {
  const arr = T[plano]?.[nome] as Nuvem | undefined;
  if (!arr) throw new Error(`Rastreio ausente: ${plano}/${nome}`);
  return arr[Math.max(0, Math.min(arr.length - 1, Math.round(f)))];
};
