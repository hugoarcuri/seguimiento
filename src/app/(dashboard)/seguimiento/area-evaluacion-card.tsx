"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Book } from "lucide-react";
import { areasMeta, defaultOpts, ministerios, opcionesIndicador } from "./data";
import type { SupabaseArea, SupabaseIndicador } from "./data";

export interface AreaEvaluacionCardProps {
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

export function AreaEvaluacionCard({
  areaId,
  areas,
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
}: AreaEvaluacionCardProps) {
  const area = areas.find((a) => a.id === areaId);
  if (!area) return null;
  const items = indicadores.filter((i) => i.area_id === areaId);
  if (items.length === 0) return null;
  const Icon = areasMeta[areaId]?.icon || Book;

  const getOpciones = (indNombre: string) => opcionesIndicador[indNombre] || { type: "escala" as const, labels: defaultOpts };
  const stepObjetivo = (indId: number) => objetivosNivel[`${indId}-${etapaId}`] || "";

  return (
    <Card>
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="h-4 w-4" /> {area.nombre}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        {items.map((ind) => {
          const opts = getOpciones(ind.nombre);
          const obj = stepObjetivo(ind.id);
          return (
            <div key={ind.id}>
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-sm font-medium">{ind.nombre}</p>
                  {obj && <p className="text-[11px] text-muted-foreground leading-tight">{obj}</p>}
                </div>
              </div>
              {ind.nombre === "Sirvió esta semana" && valores[ind.id] === 1 ? (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {opts.labels.map((label, v) => (
                      <button key={v} type="button" onClick={() => onValor(ind.id, v)}
                        className={`flex-1 h-8 rounded-lg text-xs font-medium transition-all ${
                          (valores[ind.id] ?? -1) === v ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >{label}</button>
                    ))}
                  </div>
                  {(valores[ind.id] ?? -1) === 1 && (
                    <div className="space-y-2">
                      <Select value={ministerioSeleccionado} onValueChange={(v) => onMinisterio(v?.toString() ?? "")}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Seleccionar ministerio" /></SelectTrigger>
                        <SelectContent>
                          {ministerios.map((m) => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}
                          <SelectItem value="Otro" className="text-xs">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      {ministerioSeleccionado === "Otro" && (
                        <Input placeholder="¿Cuál?" className="h-8 text-xs" value={ministerioCustom} onChange={(e) => onMinisterioCustom(e.target.value)} />
                      )}
                    </div>
                  )}
                </div>
              ) : opts.type === "si_no" ? (
                <div className="flex gap-2">
                  {opts.labels.map((label, v) => (
                    <button key={v} type="button" onClick={() => onValor(ind.id, v)}
                      className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all ${
                        (valores[ind.id] ?? -1) === v ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >{label}</button>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {opts.labels.map((label, v) => (
                      <button key={v} type="button" onClick={() => onValor(ind.id, v)}
                        className={`flex-1 h-9 rounded-lg text-xs font-medium transition-all ${
                          (valores[ind.id] ?? -1) === v ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >{label}</button>
                    ))}
                  </div>
                  <Input placeholder="Observación..." className="h-7 text-xs" value={evalObs[ind.id] || ""} onChange={(e) => onEvalObs(ind.id, e.target.value)} />
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

interface AreaEvaluacionCardsProps extends Omit<AreaEvaluacionCardProps, "areaId"> {
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
