import type React from "react";
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
    const props = { id: "n1", data: dados(), selected: false } as unknown as React.ComponentProps<typeof MindNode>;
    render(
      <ReactFlowProvider>
        <MindNode {...props} />
      </ReactFlowProvider>,
    );
    expect(screen.getByText("Olá")).toBeInTheDocument();
    expect(screen.getByText("📌")).toBeInTheDocument();
  });
});
