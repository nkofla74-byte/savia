export type CrearLinkPagoParams = {
  apiKey: string;
  amountCop: number;
  reference: string;
  description: string;
  callbackUrl: string;
  payerEmail?: string;
  expirationMs?: number; // epoch ms de expiración; default now + 1h
};

export type CrearLinkPagoResult =
  | { ok: true; url: string; paymentLink: string }
  | { ok: false; error: string };

const BOLD_LINK_ENDPOINT = "https://integrations.api.bold.co/online/link/v1";

export async function crearLinkPago(
  p: CrearLinkPagoParams,
  fetchFn: typeof fetch = fetch,
): Promise<CrearLinkPagoResult> {
  const expMs = p.expirationMs ?? Date.now() + 60 * 60 * 1000;
  const body = {
    amount_type: "CLOSE",
    amount: { currency: "COP", total_amount: p.amountCop },
    reference: p.reference,
    description: p.description,
    callback_url: p.callbackUrl,
    payment_methods: ["CREDIT_CARD", "PSE", "NEQUI"],
    expiration_date: expMs * 1_000_000, // Bold espera nanosegundos
    ...(p.payerEmail ? { payer_email: p.payerEmail } : {}),
  };

  let res: Response;
  try {
    res = await fetchFn(BOLD_LINK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `x-api-key ${p.apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: "No se pudo conectar con la pasarela de pago." };
  }

  if (!res.ok) {
    return { ok: false, error: "La pasarela de pago rechazó la solicitud." };
  }

  const json = (await res.json()) as {
    payload?: { url?: string; payment_link?: string };
  };
  const url = json.payload?.url;
  const paymentLink = json.payload?.payment_link;
  if (!url || !paymentLink) {
    return { ok: false, error: "La pasarela no devolvió un link de pago válido." };
  }
  return { ok: true, url, paymentLink };
}
