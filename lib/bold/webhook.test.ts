import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { verificarFirmaBold, mapEstadoPagoBold } from "./webhook";

const SECRET = "bold_secret";

function firmar(body: string, secret: string): string {
  const encoded = Buffer.from(body, "utf8").toString("base64");
  return createHmac("sha256", secret).update(encoded).digest("hex");
}

describe("verificarFirmaBold", () => {
  const body = JSON.stringify({ type: "SALE_APPROVED", data: { metadata: { reference: "uuid-1" } } });

  it("acepta una firma válida", () => {
    expect(verificarFirmaBold(body, firmar(body, SECRET), SECRET)).toBe(true);
  });

  it("rechaza una firma inválida", () => {
    expect(verificarFirmaBold(body, firmar(body, "otro"), SECRET)).toBe(false);
  });

  it("rechaza cuando falta la firma", () => {
    expect(verificarFirmaBold(body, null, SECRET)).toBe(false);
  });

  it("acepta firma con secreto vacío (modo pruebas de Bold)", () => {
    expect(verificarFirmaBold(body, firmar(body, ""), "")).toBe(true);
  });
});

describe("mapEstadoPagoBold", () => {
  it("mapea los tipos de Bold a nuestros estados", () => {
    expect(mapEstadoPagoBold("SALE_APPROVED")).toBe("aprobado");
    expect(mapEstadoPagoBold("SALE_REJECTED")).toBe("rechazado");
    expect(mapEstadoPagoBold("VOID_APPROVED")).toBe("rechazado");
    expect(mapEstadoPagoBold("VOID_REJECTED")).toBe("pendiente");
  });
});
