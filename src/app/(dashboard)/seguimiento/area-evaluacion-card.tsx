"use client";

import { IndicadorPregunta } from "./indicador-pregunta";
import type { SupabaseIndicador } from "./data";

export interface PreguntasDeAreaProps {
  areaId: number;
  indicadores: SupabaseIndicador[];
  valores: Record<number, number>;
  onValor: (id: number, v: number) => void;
  evalObs: Record<number, string>;
  onEvalObs: (id: number, t: string) => void;
}

export function PreguntasDeArea({
  areaId,
  indicadores,
  valores,
  onValor,
  evalObs,
  onEvalObs,
}: PreguntasDeAreaProps) {
  const items = indicadores.filter((i) => i.area_id === areaId);
  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      {items.map((ind) => (
        <IndicadorPregunta
          key={ind.id}
          nombre={ind.nombre}
          valor={valores[ind.id]}
          onValor={(v) => onValor(ind.id, v)}
          comentario={evalObs[ind.id] || ""}
          onComentario={(t) => onEvalObs(ind.id, t)}
        />
      ))}
    </div>
  );
}