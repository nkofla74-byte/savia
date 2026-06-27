// Tarifa fija de envío nacional (COP enteros). Único lugar de la verdad.
export const ENVIO_COP = 12000;

export function calcularTotal(subtotalCop: number): number {
  return subtotalCop + ENVIO_COP;
}
