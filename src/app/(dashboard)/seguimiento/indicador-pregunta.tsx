"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ComentarioExpandible } from "./comentario-expandible";
import { defaultOpts, ministerios, opcionesIndicador } from "./data";
import { cn } from "@/lib/utils";

interface IndicadorPreguntaProps {
  nombre: string;
  objetivo?: string;
  valor?: number;
  onValor: (v: number) => void;
  comentario: string;
  onComentario: (t: string) => void;
  ministerioSeleccionado: string;
  onMinisterio: (v: string) => void;
  ministerioCustom: string;
  onMinisterioCustom: (v: string) => void;
}

export function IndicadorPregunta({
  nombre,
  objetivo,
  valor,
  onValor,
  comentario,
  onComentario,
  ministerioSeleccionado,
  onMinisterio,
  ministerioCustom,
  onMinisterioCustom,
}: IndicadorPreguntaProps) {
  const opts = opcionesIndicador[nombre] || { type: "escala" as const, labels: defaultOpts };
  const esServicio = nombre === "Sirvió esta semana";

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-foreground">{nombre}</p>
        {objetivo && <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{objetivo}</p>}
      </div>

      {esServicio && valor === 1 ? (
        <div className="space-y-2">
          <div className="flex gap-1.5">
            {opts.labels.map((label, v) => (
              <button
                key={v}
                type="button"
                onClick={() => onValor(v)}
                aria-pressed={valor === v}
                className={cn(
                  "flex-1 h-9 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-1",
                  valor === v
                    ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Select value={ministerioSeleccionado} onValueChange={(v) => onMinisterio(v?.toString() ?? "")}>
              <SelectTrigger className="h-9 text-xs flex-1 min-w-[180px]"><SelectValue placeholder="Seleccionar ministerio" /></SelectTrigger>
              <SelectContent>
                {ministerios.map((m) => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}
                <SelectItem value="Otro" className="text-xs">Otro</SelectItem>
              </SelectContent>
            </Select>
            {ministerioSeleccionado === "Otro" && (
              <Input placeholder="¿Cuál?" className="h-9 text-xs flex-1 min-w-[140px]" value={ministerioCustom} onChange={(e) => onMinisterioCustom(e.target.value)} />
            )}
          </div>
        </div>
      ) : opts.type === "si_no" ? (
        <div className="flex gap-1.5">
          {opts.labels.map((label, v) => (
            <button
              key={v}
              type="button"
              onClick={() => onValor(v)}
              aria-pressed={valor === v}
              className={cn(
                "flex-1 h-10 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-1",
                valor === v
                  ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex gap-1">
            {opts.labels.map((label, v) => (
              <button
                key={v}
                type="button"
                onClick={() => onValor(v)}
                aria-pressed={valor === v}
                title={label}
                className={cn(
                  "flex-1 h-10 rounded-lg text-[11px] font-medium transition-all duration-150 cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-1",
                  valor === v
                    ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <ComentarioExpandible value={comentario} onChange={onComentario} />
    </div>
  );
}
