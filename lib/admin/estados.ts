export const ESTADOS = [
  "nuevo",
  "confirmado",
  "preparando",
  "empacado",
  "enviado",
  "entregado",
  "finalizado",
  "cancelado",
] as const;
export type EstadoPedido = (typeof ESTADOS)[number];

// Progreso lineal del pedido (cancelado queda fuera del flujo).
export const FLUJO: EstadoPedido[] = [
  "nuevo",
  "confirmado",
  "preparando",
  "empacado",
  "enviado",
  "entregado",
  "finalizado",
];

export function esEstadoValido(value: string): value is EstadoPedido {
  return (ESTADOS as readonly string[]).includes(value);
}

export const ESTADO_LABEL: Record<EstadoPedido, string> = {
  nuevo: "Nuevo",
  confirmado: "Confirmado",
  preparando: "Preparando",
  empacado: "Empacado",
  enviado: "Enviado",
  entregado: "Entregado",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

// Color del punto de estado (semántico, no token de marca) + emoji para el dashboard.
export const ESTADO_UI: Record<EstadoPedido, { dot: string; emoji: string }> = {
  nuevo: { dot: "bg-amber-500", emoji: "🟡" },
  confirmado: { dot: "bg-green-500", emoji: "🟢" },
  preparando: { dot: "bg-blue-500", emoji: "🔵" },
  empacado: { dot: "bg-violet-500", emoji: "🟣" },
  enviado: { dot: "bg-cyan-500", emoji: "🚚" },
  entregado: { dot: "bg-emerald-600", emoji: "📦" },
  finalizado: { dot: "bg-teal-600", emoji: "✅" },
  cancelado: { dot: "bg-rose-500", emoji: "⛔" },
};

export const ESTADOS_PAGO = ["pendiente", "aprobado", "rechazado", "error"] as const;
export type EstadoPagoAdmin = (typeof ESTADOS_PAGO)[number];

export const ESTADO_PAGO_LABEL: Record<EstadoPagoAdmin, string> = {
  pendiente: "Por verificar",
  aprobado: "Pagado",
  rechazado: "Rechazado",
  error: "Error",
};

export const METODO_LABEL: Record<"manual" | "wompi", string> = {
  manual: "Nequi",
  wompi: "Wompi",
};
