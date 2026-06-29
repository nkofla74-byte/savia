import { ESTADO_LABEL, type EstadoPedido } from "./estados";

/** Link wa.me para contactar al cliente sobre su pedido, con mensaje pre-rellenado. */
export function waClienteHref(pedido: {
  telefono: string;
  nombre: string;
  referencia: string;
  estado: EstadoPedido;
}): string {
  const digits = pedido.telefono.replace(/\D/g, "");
  const numero = digits.startsWith("57") ? digits : `57${digits}`;
  const nombre = pedido.nombre.split(" ")[0] || pedido.nombre;
  const mensaje = `Hola ${nombre}, somos Savia 🌿. Tu pedido ${pedido.referencia} está: ${ESTADO_LABEL[pedido.estado]}.`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
