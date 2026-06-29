import { describe, expect, it } from "vitest";
import { contactoSchema } from "./schema";

const base = {
  nombre: "Ana",
  telefono: "3001112233",
  motivo: "Recomendarme un producto",
  mensaje: "Hola, quiero info",
};

describe("contactoSchema", () => {
  it("acepta un mensaje válido", () => {
    expect(contactoSchema.safeParse(base).success).toBe(true);
  });
  it("acepta email vacío u omitido y piel opcional", () => {
    expect(contactoSchema.safeParse({ ...base, email: "" }).success).toBe(true);
    expect(contactoSchema.safeParse(base).success).toBe(true);
    expect(contactoSchema.safeParse({ ...base, piel: "Mixta" }).success).toBe(true);
  });
  it("rechaza nombre corto, teléfono corto y email inválido", () => {
    expect(contactoSchema.safeParse({ ...base, nombre: "A" }).success).toBe(false);
    expect(contactoSchema.safeParse({ ...base, telefono: "123" }).success).toBe(false);
    expect(contactoSchema.safeParse({ ...base, email: "no-es-email" }).success).toBe(false);
  });
  it("rechaza motivo ausente o inválido y piel inválida", () => {
    const sinMotivo = { nombre: base.nombre, telefono: base.telefono, mensaje: base.mensaje };
    expect(contactoSchema.safeParse(sinMotivo).success).toBe(false);
    expect(contactoSchema.safeParse({ ...base, motivo: "Cualquiera" }).success).toBe(false);
    expect(contactoSchema.safeParse({ ...base, piel: "Robótica" }).success).toBe(false);
  });
});
