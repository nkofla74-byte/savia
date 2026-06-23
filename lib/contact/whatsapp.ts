import type { ContactoInput } from "./schema";

export function buildContactoMessage(input: ContactoInput, whatsappNumber: string) {
  const lines = [
    "🌿 Nuevo mensaje desde Savia",
    "",
    `Nombre: ${input.nombre}`,
    `Teléfono: ${input.telefono}`,
    ...(input.email ? [`Email: ${input.email}`] : []),
    `Asunto: ${input.asunto}`,
    "",
    "Mensaje:",
    input.mensaje,
  ];
  const text = lines.join("\n");
  const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  return { text, url };
}
