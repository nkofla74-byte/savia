import type { ContactoInput } from "./schema";

export function buildContactoMessage(input: ContactoInput, whatsappNumber: string) {
  const lines = [
    "🌿 Nuevo mensaje desde Savia",
    "",
    `Nombre: ${input.nombre}`,
    `WhatsApp: ${input.telefono}`,
    ...(input.email ? [`Email: ${input.email}`] : []),
    `Motivo: ${input.motivo}`,
    ...(input.piel ? [`Tipo de piel: ${input.piel}`] : []),
    "",
    "Mensaje:",
    input.mensaje,
  ];
  const text = lines.join("\n");
  const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  return { text, url };
}
