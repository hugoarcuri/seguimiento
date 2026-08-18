import { z } from "zod";

export const oracionSchema = z.object({
  miembro_id: z.string().uuid("Seleccioná un miembro"),
  pedido: z.string().min(1, "El pedido es requerido"),
  estado: z.enum(["pendiente", "respondida", "en_oracion"]).default("pendiente"),
});

export type OracionInput = z.infer<typeof oracionSchema>;
