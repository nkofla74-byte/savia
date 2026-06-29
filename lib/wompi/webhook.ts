import { createHash } from "node:crypto";

export type WompiEvent = {
  event: string;
  data: {
    transaction: {
      id: string;
      status: string;
      reference: string;
      amount_in_cents: number;
    };
  };
  signature: { properties: string[]; checksum: string };
  timestamp: number;
};

export type EstadoPago = "aprobado" | "rechazado" | "pendiente" | "error";

// El checksum de Wompi es el SHA-256 de: los valores de cada property indicada
// (en orden) + el timestamp + el secreto de eventos. Las properties vienen como
// "transaction.id" / "transaction.amount-in-cents"; el guion se normaliza a guion
// bajo para leer del objeto. Confirmar el formato contra la doc vigente de Wompi.
export function verificarFirmaEvento(event: WompiEvent, secret: string): boolean {
  if (!event?.signature?.checksum || !secret) return false;
  const concat = event.signature.properties
    .map((path) => leerRuta(event.data, path))
    .join("");
  const cadena = `${concat}${event.timestamp}${secret}`;
  const calculado = createHash("sha256").update(cadena).digest("hex");
  return calculado.toLowerCase() === event.signature.checksum.toLowerCase();
}

function leerRuta(obj: unknown, path: string): string {
  const value = path
    .split(".")
    .map((k) => k.replace(/-/g, "_"))
    .reduce<unknown>((acc, key) => {
      if (acc && typeof acc === "object" && key in acc) {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  return String(value ?? "");
}

export function mapEstadoPago(status: string): EstadoPago {
  switch (status) {
    case "APPROVED":
      return "aprobado";
    case "DECLINED":
    case "VOIDED":
      return "rechazado";
    case "ERROR":
      return "error";
    default:
      return "pendiente";
  }
}
