"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardProgressProps {
  par: number;
  totalPasos: number;
  pct: number;
  titulos: string[];
}

export function WizardProgress({ par, totalPasos, pct, titulos }: WizardProgressProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {titulos.map((title, i) => {
          const paso = i + 1;
          const activo = paso === par;
          const hecho = paso < par;
          return (
            <div
              key={i}
              className={cn(
                "flex flex-1 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium whitespace-nowrap transition-colors",
                activo ? "bg-primary/10 text-primary" : hecho ? "text-muted-foreground" : "text-muted-foreground/50"
              )}
            >
              <span className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0",
                hecho ? "bg-primary text-primary-foreground" : activo ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {hecho ? <Check className="h-3 w-3" /> : paso}
              </span>
              <span className="hidden sm:inline">{title}</span>
            </div>
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