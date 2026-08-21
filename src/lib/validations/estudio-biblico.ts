import { z } from "zod";

export const seccionContenidoSchema = z.object({
  tipo: z.enum(["titulo", "subtitulo", "texto", "referencia"]),
  valor: z.string().min(1, "El contenido es requerido"),
});

export const preguntaEstudioSchema = z.object({
  enunciado: z.string().min(1, "El enunciado es requerido"),
  tipo: z.enum(["texto_libre", "opcion_multiple"]),
  opciones: z.array(z.string()).optional(),
});

export const guiaDiscipuladorSchema = z.object({
  objetivo: z.string(),
  puntosClave: z.array(z.string()),
  consejos: z.array(z.string()),
  preguntas: z.array(z.string()),
});

export const estudioBiblicoSchema = z.object({
  numero: z.number().min(1, "El número es requerido"),
  etapa_id: z.number().min(1, "Seleccioná una etapa"),
  titulo: z.string().min(1, "El título es requerido"),
  descripcion: z.string().min(1, "La descripción es requerida"),
  contenido: z.array(seccionContenidoSchema).min(1, "Agregá al menos una sección de contenido"),
  preguntas: z.array(preguntaEstudioSchema).min(1, "Agregá al menos una pregunta"),
  guia: guiaDiscipuladorSchema,
  activo: z.boolean(),
});

export type EstudioBiblicoInput = z.infer<typeof estudioBiblicoSchema>;
