"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { areasMeta, escalaPorValor, inicioSemana } from "./data";
import type { SupabaseArea, SupabaseIndicador, SupabaseReunion } from "./data";

interface TimelineSeguimientoProps {
  reuniones: SupabaseReunion[];
  indicadores: SupabaseIndicador[];
  areas: SupabaseArea[];
}

export function TimelineSeguimiento({ reuniones, indicadores, areas }: TimelineSeguimientoProps) {
  const ordenadas = [...reuniones].sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (ordenadas.length === 0) return null;

  const areasOrdenadas = areas
    .filter((a) => areasMeta[a.id])
    .sort((a, b) => a.id - b.id);

  return (
    <Card>
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm">Historial</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <ol className="relative space-y-4 border-l border-border pl-4">
          {ordenadas.map((reunion) => {
            const ws = inicioSemana(new Date(reunion.fecha + "T12:00:00"));
            const we = new Date(ws);
            we.setDate(ws.getDate() + 4);
            const evals = new Map((reunion.evaluaciones || []).map((e) => [e.indicador_id, e.valor]));
            return (
              <li key={reunion.id} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">
                    Semana {format(ws, "ww")} · {format(ws, "dd/MM")} – {format(we, "dd/MM")}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{format(new Date(reunion.fecha + "T12:00:00"), "dd/MM/yyyy")}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {areasOrdenadas.map((area) => {
                    const ind = indicadores.find((i) => i.area_id === area.id);
                    if (!ind) return null;
                    const nivel = escalaPorValor(evals.get(ind.id));
                    if (!nivel) return null;
                    return (
                      <span
                        key={ind.id}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border",
                          nivel.cls
                        )}
                      >
                        <span>{areasMeta[area.id]?.emoji}</span>
                        <span className="truncate max-w-[120px] sm:max-w-none">{area.nombre}</span>
                        <span>{nivel.emoji}</span>
                      </span>
                    );
                  })}
                  {reunion.evaluaciones?.length === 0 && (
                    <span className="text-[11px] text-muted-foreground">Sin evaluaciones</span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}