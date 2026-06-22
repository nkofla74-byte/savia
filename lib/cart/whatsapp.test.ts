import { describe, expect, it } from "vitest";
import { buildWhatsAppMessage } from "./whatsapp";
import type { CartItem } from "./store";

const items: CartItem[] = [
  { slug: "calma", nombre: "Calma", precioCOP: 13900, qty: 2 },
  { slug: "luz", nombre: "Luz", precioCOP: 21900, qty: 1 },
];
const customer = { nombre: "Ana", telefono: "3001112233", ciudad: "Bogotá", direccion: "Calle 1 #2-3" };

describe("buildWhatsAppMessage", () => {
  it("includes each item, qty, customer and subtotal", () => {
    const { text } = buildWhatsAppMessage(items, customer, "573001112233");
    expect(text).toContain("Calma x2");
    expect(text).toContain("Luz x1");
    expect(text).toContain("Ana");
    expect(text).toContain("Bogotá");
    expect(text).toContain("$49.700"); // 2*13900 + 21900
  });
  it("builds a wa.me url with encoded text and the given number", () => {
    const { url } = buildWhatsAppMessage(items, customer, "573001112233");
    expect(url.startsWith("https://wa.me/573001112233?text=")).toBe(true);
    expect(url).toContain(encodeURIComponent("Calma x2"));
  });
});
