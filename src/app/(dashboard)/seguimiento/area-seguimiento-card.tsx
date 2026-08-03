"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { areasMeta, escalaEvolucion } from "./data";
import type { SupabaseArea } from "./data";

interface AreaSeguimientoCardProps {
  area: SupabaseArea;
  valor?: number;
  onValor: (v: number) => void;
  comentario: string;
  onComentario: (t: string) => void;
}

export function AreaSeguimientoCard({
  area,
  valor,
  onValor,
  comentario,
  onComentario,
}: AreaSeguimientoCardProps) {
  const [abierto, setAbierto] = useState(comentario.length > 0);
  const meta = areasMeta[area.id];
  const Icon = meta?.icon;

  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none" aria-hidden>{meta?.emoji ?? "•"}</span>
          <span className="flex-1 text-sm font-medium">{area.nombre}</span>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>

        <div className="flex gap-1.5" role="group" aria-label={`Estado de ${area.nombre}`}>
          {escalaEvolucion.map((nivel) => {
            const activo = valor === nivel.valor;
            return (
              <button
                key={nivel.valor}
                type="button"
                onClick={() => onValor(nivel.valor)}
                aria-pressed={activo}
                title={nivel.ayuda}
                className={cn(
                  "flex-1 min-w-0 h-9 rounded-lg text-[11px] sm:text-xs font-medium leading-tight px-1 border transition-all duration-150 cursor-pointer text-center",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-1",
                  activo
                    ? cn(nivel.cls, "scale-[1.02] shadow-sm")
                    : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted/80 hover:text-foreground"
                )}
              >
                <span className="mr-1">{nivel.emoji}</span>
                {nivel.label}
              </button>
            );
          })}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setAbierto((o) => !o)}
            aria-expanded={abierto}
            className={cn(
              "inline-flex items-center gap-1.5 text-[11px] font-medium rounded-md px-1.5 py-0.5 transition-colors",
              comentario ? "text-primary hover:text-primary/80" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquarePlus className="h-3 w-3" />
            {comentario ? "Comentario agregado" : "Agregar comentario"}
            <svg className={cn("h-3 w-3 transition-transform duration-200", abierto && "rotate-180")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <div className={cn("grid transition-all duration-200 ease-in-out", abierto ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0")}>
            <div className="overflow-hidden">
              <Textarea
                rows={2}
                value={comentario}
                onChange={(e) => onComentario(e.target.value)}
                placeholder="Escribí un comentario..."
                className="text-sm"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}