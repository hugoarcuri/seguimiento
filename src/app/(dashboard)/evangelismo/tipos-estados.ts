import { Heart, Hand, Book, type LucideIcon } from "lucide-react";

export interface EstadoMeta {
  label: string;
  color: string;
  bgColor: string;
  icon: LucideIcon;
}

export interface PersonaData {
  id: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  edad?: number;
  observaciones?: string;
  estado: string;
  fecha_inicio_estado: string;
  fecha_creacion?: string;
  miembro_id?: string;
  creado_por?: string;
}

export interface EventoData {
  id: string;
  persona_id: string;
  tipo: string;
  descripcion: string;
  fecha: string;
}

export const estadosMeta: Record<string, EstadoMeta> = {
  oracion_salvacion: { label: "Oración por salvación", color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/40", icon: Heart },
  actos_servicio: { label: "Actos de servicio", color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/40", icon: Hand },
  predicacion_evangelio: { label: "Predicación del Evangelio", color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-100 dark:bg-emerald-900/40", icon: Book },
};

export const eventosEvangelismo = [
  "Compartí mi testimonio",
  "Compartí el Evangelio",
  "Lo invité a la iglesia",
  "Asistió",
  "Aceptó una Biblia",
  "Hicimos seguimiento",
  "Decidió seguir a Cristo",
  "No mostró interés",
  "Continuar orando",
];

export const actosServicio = [
  "Invitarlo a tomar un café",
  "Ayudarlo en una necesidad",
  "Visitarlo",
  "Compartir tiempo",
  "Escucharlo",
  "Acompañarlo",
];
