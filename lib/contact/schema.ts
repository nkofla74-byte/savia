import { z } from "zod";

export const MOTIVOS = [
  "Recomendarme un producto",
  "Consulta sobre ingredientes",
  "Pedido o envío",
  "Otro",
] as const;

export const PIELES = ["Seca", "Mixta", "Grasa", "Sensible", "No estoy seguro/a"] as const;

export const contactoSchema = z.object({
  nombre: z.string().min(2, "¿Cómo podemos llamarte?"),
  telefono: z.string().min(7, "Tu número para responderte"),
  email: z.union([z.string().email("Email válido"), z.literal("")]).optional(),
  motivo: z.enum(MOTIVOS, { error: "Cuéntanos en qué podemos ayudarte" }),
  piel: z.enum(PIELES).optional(),
  mensaje: z.string().min(5, "Cuéntanos un poco más"),
});

export type ContactoInput = z.infer<typeof contactoSchema>;
