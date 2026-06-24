export const ESTADOS = ["nuevo", "confirmado", "enviado", "entregado", "cancelado"] as const;
export type EstadoPedido = (typeof ESTADOS)[number];

export function esEstadoValido(value: string): value is EstadoPedido {
  return (ESTADOS as readonly string[]).includes(value);
}

export const ESTADO_LABEL: Record<EstadoPedido, string> = {
  nuevo: "Nuevo",
  confirmado: "Confirmado",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};
