import { describe, expect, it } from "vitest";
import { buildContactoMessage } from "./whatsapp";
import type { ContactoInput } from "./schema";

const input: ContactoInput = {
  nombre: "Ana",
  telefono: "3001112233",
  email: "ana@mail.com",
  motivo: "Recomendarme un producto",
  mensaje: "Hola Savia",
};

describe("buildContactoMessage", () => {
  it("incluye nombre, whatsapp, motivo y mensaje", () => {
    const { text } = buildContactoMessage(input, "573001112233");
    expect(text).toContain("Ana");
    expect(text).toContain("3001112233");
    expect(text).toContain("Recomendarme un producto");
    expect(text).toContain("Hola Savia");
  });
  it("incluye el tipo de piel solo cuando se indica", () => {
    expect(buildContactoMessage(input, "573001112233").text).not.toContain("Tipo de piel");
    const conPiel = buildContactoMessage({ ...input, piel: "Seca" }, "573001112233").text;
    expect(conPiel).toContain("Tipo de piel: Seca");
  });
  it("arma una url wa.me con el número dado", () => {
    const { url } = buildContactoMessage(input, "573001112233");
    expect(url.startsWith("https://wa.me/573001112233?text=")).toBe(true);
  });
});
