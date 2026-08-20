import type { EstudioBiblico, PasoEstudio } from "@/types/database";

export type { SeccionContenido, PreguntaEstudio, GuiaDiscipulador, PasoEstudio } from "@/types/database";

export const ETAPA_LABELS: Record<number, string> = {
  1: "No creyente",
  2: "Nuevo creyente",
  3: "Discípulo",
  4: "Siervo",
  5: "Multiplicador",
};

export const ETAPADescripcion: Record<number, string> = {
  1: "Material de evangelismo y acompañamiento para quienes aún no conocen a Cristo",
  2: "Fundamentos de la fe para quienes recién aceptaron a Cristo",
  3: "Formación en carácter y conocimiento bíblico para creyentes comprometidos",
  4: "Preparación para servir y liderar en la iglesia",
  5: "Formación para hacer discípulos y multiplicar el reino",
};

export function dbToPaso(db: EstudioBiblico): PasoEstudio {
  return {
    numero: db.numero,
    etapaId: db.etapa_id,
    titulo: db.titulo,
    descripcion: db.descripcion,
    contenido: db.contenido,
    preguntas: db.preguntas,
    guia: db.guia,
  };
}

export function getEstudiosPorEtapa(estudios: EstudioBiblico[], etapaId: number): PasoEstudio[] {
  return estudios
    .filter((e) => e.etapa_id === etapaId && e.activo)
    .sort((a, b) => a.numero - b.numero)
    .map(dbToPaso);
}

export function getEstudioPorNumero(estudios: EstudioBiblico[], numero: number): PasoEstudio | undefined {
  const found = estudios.find((e) => e.numero === numero && e.activo);
  return found ? dbToPaso(found) : undefined;
}
