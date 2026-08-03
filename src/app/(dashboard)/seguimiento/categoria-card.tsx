"use client";

import { useRef, useState } from "react";
import { ChevronDown, CheckCircle2, Book } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { areasMeta } from "./data";
import { PreguntasDeArea, type PreguntasDeAreaProps } from "./area-evaluacion-card";
import type { SupabaseArea } from "./data";

interface CategoriasColapsablesProps extends Omit<PreguntasDeAreaProps, "areaId"> {
  areaIds: number[];
}

export function CategoriasColapsables({
  areaIds,
  areas,
  indicadores,
  valores,
  onValor,
  ...rest
}: CategoriasColapsablesProps) {
  const [openId, setOpenId] = useState<number | null>(areaIds[0] ?? null);
  const avanzarBloqueado = useRef(false);

  const estaCompleta = (areaId: number) => {
    const items = indicadores.filter((i) => i.area_id === areaId);
    return items.length > 0 && items.every((i) => valores[i.id] !== undefined);
  };

  const handleValor = (id: number, v: number) => {
    onValor(id, v);
    if (openId === null) return;
    const items = indicadores.filter((i) => i.area_id === openId);
    const nuevoValores = { ...valores, [id]: v };
    const completo = items.length > 0 && items.every((i) => nuevoValores[i.id] !== undefined);
    if (completo && !avanzarBloqueado.current) {
      avanzarBloqueado.current = true;
      setTimeout(() => {
        setOpenId(siguienteNoCompletada());
        avanzarBloqueado.current = false;
      }, 450);
    }
  };

  const siguienteNoCompletada = () => {
    if (openId === null) return areaIds[0] ?? null;
    const idx = areaIds.indexOf(openId);
    for (let i = idx + 1; i < areaIds.length; i++) {
      if (!estaCompleta(areaIds[i])) return areaIds[i];
    }
    return openId;
  };

  return (
    <div className="space-y-3">
      {areaIds.map((areaId) => {
        const area = areas.find((a) => a.id === areaId);
        if (!area) return null;
        const complete = estaCompleta(areaId);
        const open = openId === areaId;
        return (
          <CategoriaCard
            key={areaId}
            areaId={areaId}
            area={area}
            open={open}
            complete={complete}
            indicadores={indicadores}
            onToggle={() => setOpenId(open ? null : areaId)}
            onValor={handleValor}
            valores={valores}
            areas={areas}
            {...rest}
          />
        );
      })}
    </div>
  );
}

interface CategoriaCardProps extends Omit<PreguntasDeAreaProps, "areaId"> {
  areaId: number;
  area: SupabaseArea;
  open: boolean;
  complete: boolean;
  onToggle: () => void;
}

function CategoriaCard({
  areaId,
  area,
  open,
  complete,
  onToggle,
  indicadores,
  ...rest
}: CategoriaCardProps) {
  const Icon = areasMeta[areaId]?.icon || Book;
  const pendientes = indicadores.filter((i) => i.area_id === areaId).filter((i) => (rest.valores[i.id] === undefined));
  const contentId = `categoria-${areaId}`;

  return (
    <Card className={cn("overflow-hidden transition-shadow", open && "ring-1 ring-primary/30 shadow-sm")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={contentId}
        className={cn(
          "w-full flex items-center gap-3 p-4 text-left select-none transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
          open ? "bg-muted/40" : "hover:bg-muted/30"
        )}
      >
        <Icon className={cn("h-5 w-5 shrink-0", open ? "text-primary" : "text-muted-foreground")} />
        <span className="flex-1 text-sm font-medium">{area.nombre}</span>
        {complete ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> Completado
          </span>
        ) : pendientes.length === 0 ? null : (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            {pendientes.length} {pendientes.length === 1 ? "pendiente" : "pendientes"}
          </span>
        )}
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>
      <div
        id={contentId}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 ease-in-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="p-4 pt-2">
            <PreguntasDeArea areaId={areaId} indicadores={indicadores} {...rest} />
          </div>
        </div>
      </div>
    </Card>
  );
}