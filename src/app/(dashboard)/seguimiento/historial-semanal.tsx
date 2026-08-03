"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ChevronDown, LineChart } from "lucide-react";
import { areasMeta, escalaCrecimiento } from "./data";
import type { SupabaseArea, SupabaseIndicador, SupabaseReunion } from "./data";

interface HistorialSemanalProps {
  reuniones: SupabaseReunion[];
  indicadores: SupabaseIndicador[];
  areas: SupabaseArea[];
  reunionSeleccionadaId?: string | null;
  onSeleccionarReunion?: (id: string) => void;
  maxSemanas?: number;
}

export function HistorialSemanal({
  reuniones,
  indicadores,
  areas,
  reunionSeleccionadaId,
  onSeleccionarReunion,
  maxSemanas = 12,
}: HistorialSemanalProps) {
  const [abierto, setAbierto] = useState(false);
  const [verTodas, setVerTodas] = useState(false);

  const semanas = [...reuniones]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(verTodas ? 0 : -maxSemanas);

  const areasConDatos = areas.filter((a) => indicadores.some((i) => i.area_id === a.id));

  const valorSemana = (reunion: SupabaseReunion, areaId: number): number | null => {
    const items = indicadores.filter((i) => i.area_id === areaId);
    const vals = items
      .map((i) => reunion.evaluaciones?.find((e) => e.indicador_id === i.id)?.valor)
      .filter((v): v is number => v !== null && v !== undefined);
    if (vals.length === 0) return null;
    return Math.min(...vals);
  };

  return (
    <Card>
      <CardHeader className="p-3 pb-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-auto flex items-center justify-between gap-2 py-2 px-1"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
        >
          <span className="flex items-center gap-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <LineChart className="h-4 w-4" /> Evolución
              {reuniones.length > 0 && (
                <span className="text-xs text-muted-foreground font-normal">
                  ({reuniones.length} {reuniones.length === 1 ? "reunión" : "reuniones"})
                </span>
              )}
            </CardTitle>
          </span>
          <span className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{abierto ? "Ocultar" : "Ver evolución"}</span>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", abierto && "rotate-180")} />
          </span>
        </Button>
      </CardHeader>
      <div className={cn("grid transition-[grid-template-rows,opacity] duration-200 ease-in-out", abierto ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
        <div className="overflow-hidden">
          <CardContent className="p-3 pt-0">
            {reuniones.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Aún no hay reuniones guardadas</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left py-1 pr-2 text-muted-foreground font-medium whitespace-nowrap">Área</th>
                        {semanas.map((r) => (
                          <th key={r.id} className="text-center py-1 px-1 font-medium whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => onSeleccionarReunion?.(r.id)}
                              className={cn("cursor-pointer hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded", reunionSeleccionadaId === r.id && "text-primary")}
                            >
                              {format(new Date(r.fecha + "T12:00:00"), "dd/MM")}
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {areasConDatos.map((a) => {
                        const Icon = areasMeta[a.id]?.icon;
                        return (
                          <tr key={a.id} className="border-b last:border-0">
                            <td className="py-1.5 pr-2 font-medium whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5">
                                {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
                                {a.nombre}
                              </span>
                            </td>
                            {semanas.map((r) => {
                              const v = valorSemana(r, a.id);
                              const nivel = v !== null ? escalaCrecimiento[v] : undefined;
                              return (
                                <td key={r.id} className="text-center py-1.5 px-1">
                                  <button
                                    type="button"
                                    onClick={() => onSeleccionarReunion?.(r.id)}
                                    className={cn(
                                      "inline-block w-5 h-5 rounded-full cursor-pointer transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                                      reunionSeleccionadaId === r.id && "ring-2 ring-primary ring-offset-1",
                                      nivel ? nivel.dotCls : "bg-muted"
                                    )}
                                    aria-label={`${a.nombre}: ${v !== null ? escalaCrecimiento[v].label : "sin datos"}`}
                                    title={v !== null ? escalaCrecimiento[v].label : "Sin datos"}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap gap-3 items-center mt-2">
                  {escalaCrecimiento.map((n) => (
                    <span key={n.valor} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <span className={cn("w-3 h-3 rounded-full", n.dotCls)} /> {n.label}
                    </span>
                  ))}
                </div>
                {reuniones.length > maxSemanas && (
                  <div className="flex justify-end mt-2">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setVerTodas((v) => !v)}>
                      {verTodas ? "Ver últimas 12" : `Ver todas (${reuniones.length})`}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}