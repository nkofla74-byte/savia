export type WompiCheckoutParams = {
  publicKey: string;
  amountInCents: number;
  reference: string;
  redirectUrl: string;
  signature: string;
  currency?: string;
  customer?: { fullName?: string; email?: string; phone?: string };
};

export function buildWompiCheckoutUrl(p: WompiCheckoutParams): string {
  const params = new URLSearchParams({
    "public-key": p.publicKey,
    currency: p.currency ?? "COP",
    "amount-in-cents": String(p.amountInCents),
    reference: p.reference,
    "signature:integrity": p.signature,
    "redirect-url": p.redirectUrl,
  });
  if (p.customer?.fullName) params.set("customer-data:full-name", p.customer.fullName);
  if (p.customer?.email) params.set("customer-data:email", p.customer.email);
  if (p.customer?.phone) params.set("customer-data:phone-number", p.customer.phone);
  return `https://checkout.wompi.co/p/?${params.toString()}`;
}
