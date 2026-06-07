import { describe, expect, it } from "vitest";
import { resolverAcao } from "./shortcuts";

function ev(p: Partial<KeyboardEvent>): KeyboardEvent {
  return { key: "", ctrlKey: false, metaKey: false, shiftKey: false, ...p } as KeyboardEvent;
}

describe("resolverAcao", () => {
  it("Tab cria filho", () => expect(resolverAcao(ev({ key: "Tab" }))).toBe("filho"));
  it("Enter cria irmão", () => expect(resolverAcao(ev({ key: "Enter" }))).toBe("irmao"));
  it("Delete apaga", () => expect(resolverAcao(ev({ key: "Delete" }))).toBe("apagar"));
  it("Ctrl+Z desfaz", () => expect(resolverAcao(ev({ key: "z", ctrlKey: true }))).toBe("undo"));
  it("Ctrl+Shift+Z refaz", () => expect(resolverAcao(ev({ key: "z", ctrlKey: true, shiftKey: true }))).toBe("redo"));
  it("Ctrl+Y refaz", () => expect(resolverAcao(ev({ key: "y", ctrlKey: true }))).toBe("redo"));
  it("tecla qualquer não resolve", () => expect(resolverAcao(ev({ key: "a" }))).toBeNull());
});
