import type { ComponentType } from "react";
import { Book, Users, Hand, Target, GraduationCap, Crown } from "lucide-react";

export interface AreaMeta {
  label: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
}

export const areasMeta: Record<number, AreaMeta> = {
  1: { label: "Vida Devocional", icon: Book, color: "hsl(var(--chart-1))" },
  4: { label: "Comunión", icon: Users, color: "hsl(var(--chart-4))" },
  5: { label: "Servicio", icon: Hand, color: "hsl(var(--chart-5))" },
  6: { label: "Evangelismo", icon: Target, color: "hsl(var(--chart-6))" },
  7: { label: "Discipulado", icon: GraduationCap, color: "hsl(var(--chart-7))" },
  8: { label: "Liderazgo", icon: Crown, color: "hsl(var(--chart-8))" },
};

export const opcionesIndicador: Record<string, { type: "escala" | "si_no"; labels: string[] }> = {
  Oración: { type: "escala", labels: ["Nunca", "1-2 veces", "3-4 veces", "5-6 veces", "Todos los días"] },
  "Lectura bíblica": { type: "escala", labels: ["Nunca", "1-2 días", "3-4 días", "5-6 días", "Todos los días"] },
  "Memorización bíblica": { type: "escala", labels: ["No memoriza", "1 versículo", "2-3 versículos", "4-5 versículos", "6+ versículos"] },
  "Asistencia al culto": { type: "escala", labels: ["Nunca", "1 vez/mes", "2 veces/mes", "3 veces/mes", "Siempre"] },
  "Asistencia al grupo pequeño": { type: "escala", labels: ["Nunca", "Casi nunca", "A veces", "Frecuentemente", "Siempre"] },
  "Relación con la autoridad": { type: "escala", labels: ["No acepta", "Se resiste", "A veces", "Acepta", "Ejemplar"] },
  "Integración con la iglesia": { type: "escala", labels: ["No integrado", "Poco", "A veces", "Integrado", "Muy integrado"] },
  "Participa en un ministerio": { type: "si_no", labels: ["No", "Sí"] },
  "Sirvió esta semana": { type: "si_no", labels: ["No", "Sí"] },
  "Comparte el evangelio": { type: "si_no", labels: ["No", "Sí"] },
  "Comparte su testimonio": { type: "si_no", labels: ["No", "Sí"] },
  "Invita personas": { type: "si_no", labels: ["No", "Sí"] },
  "Ora por inconversos": { type: "si_no", labels: ["No", "Sí"] },
  "Seguimiento de nuevos": { type: "si_no", labels: ["No", "Sí"] },
  "Recibe discipulado": { type: "si_no", labels: ["No", "Sí"] },
  "Discipula a otros": { type: "si_no", labels: ["No", "Sí"] },
  "Acompaña nuevos": { type: "si_no", labels: ["No", "Sí"] },
};

export const defaultOpts = ["1", "2", "3", "4", "5"];

export const desafiosPredefinidos = [
  "Orar diariamente",
  "Leer Juan capítulos 1 al 5",
  "Participar del grupo pequeño",
  "Servir el próximo domingo",
  "Evangelizar a un amigo",
  "Memorizar Efesios 2:8-9",
];

export const ministerios = ["Club Bíblico", "Escuela Dominical", "JH", "Enfoque", "Alabanza"];

export const paresEvaluacion = ["Vida Devocional y Comunión", "Servicio y Evangelismo", "Observaciones y Desafíos"];

export const ESCALA_MAX = 5;
export const MES_ESCALA = 20;

export const pctPromedio = (promedio: number) => Math.round((promedio / ESCALA_MAX) * 100);

export const fmtLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const inicioSemana = (d: Date) => {
  const copy = new Date(d);
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const esSemanaDe = (fecha: string, ref: Date) =>
  fmtLocal(inicioSemana(new Date(fecha + "T12:00:00"))) === fmtLocal(inicioSemana(ref));

export interface SupabaseUser {
  id: string;
  email?: string;
  rol?: string;
}

export interface SupabaseDiscipulo {
  id: string;
  nombre: string;
  apellido: string;
  etapa_id: number;
  etapas?: { nombre: string };
}

export interface SupabaseArea {
  id: number;
  nombre: string;
  orden: number;
}

export interface SupabaseIndicador {
  id: number;
  area_id: number;
  nombre: string;
  orden: number;
}

export interface SupabaseEvaluacion {
  id?: string;
  reunion_id: string;
  indicador_id: number;
  valor: number | null;
  no_evaluado?: boolean;
  observaciones?: string | null;
}

export interface SupabaseReunion {
  id: string;
  discipulo_id: string;
  fecha: string;
  observaciones_generales?: string;
  compromisos?: string;
  proxima_reunion?: string;
  evaluaciones?: SupabaseEvaluacion[];
}

export interface SupabaseDesafio {
  id: string;
  discipulo_id: string;
  descripcion: string;
  estado: string;
  fecha_asignado?: string;
}

export interface SupabaseAlerta {
  id: string;
  discipulo_id: string;
  mensaje: string;
  activa: boolean;
}
