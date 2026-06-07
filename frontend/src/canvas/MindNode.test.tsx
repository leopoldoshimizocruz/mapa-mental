import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { MindNode } from "./MindNode";
import { ESTILO_PADRAO } from "../types";

function dados() {
  return {
    no: {
      id: "n1", paiId: null, texto: "Olá", nota: null, link: null, imagem: null,
      cor: "#2a9d8f", emoji: "📌", recolhido: false, posicao: null, tamanho: null,
      estilo: { ...ESTILO_PADRAO },
    },
    temFilhos: false,
  };
}

describe("MindNode", () => {
  it("renderiza texto e emoji", () => {
    render(
      <ReactFlowProvider>
        <MindNode id="n1" data={dados()} selected={false} />
      </ReactFlowProvider> as never,
    );
    expect(screen.getByText("Olá")).toBeInTheDocument();
    expect(screen.getByText("📌")).toBeInTheDocument();
  });
});
