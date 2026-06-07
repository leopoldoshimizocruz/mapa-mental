import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "./store";
import type { Mapa } from "../types";

function mapaBase(): Mapa {
  return {
    id: "m1",
    titulo: "T",
    criadoEm: null,
    atualizadoEm: null,
    config: {
      layout: "radial", tema: "claro", corFundo: "#f4f5f7",
      padraoFundo: "pontos", fontePadrao: "Inter", paletaPadrao: [],
    },
    nos: [{
      id: "raiz", paiId: null, texto: "Central", nota: null, link: null,
      imagem: null, cor: "#5b2be0", emoji: null, recolhido: false,
      posicao: null, tamanho: null,
      estilo: {
        fonte: "Inter", tamanho: 16, negrito: false, italico: false,
        sublinhado: false, corTexto: "#fff", alinhamento: "centro",
        formato: "retangulo-arredondado", corBorda: null, larguraBorda: 0,
      },
    }],
    ligacoes: [], contornos: [], elementosLivres: [],
  };
}

describe("store, operações de nó", () => {
  beforeEach(() => useStore.getState().carregarMapa(mapaBase()));

  it("adiciona filho cria nó e ligação de hierarquia", () => {
    const filho = useStore.getState().adicionarFilho("raiz");
    const s = useStore.getState();
    expect(s.mapa!.nos.find((n) => n.id === filho)).toBeTruthy();
    expect(s.mapa!.nos.find((n) => n.id === filho)!.paiId).toBe("raiz");
    expect(s.mapa!.ligacoes.some((l) => l.origem === "raiz" && l.destino === filho)).toBe(true);
  });

  it("adiciona irmão usa o mesmo pai", () => {
    const filho = useStore.getState().adicionarFilho("raiz");
    const irmao = useStore.getState().adicionarIrmao(filho);
    expect(useStore.getState().mapa!.nos.find((n) => n.id === irmao)!.paiId).toBe("raiz");
  });

  it("atualizar texto altera o nó", () => {
    useStore.getState().atualizarNo("raiz", { texto: "Novo" });
    expect(useStore.getState().mapa!.nos.find((n) => n.id === "raiz")!.texto).toBe("Novo");
  });

  it("apagar nó remove a subárvore inteira e suas ligações", () => {
    const a = useStore.getState().adicionarFilho("raiz");
    const b = useStore.getState().adicionarFilho(a);
    useStore.getState().apagarNo(a);
    const s = useStore.getState();
    expect(s.mapa!.nos.find((n) => n.id === a)).toBeUndefined();
    expect(s.mapa!.nos.find((n) => n.id === b)).toBeUndefined();
    expect(s.mapa!.ligacoes.length).toBe(0);
  });

  it("não apaga a raiz", () => {
    useStore.getState().apagarNo("raiz");
    expect(useStore.getState().mapa!.nos.find((n) => n.id === "raiz")).toBeTruthy();
  });

  it("alternar recolhido inverte o estado", () => {
    useStore.getState().alternarRecolhido("raiz");
    expect(useStore.getState().mapa!.nos.find((n) => n.id === "raiz")!.recolhido).toBe(true);
  });
});
