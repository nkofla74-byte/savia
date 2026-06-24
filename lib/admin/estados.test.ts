import { describe, expect, it } from "vitest";
import { ESTADOS, esEstadoValido, ESTADO_LABEL } from "./estados";

describe("estados de pedido", () => {
  it("tiene los 5 estados en orden", () => {
    expect(ESTADOS).toEqual(["nuevo", "confirmado", "enviado", "entregado", "cancelado"]);
  });
  it("valida estados conocidos y rechaza desconocidos", () => {
    expect(esEstadoValido("enviado")).toBe(true);
    expect(esEstadoValido("perdido")).toBe(false);
  });
  it("tiene etiqueta para cada estado", () => {
    for (const e of ESTADOS) expect(ESTADO_LABEL[e].length).toBeGreaterThan(0);
  });
});
