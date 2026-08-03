import type { ComponentType } from "react";
import { Heart, Home, GraduationCap, Briefcase, Sparkles } from "lucide-react";

export interface AreaMeta {
  label: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  emoji: string;
}

export const areaEmocional = 8;
export const areaFamiliar = 9;
export const areaEstudios = 10;
export const areaTrabajo = 11;
export const areaEspiritual = 12;

export const areasMeta: Record<number, AreaMeta> = {
  8: { label: "Vida emocional", icon: Heart, color: "hsl(var(--chart-1))", emoji: "❤️" },
  9: { label: "Vida familiar", icon: Home, color: "hsl(var(--chart-2))", emoji: "🏠" },
  10: { label: "Estudios", icon: GraduationCap, color: "hsl(var(--chart-3))", emoji: "🎓" },
  11: { label: "Trabajo", icon: Briefcase, color: "hsl(var(--chart-4))", emoji: "💼" },
  12: { label: "Vida espiritual", icon: Sparkles, color: "hsl(var(--chart-5))", emoji: "✝" },
};

export interface EscalaNivel {
  valor: number;
  label: string;
  emoji: string;
  ayuda: string;
  cls: string;
  dotCls: string;
}

export const escalaEvolucion: EscalaNivel[] = [
  {
    valor: 2,
    label: "Creciendo",
    emoji: "📈",
    ayuda: "Evolucionando positivamente esta semana",
    cls: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800",
    dotCls: "bg-emerald-500",
  },
  {
    valor: 1,
    label: "Estable",
    emoji: "➡️",
    ayuda: "Sin cambios significativos",
    cls: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dotCls: "bg-slate-400 dark:bg-slate-500",
  },
  {
    valor: 0,
    label: "En desafío",
    emoji: "📉",
    ayuda: "Necesita acompañamiento",
    cls: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800",
    dotCls: "bg-amber-500",
  },
];

export const escalaPorValor = (v?: number | null) =>
  v === null || v === undefined ? undefined : escalaEvolucion.find((e) => e.valor === v);

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

export const numeroSemana = (fecha: string): number => {
  const date = new Date(fecha + "T12:00:00");
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
};

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
  evaluaciones?: SupabaseEvaluacion[];
}