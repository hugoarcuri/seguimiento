"use client";

import { CalendarDays, CalendarRange, Loader2, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { SupabaseDiscipulo, SupabaseReunion } from "./data";

interface SeguimientoHeaderProps {
  discipulos: SupabaseDiscipulo[];
  selectedId: string;
  onSelect: (id: string) => void;
  discipulo?: SupabaseDiscipulo;
  reuniones: SupabaseReunion[];
  pct: number;
  cargandoReuniones: boolean;
}

const estadoMeta: Record<string, { label: string; cls: string }> = {
  activo: { label: "Activo", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
  pausado: { label: "Pausado", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
  completado: { label: "Completado", cls: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400" },
  retirado: { label: "Retirado", cls: "bg-muted text-muted-foreground" },
};

export function SeguimientoHeader({
  discipulos,
  selectedId,
  onSelect,
  discipulo,
  reuniones,
  pct,
  cargandoReuniones,
}: SeguimientoHeaderProps) {
  const ultimaReunion = [...reuniones].sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
  const estado = discipulo?.estado ? estadoMeta[discipulo.estado] : undefined;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          {discipulo ? (
            <>
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {discipulo.nombre?.[0]}{discipulo.apellido?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold truncate">{discipulo.nombre} {discipulo.apellido}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                  <span>{discipulo.etapas?.nombre || `Nivel ${discipulo.etapa_id}`}</span>
                  {estado && (
                    <span className={cn("px-1.5 py-0.5 rounded-full font-medium", estado.cls)}>{estado.label}</span>
                  )}
                </div>
              </div>
              <div className="hidden sm:flex flex-col items-end gap-0.5 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><CalendarRange className="h-3 w-3" /> {reuniones.length} reuniones</span>
                <span className="inline-flex items-center gap-1">
                  {cargandoReuniones ? <Loader2 className="h-3 w-3 animate-spin" /> : <CalendarDays className="h-3 w-3" />}
                  {ultimaReunion ? `Última: ${format(new Date(ultimaReunion.fecha + "T12:00:00"), "dd/MM/yyyy")}` : "Sin reuniones aún"}
                </span>
              </div>
            </>
          ) : (
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold">Seguimiento</p>
              <p className="text-[11px] text-muted-foreground">Reunión de discipulado</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso de la evaluación">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">{pct}% · Progreso de la semana</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          {discipulos.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelect(d.id)}
              aria-pressed={selectedId === d.id}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                selectedId === d.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {d.nombre}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
