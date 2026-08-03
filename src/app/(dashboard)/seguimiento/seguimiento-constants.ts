import type { SeguimientoObjetivo } from "@/types/database";

export const ETAPAS = [
  { valor: 1, nombre: "No Creyente" },
  { valor: 2, nombre: "Bebé Espiritual" },
  { valor: 3, nombre: "Niño Espiritual" },
  { valor: 4, nombre: "Joven Espiritual" },
  { valor: 5, nombre: "Padre/Madre Espiritual" },
] as const;

export const nombreEtapa = (etapa: number) =>
  ETAPAS.find((e) => e.valor === etapa)?.nombre || `Etapa ${etapa}`;

export const OPCIONES_RELACION_DIOS = ["Regular", "Irregular"] as const;

export const CAMPOS_EVALUACION = [
  { key: "relacion_dios", label: "Relación con Dios", placeholder: "Ej: Irregular, regular" },
  { key: "habitos_pecaminosos", label: "Hábitos pecaminosos a abandonar", placeholder: "Describí los hábitos a trabajar" },
  { key: "don_espiritual", label: "Don espiritual", placeholder: "¿Lo conoce? ¿Cuál?" },
  { key: "ministerio", label: "¿Está sirviendo?", placeholder: "¿En qué ministerio?" },
  { key: "relacion_autoridad", label: "Relación con la autoridad", placeholder: "¿Conflictivo?" },
  { key: "estudia", label: "¿Estudia?", placeholder: "¿Qué estudia?" },
  { key: "trabaja", label: "¿Trabaja?", placeholder: "¿En qué trabaja?" },
  { key: "convive_con", label: "¿Con quién vive?", placeholder: "Convivencia" },
] as const;

export type CampoEvaluacionKey = (typeof CAMPOS_EVALUACION)[number]["key"];

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