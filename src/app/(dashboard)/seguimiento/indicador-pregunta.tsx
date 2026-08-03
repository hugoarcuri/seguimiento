"use client";

import { ComentarioExpandible } from "./comentario-expandible";
import { escalaCrecimiento } from "./data";
import { cn } from "@/lib/utils";

interface IndicadorPreguntaProps {
  nombre: string;
  valor?: number;
  onValor: (v: number) => void;
  comentario: string;
  onComentario: (t: string) => void;
}

export function IndicadorPregunta({ nombre, valor, onValor, comentario, onComentario }: IndicadorPreguntaProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{nombre}</p>
      <div className="flex gap-1.5">
        {escalaCrecimiento.map((nivel) => {
          const activo = valor === nivel.valor;
          return (
            <button
              key={nivel.valor}
              type="button"
              onClick={() => onValor(nivel.valor)}
              aria-pressed={activo}
              title={nivel.ayuda}
              className={cn(
                "flex-1 min-w-0 h-10 rounded-lg text-[11px] sm:text-xs font-medium leading-tight px-1.5 transition-all duration-150 cursor-pointer border text-center",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-1",
                activo
                  ? cn(nivel.cls, "scale-[1.02] shadow-sm")
                  : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {nivel.label}
            </button>
          );
        })}
      </div>
      <ComentarioExpandible value={comentario} onChange={onComentario} />
    </div>
  );
}