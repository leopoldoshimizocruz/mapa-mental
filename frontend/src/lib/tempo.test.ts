import { describe, expect, it } from "vitest";
import { tempoRelativo } from "./tempo";

const base = new Date("2026-06-07T12:00:00Z");

describe("tempoRelativo", () => {
  it("nulo vira string vazia", () => {
    expect(tempoRelativo(null, base)).toBe("");
  });
  it("segundos viram 'agora mesmo'", () => {
    expect(tempoRelativo("2026-06-07T11:59:30Z", base)).toBe("agora mesmo");
  });
  it("minutos", () => {
    expect(tempoRelativo("2026-06-07T11:45:00Z", base)).toBe("há 15 min");
  });
  it("horas", () => {
    expect(tempoRelativo("2026-06-07T09:00:00Z", base)).toBe("há 3 h");
  });
  it("dias", () => {
    expect(tempoRelativo("2026-06-05T12:00:00Z", base)).toBe("há 2 dias");
  });
  it("um dia no singular", () => {
    expect(tempoRelativo("2026-06-06T12:00:00Z", base)).toBe("há 1 dia");
  });
});
