import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { verificarFirmaEvento, mapEstadoPago, type WompiEvent } from "./webhook";

const SECRET = "events_secret";

function eventoConChecksum(status: string): WompiEvent {
  const base = {
    event: "transaction.updated",
    data: { transaction: { id: "txn_1", status, reference: "uuid-1", amount_in_cents: 4900000 } },
    signature: { properties: ["transaction.id", "transaction.status", "transaction.amount-in-cents"], checksum: "" },
    timestamp: 1700000000,
  } as WompiEvent;
  // checksum = sha256( valores de las properties + timestamp + secreto )
  const concat = "txn_1" + status + 4900000 + base.timestamp + SECRET;
  base.signature.checksum = createHash("sha256").update(concat).digest("hex");
  return base;
}

describe("verificarFirmaEvento", () => {
  it("acepta un evento con checksum válido", () => {
    expect(verificarFirmaEvento(eventoConChecksum("APPROVED"), SECRET)).toBe(true);
  });

  it("rechaza un evento manipulado", () => {
    const ev = eventoConChecksum("APPROVED");
    ev.data.transaction.amount_in_cents = 1; // manipulación
    expect(verificarFirmaEvento(ev, SECRET)).toBe(false);
  });
});

describe("mapEstadoPago", () => {
  it("mapea los estados de Wompi a los nuestros", () => {
    expect(mapEstadoPago("APPROVED")).toBe("aprobado");
    expect(mapEstadoPago("DECLINED")).toBe("rechazado");
    expect(mapEstadoPago("VOIDED")).toBe("rechazado");
    expect(mapEstadoPago("ERROR")).toBe("error");
    expect(mapEstadoPago("PENDING")).toBe("pendiente");
  });
});
