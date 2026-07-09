export type UserRole = "admin" | "discipulo";

export interface Profile {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: UserRole;
  telefono?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Discipulo {
  id: string;
  lider_id: string;
  apellido: string;
  nombre: string;
  dni?: string;
  fecha_nacimiento?: string;
  sexo?: "M" | "F";
  telefono?: string;
  email?: string;
  direccion?: string;
  fecha_conversion?: string;
  fecha_bautismo?: string;
  etapa_id: number;
  estado: "activo" | "pausado" | "completado" | "retirado";
  ministerio?: string;
  dones?: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface Encuentro {
  id: string;
  discipulo_id: string;
  lider_id: string;
  fecha: string;
  hora: string;
  lugar: string;
  tema_tratado: string;
  material_utilizado?: string;
  compromisos?: string;
  notas?: string;
  proximo_encuentro?: string;
  created_at: string;
  updated_at: string;
}

export interface Oracion {
  id: string;
  discipulo_id: string;
  lider_id: string;
  fecha: string;
  pedido: string;
  respuesta?: string;
  estado: "pendiente" | "respondida" | "en_oracion";
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: string;
  titulo: string;
  tipo: "libro" | "pdf" | "video" | "audio" | "link" | "nota";
  descripcion?: string;
  url?: string;
  etapa_id: number;
  creado_por: string;
  created_at: string;
  updated_at: string;
}

export interface Tarea {
  id: string;
  discipulo_id: string;
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
  discipulo_id: string;
  tipo: string;
  descripcion: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Etapa {
  id: number;
  nombre: string;
  descripcion: string;
  orden: number;
  objetivos: string[];
  material_recomendado: string;
}
