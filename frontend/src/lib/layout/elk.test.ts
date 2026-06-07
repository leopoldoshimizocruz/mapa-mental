import { describe, expect, it } from "vitest";
import { calcularLayout } from "./elk";
import type { No, Ligacao } from "../../types";

function no(id: string, paiId: string | null): No {
  return { id, paiId, texto: id, nota: null, link: null, imagem: null, cor: "#5b2be0", emoji: null, recolhido: false, posicao: null, tamanho: null, estilo: { fonte: "Inter", tamanho: 16, negrito: false, italico: false, sublinhado: false, corTexto: "#fff", alinhamento: "centro", formato: "retangulo-arredondado", corBorda: null, larguraBorda: 0 } };
}

describe("calcularLayout", () => {
  it("retorna uma posição para cada nó visível", async () => {
    const nos: No[] = [no("raiz", null), no("a", "raiz"), no("b", "raiz")];
    const ligacoes: Ligacao[] = [
      { id: "l1", origem: "raiz", destino: "a", tipo: "hierarquia", rotulo: null, estilo: {} },
      { id: "l2", origem: "raiz", destino: "b", tipo: "hierarquia", rotulo: null, estilo: {} },
    ];
    const pos = await calcularLayout(nos, ligacoes, "radial");
    expect(Object.keys(pos).sort()).toEqual(["a", "b", "raiz"]);
    expect(typeof pos["a"].x).toBe("number");
  });

  it("respeita posição manual fixada", async () => {
    const nos: No[] = [no("raiz", null)];
    nos[0].posicao = { x: 123, y: 456 };
    const pos = await calcularLayout(nos, [], "radial");
    expect(pos["raiz"]).toEqual({ x: 123, y: 456 });
  });

  it("omite descendentes de nó recolhido", async () => {
    const nos: No[] = [no("raiz", null), no("a", "raiz"), no("a1", "a")];
    nos[1].recolhido = true;
    const ligacoes: Ligacao[] = [
      { id: "l1", origem: "raiz", destino: "a", tipo: "hierarquia", rotulo: null, estilo: {} },
      { id: "l2", origem: "a", destino: "a1", tipo: "hierarquia", rotulo: null, estilo: {} },
    ];
    const pos = await calcularLayout(nos, ligacoes, "radial");
    expect(pos["a1"]).toBeUndefined();
    expect(pos["a"]).toBeDefined();
  });
});
