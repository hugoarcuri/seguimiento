import type { SeguimientoEvaluacion, SeguimientoObjetivo } from "@/types/database";

export const ETAPAS = [
  { valor: 1, nombre: "No Creyente" },
  { valor: 2, nombre: "Bebé Espiritual" },
  { valor: 3, nombre: "Niño Espiritual" },
  { valor: 4, nombre: "Joven Espiritual" },
  { valor: 5, nombre: "Padre/Madre Espiritual" },
] as const;

export const nombreEtapa = (etapa: number) =>
  ETAPAS.find((e) => e.valor === etapa)?.nombre || `Etapa ${etapa}`;

export const AREAS_EVALUACION = [
  { key: "vida_devocional", label: "Vida devocional" },
  { key: "oracion", label: "Oración" },
  { key: "lectura_biblica", label: "Lectura bíblica" },
  { key: "comunion", label: "Comunión" },
  { key: "caracter", label: "Carácter" },
  { key: "servicio", label: "Servicio" },
  { key: "evangelismo", label: "Evangelismo" },
  { key: "discipulado", label: "Discipulado" },
] as const;

export type AreaEvaluacionKey = (typeof AREAS_EVALUACION)[number]["key"];

export const NIVELES_EVALUACION = [
  { valor: 0, nombre: "Necesita ayuda" },
  { valor: 1, nombre: "En desarrollo" },
  { valor: 2, nombre: "Consolidado" },
] as const;

export const nombreNivel = (v?: number | null) =>
  NIVELES_EVALUACION.find((n) => n.valor === v)?.nombre || "Sin evaluar";

export const OBJETIVOS_SUGERIDOS = [
  "Leer la Biblia diariamente",
  "Bautizarse",
  "Asistir al grupo pequeño",
  "Memorizar versículos",
  "Servir en un ministerio",
];

export const calcularProgreso = (
  evaluacion: SeguimientoEvaluacion | null | undefined,
  objetivos: SeguimientoObjetivo[] | null | undefined
): number => {
  let evalPct = 0;
  if (evaluacion) {
    const suma =
      (evaluacion.vida_devocional ?? 0) +
      (evaluacion.oracion ?? 0) +
      (evaluacion.lectura_biblica ?? 0) +
      (evaluacion.comunion ?? 0) +
      (evaluacion.caracter ?? 0) +
      (evaluacion.servicio ?? 0) +
      (evaluacion.evangelismo ?? 0) +
      (evaluacion.discipulado ?? 0);
    evalPct = suma / (AREAS_EVALUACION.length * 2);
  }

  const lista = objetivos || [];
  const completados = lista.filter((o) => o.completado).length;
  const objetivosPct = lista.length > 0 ? completados / lista.length : null;

  const pct = objetivosPct === null ? evalPct : evalPct * 0.7 + objetivosPct * 0.3;
  return Math.round(Math.max(0, Math.min(1, pct)) * 100);
};