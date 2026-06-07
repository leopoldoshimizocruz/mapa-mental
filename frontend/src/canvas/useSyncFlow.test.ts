import { describe, expect, it } from "vitest";
import { derivarFlow } from "./useSyncFlow";
import type { Mapa, No, Ligacao } from "../types";
import { ESTILO_PADRAO } from "../types";

function no(id: string, paiId: string | null, recolhido = false): No {
  return { id, paiId, texto: id, nota: null, link: null, imagem: null, cor: "#5b2be0", emoji: null, recolhido, posicao: null, tamanho: null, estilo: { ...ESTILO_PADRAO } };
}

function mapa(nos: No[], ligacoes: Ligacao[]): Mapa {
  return { id: "m", titulo: "T", criadoEm: null, atualizadoEm: null, config: { layout: "radial", tema: "claro", corFundo: "#fff", padraoFundo: "pontos", fontePadrao: "Inter", paletaPadrao: [] }, nos, ligacoes, contornos: [], elementosLivres: [] };
}

const POS = { raiz: { x: 0, y: 0 }, a: { x: 100, y: 0 } };

describe("derivarFlow", () => {
  it("monta nodes e edges visíveis com posição", () => {
    const m = mapa(
      [no("raiz", null), no("a", "raiz")],
      [{ id: "l1", origem: "raiz", destino: "a", tipo: "hierarquia", rotulo: null, estilo: {} }],
    );
    const { nodes, edges } = derivarFlow(m, POS);
    expect(nodes.map((n) => n.id).sort()).toEqual(["a", "raiz"]);
    expect(nodes.find((n) => n.id === "a")!.position).toEqual({ x: 100, y: 0 });
    expect(edges).toHaveLength(1);
  });

  it("oculta descendentes de nó recolhido", () => {
    const m = mapa(
      [no("raiz", null), no("a", "raiz", true), no("a1", "a")],
      [
        { id: "l1", origem: "raiz", destino: "a", tipo: "hierarquia", rotulo: null, estilo: {} },
        { id: "l2", origem: "a", destino: "a1", tipo: "hierarquia", rotulo: null, estilo: {} },
      ],
    );
    const { nodes } = derivarFlow(m, { raiz: { x: 0, y: 0 }, a: { x: 100, y: 0 } });
    expect(nodes.map((n) => n.id).sort()).toEqual(["a", "raiz"]);
  });
});
