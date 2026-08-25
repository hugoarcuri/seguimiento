export type UserRole = "admin" | "discipulador" | "miembro" | "discipulo";

export interface Profile {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: UserRole;
  telefono?: string;
  avatar_url?: string;
  fecha_nacimiento?: string;
  fecha_conversion?: string;
  don_espiritual?: string;
  fortalezas?: string;
  debilidades?: string;
  created_at: string;
  updated_at: string;
}

export interface Miembro {
  id: string;
  user_id?: string | null;
  lider_id?: string | null;
  apellido: string;
  nombre: string;
  fecha_nacimiento?: string;
  sexo?: "M" | "F";
  telefono?: string;
  email?: string;
  direccion?: string;
  fecha_conversion?: string;
  fecha_bautismo?: string;
  bautizado?: boolean;
  es_miembro?: boolean;
  etapa_id: number;
  estado: "activo" | "pausado" | "completado" | "retirado";
  ministerio?: string;
  dones?: string;
  avatar_url?: string;
  observaciones?: string;
  convive_con?: string;
  estudia?: string;
  trabaja?: string;
  created_at: string;
  updated_at: string;
}

export interface Agenda {
  id: string;
  miembro_id: string;
  lider_id: string;
  fecha: string;
  hora: string;
  lugar: string;
  tema_tratado: string;
  material_utilizado?: string;
  compromisos?: string;
  notas?: string;
  proximo_encuentro?: string;
  realizada?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Oracion {
  id: string;
  miembro_id: string;
  lider_id: string;
  fecha: string;
  pedido: string;
  respuesta?: string;
  estado: "pendiente" | "respondida" | "en_oracion";
  created_at: string;
  updated_at: string;
}

export interface Tarea {
  id: string;
  miembro_id: string;
  lider_id: string;
  titulo: string;
  descripcion?: string;
  tipo: "lectura" | "memorizacion" | "preguntas" | "practica";
  estado: "pendiente" | "completada" | "vencida";
  fecha_limite?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Timeline {
  id: string;
  miembro_id: string;
  tipo: string;
  descripcion: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Etapa {
  id: number;
  nombre: string;
  descripcion?: string | null;
  orden: number;
  objetivos: string[] | null;
  material_recomendado?: string | null;
}

export interface Seguimiento {
  id: string;
  miembro_id: string;
  discipulador_id: string;
  etapa: number;
  progreso: number;
  estado: "activo" | "pausado";
  fecha_inicio: string;
  ultima_actualizacion: string;
  created_at: string;
  updated_at: string;
}

export interface SeguimientoEvaluacion {
  id: string;
  seguimiento_id: string;
  fecha: string;
  relacion_dios?: string | null;
  habitos_pecaminosos?: string | null;
  don_espiritual?: string | null;
  ministerio?: string | null;
  relacion_autoridad?: string | null;
  estudia?: string | null;
  trabaja?: string | null;
  convive_con?: string | null;
}

export interface SeguimientoObjetivo {
  id: string;
  seguimiento_id: string;
  descripcion: string;
  completado: boolean;
  fecha_cumplimiento?: string | null;
  created_at: string;
  es_habito?: boolean;
}

export interface SeguimientoObservacion {
  id: string;
  seguimiento_id: string;
  usuario: string;
  fecha: string;
  comentario: string;
}

export interface SeguimientoHistorial {
  id: string;
  seguimiento_id: string;
  fecha: string;
  tipo: "etapa" | "evaluacion" | "objetivo" | "observacion";
  descripcion: string;
}

export interface EstudioBiblicoRespuesta {
  id: string;
  miembro_id: string;
  estudio_numero: number;
  pregunta_index: number;
  respuesta: string;
  created_at: string;
  updated_at: string;
}

export interface EstudioBiblicoProgreso {
  id: string;
  miembro_id: string;
  estudio_numero: number;
  completado: boolean;
  completado_en: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeccionContenido {
  tipo: "titulo" | "subtitulo" | "texto" | "referencia";
  valor: string;
}

export interface PreguntaEstudio {
  enunciado: string;
  tipo: "texto_libre" | "opcion_multiple";
  opciones?: string[];
}

export interface GuiaDiscipulador {
  objetivo: string;
  puntosClave: string[];
  consejos: string[];
  preguntas: string[];
}

export interface EstudioBiblico {
  id: string;
  numero: number;
  etapa_id: number;
  titulo: string;
  descripcion: string;
  contenido: SeccionContenido[];
  preguntas: PreguntaEstudio[];
  guia: GuiaDiscipulador;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface PasoEstudio {
  numero: number;
  etapaId: number;
  titulo: string;
  descripcion: string;
  contenido: SeccionContenido[];
  preguntas: PreguntaEstudio[];
  guia: GuiaDiscipulador;
}
