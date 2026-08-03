import { z } from "zod";

export const discipuloSchema = z.object({
  apellido: z.string().min(1, "El apellido es requerido"),
  nombre: z.string().min(1, "El nombre es requerido"),
  fecha_nacimiento: z.string().optional().nullable(),
  sexo: z.enum(["M", "F"]).optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().or(z.literal("")).nullable(),
  direccion: z.string().optional().nullable(),
  fecha_conversion: z.string().optional().nullable(),
  fecha_bautismo: z.string().optional().nullable(),
  bautizado: z.boolean().optional(),
  es_miembro: z.boolean().optional(),
  etapa_id: z.number().min(1, "Seleccioná una etapa"),
  estado: z.enum(["activo", "pausado", "completado", "retirado"]),
  ministerio: z.string().optional().nullable(),
  dones: z.string().optional().nullable(),
  avatar_url: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
  convive_con: z.string().optional().nullable(),
});

export type DiscipuloInput = z.infer<typeof discipuloSchema>;
