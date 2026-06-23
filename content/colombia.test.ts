import { describe, expect, it } from "vitest";
import { DEPARTAMENTOS, esDepartamentoValido } from "./colombia";

describe("departamentos de Colombia", () => {
  it("tiene 33 entradas (32 departamentos + Bogotá D.C.)", () => {
    expect(DEPARTAMENTOS).toHaveLength(33);
  });
  it("no tiene duplicados", () => {
    expect(new Set(DEPARTAMENTOS).size).toBe(DEPARTAMENTOS.length);
  });
  it("incluye Bogotá D.C.", () => {
    expect(DEPARTAMENTOS).toContain("Bogotá D.C.");
  });
  it("valida pertenencia con esDepartamentoValido", () => {
    expect(esDepartamentoValido("Antioquia")).toBe(true);
    expect(esDepartamentoValido("Narnia")).toBe(false);
  });
});
