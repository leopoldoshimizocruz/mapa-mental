import type { Mapa, No } from "../../types";

/** Converte o mapa num outline de texto indentado (2 espaços por nível). */
export function mapaParaTxt(mapa: Mapa): string {
  const filhos = new Map<string | null, No[]>();
  for (const n of mapa.nos) {
    const lista = filhos.get(n.paiId) ?? [];
    lista.push(n);
    filhos.set(n.paiId, lista);
  }

  const linhas: string[] = [];
  const visitar = (no: No, nivel: number) => {
    const rotulo = no.emoji ? `${no.emoji} ${no.texto}` : no.texto;
    linhas.push("  ".repeat(nivel) + rotulo);
    for (const filho of filhos.get(no.id) ?? []) visitar(filho, nivel + 1);
  };

  for (const raiz of filhos.get(null) ?? []) visitar(raiz, 0);
  return linhas.join("\n");
}
