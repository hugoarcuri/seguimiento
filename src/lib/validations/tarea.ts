import { z } from "zod";

export const tareaSchema = z.object({
  discipulo_id: z.string().uuid("Seleccioná un discípulo"),
  titulo: z.string().min(1, "El título es requerido"),
  descripcion: z.string().optional().nullable(),
  tipo: z.enum(["lectura", "memorizacion", "preguntas", "practica"]),
  fecha_limite: z.string().optional().nullable(),
});

export type TareaInput = z.infer<typeof tareaSchema>;
