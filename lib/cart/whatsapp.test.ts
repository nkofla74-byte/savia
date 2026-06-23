import { describe, expect, it } from "vitest";
import { buildWhatsAppMessage } from "./whatsapp";
import type { CartItem } from "./store";

const items: CartItem[] = [
  { slug: "calma", nombre: "Calma", precioCOP: 13900, qty: 2 },
  { slug: "luz", nombre: "Luz", precioCOP: 21900, qty: 1 },
];
const customer = {
  nombre: "Ana",
  telefono: "3001112233",
  departamento: "Antioquia",
  ciudad: "Medellín",
  direccion: "Calle 1 #2-3",
};

describe("buildWhatsAppMessage", () => {
  it("includes items, customer, subtotal, reference, departamento and ciudad", () => {
    const { text } = buildWhatsAppMessage(items, customer, "573001112233", "SAVIA-7X2K");
    expect(text).toContain("Calma x2");
    expect(text).toContain("Luz x1");
    expect(text).toContain("Ana");
    expect(text).toContain("Antioquia");
    expect(text).toContain("Medellín");
    expect(text).toContain("$49.700"); // 2*13900 + 21900
    expect(text).toContain("SAVIA-7X2K");
  });

  it("builds a wa.me url with encoded text and the given number", () => {
    const { url } = buildWhatsAppMessage(items, customer, "573001112233", "SAVIA-7X2K");
    expect(url.startsWith("https://wa.me/573001112233?text=")).toBe(true);
    expect(url).toContain(encodeURIComponent("Calma x2"));
    expect(url).toContain(encodeURIComponent("SAVIA-7X2K"));
  });

  it("omits optional fields when not provided", () => {
    const { text } = buildWhatsAppMessage(
      [items[0]!],
      { nombre: "Beto", telefono: "3000000000", ciudad: "Cali", direccion: "Cra 5" },
      "573001112233",
      "SAVIA-AAAA",
    );
    expect(text).not.toContain("Departamento:");
    expect(text).not.toContain("Email:");
    expect(text).not.toContain("Notas:");
  });
});
