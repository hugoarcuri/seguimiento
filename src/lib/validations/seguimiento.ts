import { z } from "zod";

export const seguimientoSchema = z.object({
  discipulo_id: z.string().uuid("Seleccioná un discípulo"),
  discipulador_id: z.string().uuid("Seleccioná un discipulador"),
  etapa: z.number().min(1, "La etapa es requerida").max(5),
  estado: z.enum(["activo", "pausado"]),
  fecha_inicio: z.string().min(1, "La fecha es requerida"),
});

export type SeguimientoInput = z.infer<typeof seguimientoSchema>;