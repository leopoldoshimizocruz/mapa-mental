import { describe, expect, it } from "vitest";
import { mapaParaTxt } from "./txt";
import type { Mapa, No } from "../../types";

function no(id: string, paiId: string | null, texto: string): No {
  return { id, paiId, texto, nota: null, link: null, imagem: null, cor: "#5b2be0", emoji: null, recolhido: false, posicao: null, tamanho: null, estilo: { fonte: "Inter", tamanho: 16, negrito: false, italico: false, sublinhado: false, corTexto: "#fff", alinhamento: "centro", formato: "retangulo-arredondado", corBorda: null, larguraBorda: 0 } };
}

function mapa(nos: No[]): Mapa {
  return { id: "m", titulo: "T", criadoEm: null, atualizadoEm: null, config: { layout: "radial", tema: "claro", corFundo: "#fff", padraoFundo: "pontos", fontePadrao: "Inter", paletaPadrao: [] }, nos, ligacoes: [], contornos: [], elementosLivres: [] };
}

describe("mapaParaTxt", () => {
  it("gera outline indentado em profundidade", () => {
    const txt = mapaParaTxt(mapa([
      no("raiz", null, "Central"),
      no("a", "raiz", "Ramo A"),
      no("a1", "a", "Folha A1"),
      no("b", "raiz", "Ramo B"),
    ]));
    expect(txt).toBe(
      ["Central", "  Ramo A", "    Folha A1", "  Ramo B"].join("\n"),
    );
  });

  it("inclui emoji quando presente", () => {
    const nos = [no("raiz", null, "Central")];
    nos[0].emoji = "📌";
    expect(mapaParaTxt(mapa(nos))).toBe("📌 Central");
  });
});
