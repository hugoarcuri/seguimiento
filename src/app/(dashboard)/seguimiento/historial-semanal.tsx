"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarRange } from "lucide-react";

interface HistorialEvaluacion {
  indicador_id: number;
  valor: number | null;
}

interface HistorialReunion {
  id: string;
  fecha: string;
  evaluaciones?: HistorialEvaluacion[];
}

interface HistorialIndicador {
  id: number;
  area_id: number;
  nombre: string;
}

interface HistorialArea {
  id: number;
  nombre: string;
}

interface HistorialSemanalProps {
  reuniones: HistorialReunion[];
  indicadores: HistorialIndicador[];
  areas: HistorialArea[];
  opcionesIndicador: Record<string, { type: "escala" | "si_no"; labels: string[] }>;
  maxSemanas?: number;
}

function numeroSemana(fecha: string): number {
  const date = new Date(fecha + "T12:00:00");
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

export function HistorialSemanal({
  reuniones,
  indicadores,
  areas,
  opcionesIndicador,
  maxSemanas = 12,
}: HistorialSemanalProps) {
  const [verTodas, setVerTodas] = useState(false);

  const semanas = [...reuniones]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, verTodas ? undefined : maxSemanas);

  const areasConIndicadores = areas
    .map((a) => ({
      ...a,
      indicadores: indicadores
        .filter((i) => i.area_id === a.id)
        .sort((x, y) => x.id - y.id),
    }))
    .filter((a) => a.indicadores.length > 0);

  const valorColor = (ind: HistorialIndicador, valor: number) => {
    const opts = opcionesIndicador[ind.nombre];
    const max = opts ? opts.labels.length - 1 : 4;
    const pct = (valor / max) * 100;
    return pct >= 80
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
      : pct >= 50
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400";
  };

  return (
    <Card>
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarRange className="h-4 w-4" /> Historial semanal
          </CardTitle>
          {reuniones.length > maxSemanas && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setVerTodas((v) => !v)}>
              {verTodas ? "Ver últimas 12" : `Ver todas (${reuniones.length})`}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {reuniones.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">Aún no hay evaluaciones guardadas</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Semana</TableHead>
                {areasConIndicadores.map((a) => (
                  <TableHead key={a.id} className="text-center text-xs" colSpan={a.indicadores.length}>
                    {a.nombre}
                  </TableHead>
                ))}
              </TableRow>
              <TableRow>
                <TableHead />
                {areasConIndicadores.flatMap((a) =>
                  a.indicadores.map((ind) => (
                    <TableHead key={ind.id} className="text-center text-[10px] font-normal text-muted-foreground max-w-[90px] truncate">
                      {ind.nombre}
                    </TableHead>
                  ))
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {semanas.map((r) => {
                const evalPorInd = new Map((r.evaluaciones || []).map((e) => [e.indicador_id, e.valor]));
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs font-medium whitespace-nowrap">
                      {format(new Date(r.fecha + "T12:00:00"), "dd/MM/yyyy")}
                      <span className="text-muted-foreground ml-1">· S{numeroSemana(r.fecha)}</span>
                    </TableCell>
                    {areasConIndicadores.flatMap((a) =>
                      a.indicadores.map((ind) => {
                        const v = evalPorInd.get(ind.id);
                        const opts = opcionesIndicador[ind.nombre];
                        const label = opts && v !== null && v !== undefined && opts.labels[v] ? opts.labels[v] : undefined;
                        return (
                          <TableCell key={ind.id} className="text-center">
                            {v !== null && v !== undefined ? (
                              <span title={label} className={cn("inline-block w-7 h-7 rounded-full text-[11px] font-bold leading-7", valorColor(ind, v))}>
                                {v}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        );
                      })
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
