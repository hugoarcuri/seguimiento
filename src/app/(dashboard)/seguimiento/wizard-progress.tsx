"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardProgressProps {
  par: number;
  totalPasos: number;
  pct: number;
  titulos: string[];
  onSelectPaso?: (paso: number) => void;
}

export function WizardProgress({ par, totalPasos, pct, titulos, onSelectPaso }: WizardProgressProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Pasos de la evaluación">
        {titulos.map((title, i) => {
          const paso = i + 1;
          const activo = paso === par;
          const hecho = paso < par;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectPaso?.(paso)}
              disabled={!onSelectPaso}
              className={cn(
                "flex flex-1 items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] sm:text-xs font-medium whitespace-nowrap transition-colors cursor-pointer text-left",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                activo ? "bg-primary/10 text-primary" : hecho ? "text-muted-foreground hover:bg-muted/40" : "text-muted-foreground/50 hover:bg-muted/40"
              )}
            >
              <span className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0",
                hecho ? "bg-primary text-primary-foreground" : activo ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {hecho ? <Check className="h-3 w-3" /> : paso}
              </span>
              <span className="hidden sm:inline">{title}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso de la evaluación">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          Paso {par} de {totalPasos} · {pct}%
        </span>
      </div>
    </div>
  );
}
