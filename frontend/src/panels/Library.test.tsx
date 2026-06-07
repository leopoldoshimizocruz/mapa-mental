import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Library } from "./Library";
import { api } from "../api/client";

vi.mock("../api/client", () => ({
  api: {
    listar: vi.fn(),
    criar: vi.fn(),
    apagar: vi.fn(),
    renomear: vi.fn(),
  },
}));

describe("Library (tela de início)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lista os mapas vindos da API", async () => {
    (api.listar as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "m1", titulo: "Plano de Marketing", criadoEm: "2026-06-01T12:00:00Z", atualizadoEm: "2026-06-06T12:00:00Z" },
    ]);
    render(<Library onAbrir={() => {}} />);
    await waitFor(() => expect(screen.getByText("Plano de Marketing")).toBeInTheDocument());
  });

  it("filtra pela busca", async () => {
    (api.listar as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "m1", titulo: "Marketing", criadoEm: null, atualizadoEm: null },
      { id: "m2", titulo: "Finanças", criadoEm: null, atualizadoEm: null },
    ]);
    const user = (await import("@testing-library/user-event")).default.setup();
    render(<Library onAbrir={() => {}} />);
    await waitFor(() => expect(screen.getByText("Marketing")).toBeInTheDocument());
    await user.type(screen.getByPlaceholderText("Buscar mapa…"), "fin");
    expect(screen.queryByText("Marketing")).not.toBeInTheDocument();
    expect(screen.getByText("Finanças")).toBeInTheDocument();
  });
});
