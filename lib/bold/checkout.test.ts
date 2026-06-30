import { describe, expect, it, vi } from "vitest";
import { crearLinkPago } from "./checkout";

function okResponse(payload: unknown): Response {
  return { ok: true, json: async () => ({ payload }) } as Response;
}

const base = {
  apiKey: "id_key",
  amountCop: 49000,
  reference: "uuid-1",
  description: "Pedido Savia SAVIA-7X2K",
  callbackUrl: "https://savia.co/pedido/resultado?pedido=uuid-1",
};

describe("crearLinkPago", () => {
  it("devuelve la url cuando Bold responde ok", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      okResponse({ url: "https://checkout.bold.co/LNK_1", payment_link: "LNK_1" }),
    );
    const res = await crearLinkPago(base, fetchFn as unknown as typeof fetch);
    expect(res).toEqual({ ok: true, url: "https://checkout.bold.co/LNK_1", paymentLink: "LNK_1" });
  });

  it("envía COP sin convertir a centavos, métodos y auth correctos", async () => {
    const fetchFn = vi.fn().mockResolvedValue(okResponse({ url: "u", payment_link: "LNK_1" }));
    await crearLinkPago(base, fetchFn as unknown as typeof fetch);
    const [endpoint, init] = fetchFn.mock.calls[0]!;
    expect(endpoint).toBe("https://integrations.api.bold.co/online/link/v1");
    const sent = JSON.parse((init as RequestInit).body as string);
    expect(sent.amount.total_amount).toBe(49000);
    expect(sent.amount.currency).toBe("COP");
    expect(sent.amount_type).toBe("CLOSE");
    expect(sent.payment_methods).toEqual(["CREDIT_CARD", "PSE", "NEQUI"]);
    expect((init as RequestInit).headers).toMatchObject({ Authorization: "x-api-key id_key" });
  });

  it("devuelve error cuando Bold responde con error http", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) } as Response);
    const res = await crearLinkPago(base, fetchFn as unknown as typeof fetch);
    expect(res.ok).toBe(false);
  });

  it("devuelve error cuando falta la url en la respuesta", async () => {
    const fetchFn = vi.fn().mockResolvedValue(okResponse({ payment_link: "LNK_1" }));
    const res = await crearLinkPago(base, fetchFn as unknown as typeof fetch);
    expect(res.ok).toBe(false);
  });
});
