import { describe, expect, it } from "vitest";
import { buildContactoMessage } from "./whatsapp";

const input = { nombre: "Ana", telefono: "3001112233", email: "ana@mail.com", asunto: "Consulta", mensaje: "Hola Savia" };

describe("buildContactoMessage", () => {
  it("incluye nombre, teléfono, asunto y mensaje", () => {
    const { text } = buildContactoMessage(input, "573001112233");
    expect(text).toContain("Ana");
    expect(text).toContain("3001112233");
    expect(text).toContain("Consulta");
    expect(text).toContain("Hola Savia");
  });
  it("arma una url wa.me con el número dado", () => {
    const { url } = buildContactoMessage(input, "573001112233");
    expect(url.startsWith("https://wa.me/573001112233?text=")).toBe(true);
  });
});
