import { z } from "zod";

export const seguimientoSchema = z.object({
  miembro_id: z.string().uuid("Seleccioná un miembro"),
  discipulador_id: z.string().uuid("Seleccioná un discipulador"),
  etapa: z.number().min(1, "La etapa es requerida").max(5),
  fecha_inicio: z.string().min(1, "La fecha es requerida"),
});

export type SeguimientoInput = z.infer<typeof seguimientoSchema>;
