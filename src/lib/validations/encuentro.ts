import { z } from "zod";

export const encuentroSchema = z.object({
  discipulo_id: z.string().uuid("Seleccione un discípulo"),
  fecha: z.string().min(1, "La fecha es requerida"),
  hora: z.string().optional().nullable(),
  lugar: z.string().optional().nullable(),
  tema_tratado: z.string().min(1, "El tema es requerido"),
  material_utilizado: z.string().optional().nullable(),
  compromisos: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
  proximo_encuentro: z.string().optional().nullable(),
});

export type EncuentroInput = z.infer<typeof encuentroSchema>;
