import { z } from "zod";
import { DEPARTAMENTOS } from "@/content/colombia";

export const pedidoSchema = z.object({
  nombre: z.string().min(2, "Tu nombre"),
  telefono: z.string().min(7, "Teléfono válido"),
  email: z.union([z.string().email("Email válido"), z.literal("")]).optional(),
  departamento: z.enum(DEPARTAMENTOS, { message: "Selecciona un departamento" }),
  ciudad: z.string().min(2, "Ciudad"),
  direccion: z.string().min(4, "Dirección"),
  notas: z.string().optional(),
});

export type PedidoInput = z.infer<typeof pedidoSchema>;
