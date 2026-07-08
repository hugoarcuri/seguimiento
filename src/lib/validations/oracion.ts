import { z } from "zod";

export const oracionSchema = z.object({
  discipulo_id: z.string().uuid("Seleccione un discípulo"),
  pedido: z.string().min(1, "El pedido es requerido"),
  estado: z.enum(["pendiente", "respondida", "en_oracion"]).default("pendiente"),
});

export type OracionInput = z.infer<typeof oracionSchema>;
