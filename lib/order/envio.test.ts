import { describe, expect, it } from "vitest";
import { ENVIO_COP, calcularTotal } from "./envio";

describe("envío nacional", () => {
  it("la tarifa fija es 12000", () => {
    expect(ENVIO_COP).toBe(12000);
  });

  it("calcularTotal suma el subtotal y el envío", () => {
    expect(calcularTotal(13900)).toBe(13900 + 12000);
    expect(calcularTotal(0)).toBe(12000);
  });
});
