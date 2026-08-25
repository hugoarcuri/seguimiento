import type { EstudioBiblico, PasoEstudio } from "@/types/database";

export type { SeccionContenido, PreguntaEstudio, GuiaDiscipulador, PasoEstudio } from "@/types/database";

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
