import { createHmac, timingSafeEqual } from "node:crypto";

export type BoldEvent = {
  id: string;
  type: string;
  subject?: string;
  data: {
    payment_id?: string;
    amount?: { currency: string; total: number };
    metadata?: { reference?: string };
    payment_method?: string;
  };
};

export type EstadoPago = "aprobado" | "rechazado" | "pendiente" | "error";

// Firma de Bold: HMAC-SHA256 (hex) de base64(body crudo) con la llave secreta.
// En modo pruebas Bold usa una clave vacía. Confirmar contra la doc vigente.
export function verificarFirmaBold(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) return false;
  const encoded = Buffer.from(rawBody, "utf8").toString("base64");
  const calculado = createHmac("sha256", secret).update(encoded).digest("hex");
  const a = Buffer.from(calculado);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function mapEstadoPagoBold(type: string): EstadoPago {
  switch (type) {
    case "SALE_APPROVED":
      return "aprobado";
    case "SALE_REJECTED":
    case "VOID_APPROVED":
      return "rechazado";
    default:
      return "pendiente";
  }
}
