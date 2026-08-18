import { z } from "zod";

export const agendaSchema = z.object({
  miembro_id: z.string().uuid("Seleccioná un miembro"),
  fecha: z.string().min(1, "La fecha es requerida"),
  hora: z.string().optional().nullable(),
  lugar: z.string().optional().nullable(),
  tema_tratado: z.string().min(1, "El tema es requerido"),
  material_utilizado: z.string().optional().nullable(),
  compromisos: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
  proximo_encuentro: z.string().optional().nullable(),
});

export type AgendaInput = z.infer<typeof agendaSchema>;
