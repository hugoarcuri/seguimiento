import type { ComponentType } from "react";
import { Smile, Home, GraduationCap, Briefcase, Heart, Sparkles, Hand } from "lucide-react";

export interface AreaMeta {
  label: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
}

export const areasMeta: Record<number, AreaMeta> = {
  1: { label: "Vida Personal", icon: Smile, color: "hsl(var(--chart-1))" },
  2: { label: "Vida Familiar", icon: Home, color: "hsl(var(--chart-2))" },
  3: { label: "Estudios", icon: GraduationCap, color: "hsl(var(--chart-3))" },
  4: { label: "Trabajo", icon: Briefcase, color: "hsl(var(--chart-4))" },
  5: { label: "Relación con Dios", icon: Heart, color: "hsl(var(--chart-5))" },
  6: { label: "Carácter Cristiano", icon: Sparkles, color: "hsl(var(--chart-6))" },
  7: { label: "Servicio Cristiano", icon: Hand, color: "hsl(var(--chart-7))" },
};

export interface EscalaNivel {
  valor: number;
  label: string;
  ayuda: string;
  cls: string;
  dotCls: string;
}

export const escalaCrecimiento: EscalaNivel[] = [
  {
    valor: 0,
    label: "Necesita atención",
    ayuda: "Requiere acompañamiento esta semana",
    cls: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800",
    dotCls: "bg-amber-500",
  },
  {
    valor: 1,
    label: "En desarrollo",
    ayuda: "Avanza, con altibajos",
    cls: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dotCls: "bg-slate-400 dark:bg-slate-500",
  },
  {
    valor: 2,
    label: "Bien",
    ayuda: "Saludable y consistente",
    cls: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800",
    dotCls: "bg-emerald-500",
  },
];

export const labelEscala = (v?: number | null) =>
  v === null || v === undefined ? undefined : escalaCrecimiento[v]?.label;

export interface SeccionTracker {
  id: string;
  titulo: string;
  descripcion: string;
  areaIds: number[];
  condicional?: boolean;
}

export const seccionesTracker: SeccionTracker[] = [
  { id: "personal", titulo: "Vida Personal", descripcion: "Bienestar, salud, tiempo y hábitos", areaIds: [1] },
  { id: "familiar", titulo: "Vida Familiar", descripcion: "Relaciones y clima en el hogar", areaIds: [2] },
  { id: "estudios_trabajo", titulo: "Estudios / Trabajo", descripcion: "Actividad académica y laboral", areaIds: [3, 4], condicional: true },
  { id: "espiritual", titulo: "Vida Espiritual", descripcion: "Relación con Dios, carácter y servicio", areaIds: [5, 6, 7] },
];

export const desafiosPredefinidos = [
  "Orar diariamente",
  "Leer Juan capítulos 1 al 5",
  "Participar del grupo pequeño",
  "Servir el próximo domingo",
  "Evangelizar a un amigo",
  "Memorizar Efesios 2:8-9",
  "Seguir estudiando",
  "Encontrar trabajo",
];

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
  avatar_url?: string | null;
  estado?: string | null;
  meta_actual?: string | null;
  meta_actual_desde?: string | null;
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
  condicion?: string | null;
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
