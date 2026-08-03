"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Book } from "lucide-react";
import { areasMeta } from "./data";
import { IndicadorPregunta } from "./indicador-pregunta";
import type { SupabaseArea, SupabaseIndicador } from "./data";

export interface PreguntasDeAreaProps {
  areaId: number;
  areas: SupabaseArea[];
  indicadores: SupabaseIndicador[];
  objetivosNivel: Record<string, string>;
  etapaId?: number;
  valores: Record<number, number>;
  onValor: (id: number, v: number) => void;
  evalObs: Record<number, string>;
  onEvalObs: (id: number, t: string) => void;
  ministerioSeleccionado: string;
  onMinisterio: (v: string) => void;
  ministerioCustom: string;
  onMinisterioCustom: (v: string) => void;
}

export function PreguntasDeArea({
  areaId,
  indicadores,
  objetivosNivel,
  etapaId,
  valores,
  onValor,
  evalObs,
  onEvalObs,
  ministerioSeleccionado,
  onMinisterio,
  ministerioCustom,
  onMinisterioCustom,
}: PreguntasDeAreaProps) {
  const items = indicadores.filter((i) => i.area_id === areaId);
  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      {items.map((ind) => (
        <IndicadorPregunta
          key={ind.id}
          nombre={ind.nombre}
          objetivo={objetivosNivel[`${ind.id}-${etapaId}`] || ""}
          valor={valores[ind.id]}
          onValor={(v) => onValor(ind.id, v)}
          comentario={evalObs[ind.id] || ""}
          onComentario={(t) => onEvalObs(ind.id, t)}
          ministerioSeleccionado={ministerioSeleccionado}
          onMinisterio={onMinisterio}
          ministerioCustom={ministerioCustom}
          onMinisterioCustom={onMinisterioCustom}
        />
      ))}
    </div>
  );
}

export function AreaEvaluacionCard({
  areaId,
  ...rest
}: PreguntasDeAreaProps) {
  const area = rest.areas.find((a) => a.id === areaId);
  if (!area) return null;
  const Icon = areasMeta[areaId]?.icon || Book;

  return (
    <Card>
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="h-4 w-4" /> {area.nombre}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <PreguntasDeArea areaId={areaId} {...rest} />
      </CardContent>
    </Card>
  );
}

interface AreaEvaluacionCardsProps extends Omit<PreguntasDeAreaProps, "areaId"> {
  areaIds: number[];
}

export function AreaEvaluacionCards({ areaIds, ...rest }: AreaEvaluacionCardsProps) {
  return (
    <>
      {areaIds.map((aid) => (
        <AreaEvaluacionCard key={aid} areaId={aid} {...rest} />
      ))}
    </>
  );
}
