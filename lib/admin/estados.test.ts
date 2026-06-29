import { describe, expect, it } from "vitest";
import { ESTADOS, FLUJO, esEstadoValido, ESTADO_LABEL, ESTADO_UI } from "./estados";

describe("estados de pedido", () => {
  it("tiene el flujo completo en orden", () => {
    expect(ESTADOS).toEqual([
      "nuevo",
      "confirmado",
      "preparando",
      "empacado",
      "enviado",
      "entregado",
      "finalizado",
      "cancelado",
    ]);
  });
  it("el flujo lineal excluye cancelado", () => {
    expect(FLUJO).not.toContain("cancelado");
    expect(FLUJO[0]).toBe("nuevo");
  });
  it("cada estado tiene color en ESTADO_UI", () => {
    for (const e of ESTADOS) expect(ESTADO_UI[e].dot.length).toBeGreaterThan(0);
  });
  it("valida estados conocidos y rechaza desconocidos", () => {
    expect(esEstadoValido("enviado")).toBe(true);
    expect(esEstadoValido("perdido")).toBe(false);
  });
  it("tiene etiqueta para cada estado", () => {
    for (const e of ESTADOS) expect(ESTADO_LABEL[e].length).toBeGreaterThan(0);
  });
});
