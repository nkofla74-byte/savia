import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { firmaIntegridad } from "./signature";

describe("firmaIntegridad", () => {
  it("es el SHA-256 hex de referencia+monto+moneda+secreto en ese orden", () => {
    const esperado = createHash("sha256")
      .update("SAVIA-7X2K" + 4900000 + "COP" + "secreto")
      .digest("hex");
    expect(firmaIntegridad("SAVIA-7X2K", 4900000, "COP", "secreto")).toBe(esperado);
  });

  it("devuelve 64 caracteres hexadecimales y es determinista", () => {
    const a = firmaIntegridad("ref", 100, "COP", "s");
    const b = firmaIntegridad("ref", 100, "COP", "s");
    expect(a).toMatch(/^[a-f0-9]{64}$/);
    expect(a).toBe(b);
  });
});
