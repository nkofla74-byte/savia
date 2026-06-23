import { z } from "zod";

export const contactoSchema = z.object({
  nombre: z.string().min(2, "Tu nombre"),
  telefono: z.string().min(7, "Teléfono válido"),
  email: z.union([z.string().email("Email válido"), z.literal("")]).optional(),
  asunto: z.string().min(2, "Asunto"),
  mensaje: z.string().min(5, "Cuéntanos un poco más"),
});

export type ContactoInput = z.infer<typeof contactoSchema>;
