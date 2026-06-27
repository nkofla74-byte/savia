import { createHash } from "node:crypto";

// Firma de integridad del Web Checkout de Wompi:
// SHA-256(hex) de la concatenación referencia + montoEnCentavos + moneda + secreto.
// Confirmar el formato contra la documentación vigente de Wompi al integrar.
export function firmaIntegridad(
  referencia: string,
  montoEnCentavos: number,
  moneda: string,
  secreto: string,
): string {
  return createHash("sha256")
    .update(`${referencia}${montoEnCentavos}${moneda}${secreto}`)
    .digest("hex");
}
