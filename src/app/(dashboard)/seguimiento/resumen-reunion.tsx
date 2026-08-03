"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { CheckCircle2, Loader2, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { areasMeta, escalaCrecimiento } from "./data";
import type { SupabaseArea, SupabaseIndicador, SupabaseReunion } from "./data";

interface ResumenReunionProps {
  reunion: SupabaseReunion;
  indicadores: SupabaseIndicador[];
  areas: SupabaseArea[];
  saving?: boolean;
  editable?: boolean;
  onEditar?: () => void;
  onCerrar?: () => void;
}

export function ResumenReunion({
  reunion,
  indicadores,
  areas,
  saving,
  editable,
  onEditar,
  onCerrar,
}: ResumenReunionProps) {
  const evals = reunion.evaluaciones || [];
  const obsText = (reunion.observaciones_generales || "").split("\n\n").filter(Boolean);
  const compromisos = (reunion.compromisos || "").split("\n").filter(Boolean);

  const resumenAreas = areas
    .filter((a) => indicadores.some((i) => i.area_id === a.id))
    .map((a) => {
      const items = indicadores.filter((i) => i.area_id === a.id);
      const vals = items
        .map((i) => evals.find((e) => e.indicador_id === i.id)?.valor)
        .filter((v): v is number => v !== null && v !== undefined);
      const prom = vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : -1;
      return { area: a, prom };
    });

  const notas = evals.filter((e) => e.observaciones);

  return (
    <div className="space-y-4">
      <Card className="border-emerald-200 dark:border-emerald-800">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Reunión guardada</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(reunion.fecha + "T12:00:00"), "dd/MM/yyyy")} ·{" "}
              {evals.filter((e) => e.valor !== null).length} indicadores evaluados
            </p>
          </div>
          {onCerrar && (
            <Button size="sm" variant="ghost" onClick={onCerrar} disabled={saving}>
              <X className="h-4 w-4" />
            </Button>
          )}
          {editable && (
            <Button size="sm" variant="outline" onClick={onEditar} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              <Pencil className="h-4 w-4 mr-1" /> Editar
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3 pb-0"><CardTitle className="text-sm">Resumen por área</CardTitle></CardHeader>
        <CardContent className="p-3 space-y-2">
          {resumenAreas.map(({ area, prom }) => {
            const Icon = areasMeta[area.id]?.icon;
            const nivel = prom >= 0 ? escalaCrecimiento[prom] : undefined;
            return (
              <div key={area.id} className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 flex items-center justify-center text-muted-foreground shrink-0">
                  {Icon && <Icon className="h-4 w-4" />}
                </span>
                <span className="flex-1 font-medium">{area.nombre}</span>
                {nivel ? (
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", nivel.cls)}>{nivel.label}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Sin evaluar</span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {notas.length > 0 && (
        <Card>
          <CardHeader className="p-3 pb-0"><CardTitle className="text-sm">Notas de la semana</CardTitle></CardHeader>
          <CardContent className="p-3 space-y-3">
            {notas.map((e) => {
              const ind = indicadores.find((i) => i.id === e.indicador_id);
              return (
                <div key={e.id || e.indicador_id} className="text-sm">
                  <p className="font-medium text-xs text-muted-foreground">{ind?.nombre}</p>
                  <p className="text-sm whitespace-pre-line">{e.observaciones}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {(obsText.length > 0 || compromisos.length > 0) && (
        <Card>
          <CardHeader className="p-3 pb-0"><CardTitle className="text-sm">Cierre</CardTitle></CardHeader>
          <CardContent className="p-3 space-y-3">
            {obsText.map((t, i) => (
              <p key={i} className="text-sm whitespace-pre-line">{t}</p>
            ))}
            {compromisos.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Compromisos</p>
                <ul className="space-y-0.5 text-sm">
                  {compromisos.map((c, i) => (
                    <li key={i} className="flex gap-1.5"><span className="text-primary">•</span>{c}</li>
                  ))}
                </ul>
              </div>
            )}
            {reunion.proxima_reunion && (
              <p className="text-sm text-muted-foreground">
                Próxima reunión: {format(new Date(reunion.proxima_reunion + "T12:00:00"), "dd/MM/yyyy")}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}