import { describe, expect, it } from "vitest";
import { buildWompiCheckoutUrl } from "./checkout";

describe("buildWompiCheckoutUrl", () => {
  it("arma la URL del checkout con todos los parámetros obligatorios", () => {
    const url = buildWompiCheckoutUrl({
      publicKey: "pub_test_123",
      amountInCents: 4900000,
      reference: "uuid-1",
      redirectUrl: "https://savia.co/pedido/resultado?pedido=uuid-1",
      signature: "abc123",
    });
    expect(url.startsWith("https://checkout.wompi.co/p/?")).toBe(true);
    expect(url).toContain("public-key=pub_test_123");
    expect(url).toContain("currency=COP");
    expect(url).toContain("amount-in-cents=4900000");
    expect(url).toContain("reference=uuid-1");
    expect(url).toContain(encodeURIComponent("abc123"));
    expect(url).toContain(encodeURIComponent("https://savia.co/pedido/resultado?pedido=uuid-1"));
  });

  it("incluye datos del cliente solo cuando se proporcionan", () => {
    const sin = buildWompiCheckoutUrl({
      publicKey: "k", amountInCents: 100, reference: "r", redirectUrl: "u", signature: "s",
    });
    expect(sin).not.toContain("customer-data");
    const con = buildWompiCheckoutUrl({
      publicKey: "k", amountInCents: 100, reference: "r", redirectUrl: "u", signature: "s",
      customer: { fullName: "Ana", email: "a@b.co", phone: "3001112233" },
    });
    expect(con).toContain(encodeURIComponent("Ana"));
    expect(con).toContain("customer-data%3Aemail=a%40b.co");
  });
});
