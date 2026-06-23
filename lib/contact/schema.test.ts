import { describe, expect, it } from "vitest";
import { contactoSchema } from "./schema";

const base = { nombre: "Ana", telefono: "3001112233", asunto: "Consulta", mensaje: "Hola, quiero info" };

describe("contactoSchema", () => {
  it("acepta un mensaje válido", () => {
    expect(contactoSchema.safeParse(base).success).toBe(true);
  });
  it("acepta email vacío u omitido", () => {
    expect(contactoSchema.safeParse({ ...base, email: "" }).success).toBe(true);
    expect(contactoSchema.safeParse(base).success).toBe(true);
  });
  it("rechaza nombre corto, teléfono corto y email inválido", () => {
    expect(contactoSchema.safeParse({ ...base, nombre: "A" }).success).toBe(false);
    expect(contactoSchema.safeParse({ ...base, telefono: "123" }).success).toBe(false);
    expect(contactoSchema.safeParse({ ...base, email: "no-es-email" }).success).toBe(false);
  });
});
