export interface MiembroRaw {
  id: string;
  nombre: string;
  apellido: string;
  avatar_url?: string | null;
  lider_id?: string | null;
  etapa_id: number;
  estado: string;
  bautizado?: boolean | null;
  es_miembro?: boolean | null;
  created_at: string;
}

export interface SeguimientoRaw {
  id: string;
  miembro_id: string;
  discipulador_id?: string;
  etapa?: number;
  progreso: number | null;
  estado: string;
}

export interface AgendaRaw {
  id: string;
  miembro_id: string;
  lider_id?: string;
  fecha: string;
  hora?: string | null;
  tema_tratado?: string | null;
  realizada?: boolean | null;
  miembros?: { nombre: string; apellido: string } | null;
}

export interface TareaRaw {
  id: string;
  miembro_id: string;
  lider_id?: string;
  titulo: string;
  tipo?: string;
  estado: string;
  fecha_limite?: string | null;
  completed_at?: string | null;
  created_at?: string;
}

export interface PerfilRaw {
  id: string;
  nombre: string;
  apellido: string;
}

export interface ObjetivoRaw {
  id: string;
  seguimiento_id: string;
  descripcion: string;
  completado: boolean;
  fecha_cumplimiento?: string | null;
  created_at?: string;
}

export interface DiscipuladorRaw {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  avatar_url?: string | null;
}

export const BUCKET_DIAS: Record<string, number> = {
  "7d": 1,
  "30d": 1,
  "90d": 7,
  todo: 30,
};
