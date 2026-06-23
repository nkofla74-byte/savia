import { describe, expect, it } from "vitest";
import { pedidoSchema } from "./schema";

const base = {
  nombre: "Ana",
  telefono: "3001112233",
  departamento: "Antioquia",
  ciudad: "Medellín",
  direccion: "Calle 1 #2-3",
};

describe("pedidoSchema", () => {
  it("acepta un pedido válido", () => {
    expect(pedidoSchema.safeParse(base).success).toBe(true);
  });
  it("rechaza un departamento fuera de la lista", () => {
    expect(pedidoSchema.safeParse({ ...base, departamento: "Narnia" }).success).toBe(false);
  });
  it("rechaza dirección o ciudad cortas", () => {
    expect(pedidoSchema.safeParse({ ...base, direccion: "x" }).success).toBe(false);
    expect(pedidoSchema.safeParse({ ...base, ciudad: "" }).success).toBe(false);
  });
});
