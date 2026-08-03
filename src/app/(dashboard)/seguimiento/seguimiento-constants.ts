import type { SeguimientoObjetivo } from "@/types/database";

export type CampoEvaluacionDef = {
  key: string;
  label: string;
  placeholder?: string;
  opciones?: readonly string[];
  detalleSi?: string;
  detalleLabel?: string;
  detallePlaceholder?: string;
};

export const CAMPOS_EVALUACION: CampoEvaluacionDef[] = [
  {
    key: "habitos_pecaminosos",
    label: "Hábitos pecaminosos a abandonar",
    placeholder: "Describí los hábitos a trabajar (aparecerá como objetivo fijo)",
  },
  {
    key: "don_espiritual",
    label: "Don Espiritual",
    opciones: ["Lo conoce", "No lo conoce"],
    detalleSi: "Lo conoce",
    detalleLabel: "¿Cuál?",
    detallePlaceholder: "Ej: Profecía, enseñanza...",
  },
  {
    key: "ministerio",
    label: "¿Está sirviendo?",
    opciones: ["No", "Sí"],
    detalleSi: "Sí",
    detalleLabel: "¿En qué ministerio o de qué manera?",
    detallePlaceholder: "Ej: Alabanza, ujier...",
  },
  {
    key: "relacion_autoridad",
    label: "Relación con la autoridad",
    opciones: ["Conflictivo", "Se maneja bien"],
  },
  {
    key: "estudia",
    label: "¿Estudia?",
    opciones: ["No", "Sí"],
    detalleSi: "Sí",
    detalleLabel: "¿Qué estudia y en qué año de la cursada?",
    detallePlaceholder: "Ej: Ingeniería, 2º año",
  },
  {
    key: "trabaja",
    label: "¿Trabaja?",
    opciones: ["No", "Sí"],
    detalleSi: "Sí",
    detalleLabel: "¿En qué trabaja?",
    detallePlaceholder: "Ej: Atención al cliente",
  },
  {
    key: "convive_con",
    label: "¿Con quién vive?",
    opciones: ["Solo", "Con la familia"],
    detalleSi: "Con la familia",
    detalleLabel: "¿Con quiénes?",
    detallePlaceholder: "Ej: madre, padre, hermanos, tíos",
  },
];

export type CampoEvaluacionKey = (typeof CAMPOS_EVALUACION)[number]["key"];

export const codificarCampoEvaluacion = (campo: CampoEvaluacionDef, opcion: string, detalle: string): string => {
  const op = (opcion || "").trim();
  const det = (detalle || "").trim();
  if (!campo.opciones) return det;
  if (!campo.detalleSi) return op;
  if (op !== campo.detalleSi) return op;
  return det || op;
};

export const decodificarCampoEvaluacion = (
  campo: CampoEvaluacionDef,
  valor: string | null | undefined
): { opcion: string; detalle: string } => {
  const v = (valor || "").trim();
  if (!v) return { opcion: "", detalle: "" };
  if (!campo.opciones) return { opcion: "", detalle: v };
  if (!campo.detalleSi) return { opcion: v, detalle: "" };
  if ((campo.opciones as readonly string[]).includes(v)) return { opcion: v, detalle: "" };
  return { opcion: campo.detalleSi, detalle: v };
};

export const OBJETIVOS_SUGERIDOS = [
  "Leer la Biblia diariamente",
  "Bautizarse",
  "Asistir al grupo pequeño",
  "Memorizar versículos",
  "Servir en un ministerio",
];

export const calcularProgreso = (
  objetivos: SeguimientoObjetivo[] | null | undefined
): number => {
  const lista = objetivos || [];
  if (lista.length === 0) return 0;
  const completados = lista.filter((o) => o.completado).length;
  return Math.round((completados / lista.length) * 100);
};