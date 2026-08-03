"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AreaSeguimientoCard } from "./area-seguimiento-card";
import { areaEmocional, areaFamiliar, areaEstudios, areaTrabajo, areaEspiritual } from "./data";
import type { SupabaseArea, SupabaseIndicador } from "./data";
import type { ReunionFormState } from "./use-reunion-form";

interface FormularioSeguimientoProps {
  w: ReunionFormState;
  areas: SupabaseArea[];
  indicadores: SupabaseIndicador[];
}

function ChipActivo({ label, activo, onClick }: { label: string; activo: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={cn(
        "flex-1 h-9 rounded-lg text-sm font-medium transition-all cursor-pointer border",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        activo
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted/80 hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}

function tarjetaDeArea(
  areaId: number,
  areas: SupabaseArea[],
  indicadores: SupabaseIndicador[],
  w: ReunionFormState
) {
  const area = areas.find((a) => a.id === areaId);
  if (!area) return null;
  const indicador = indicadores.find((i) => i.area_id === areaId);
  return (
    <AreaSeguimientoCard
      key={areaId}
      area={area}
      valor={indicador ? w.valores[indicador.id] : undefined}
      onValor={(v) => indicador && w.setValores((prev) => ({ ...prev, [indicador.id]: v }))}
      comentario={indicador ? w.evalObs[indicador.id] || "" : ""}
      onComentario={(t) => indicador && w.setEvalObs((prev) => ({ ...prev, [indicador.id]: t }))}
    />
  );
}

export function FormularioSeguimiento({ w, areas, indicadores }: FormularioSeguimientoProps) {
  return (
    <div className="space-y-3">
      {tarjetaDeArea(areaEmocional, areas, indicadores, w)}
      {tarjetaDeArea(areaFamiliar, areas, indicadores, w)}

      <Card>
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm">Estudios / Trabajo</CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-3">
          <div className="flex gap-2">
            <ChipActivo label="🎓 ¿Estudia?" activo={w.estudios} onClick={() => w.setEstudios(!w.estudios)} />
            <ChipActivo label="💼 ¿Trabaja?" activo={w.trabajo} onClick={() => w.setTrabajo(!w.trabajo)} />
          </div>
          {w.estudios && tarjetaDeArea(areaEstudios, areas, indicadores, w)}
          {w.trabajo && tarjetaDeArea(areaTrabajo, areas, indicadores, w)}
        </CardContent>
      </Card>

      {tarjetaDeArea(areaEspiritual, areas, indicadores, w)}
    </div>
  );
}