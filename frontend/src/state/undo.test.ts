import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "./store";
import type { Mapa } from "../types";

function mapaBase(): Mapa {
  return {
    id: "m1", titulo: "T", criadoEm: null, atualizadoEm: null,
    config: { layout: "radial", tema: "claro", corFundo: "#f4f5f7", padraoFundo: "pontos", fontePadrao: "Inter", paletaPadrao: [] },
    nos: [{ id: "raiz", paiId: null, texto: "Central", nota: null, link: null, imagem: null, cor: "#5b2be0", emoji: null, recolhido: false, posicao: null, tamanho: null, estilo: { fonte: "Inter", tamanho: 16, negrito: false, italico: false, sublinhado: false, corTexto: "#fff", alinhamento: "centro", formato: "retangulo-arredondado", corBorda: null, larguraBorda: 0 } }],
    ligacoes: [], contornos: [], elementosLivres: [],
  };
}

describe("undo/redo", () => {
  beforeEach(() => {
    useStore.getState().carregarMapa(mapaBase());
    useStore.temporal.getState().clear();
  });

  it("desfaz a criação de um nó", () => {
    useStore.getState().adicionarFilho("raiz");
    expect(useStore.getState().mapa!.nos.length).toBe(2);
    useStore.temporal.getState().undo();
    expect(useStore.getState().mapa!.nos.length).toBe(1);
  });

  it("refaz depois de desfazer", () => {
    useStore.getState().adicionarFilho("raiz");
    useStore.temporal.getState().undo();
    useStore.temporal.getState().redo();
    expect(useStore.getState().mapa!.nos.length).toBe(2);
  });
});
