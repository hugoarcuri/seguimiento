"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap, Check, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoriasColapsables } from "./categoria-card";
import { PersonaOracionForm } from "./persona-oracion-form";
import { desafiosPredefinidos } from "./data";
import type { SupabaseArea, SupabaseIndicador } from "./data";
import type { ReunionFormState } from "./use-reunion-form";

interface ReunionFormProps {
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
        "flex-1 h-10 rounded-lg text-sm font-medium transition-all cursor-pointer border",
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

export function ReunionForm({ w, areas, indicadores }: ReunionFormProps) {
  const base = {
    areas,
    indicadores,
    valores: w.valores,
    onValor: (id: number, v: number) => w.setValores((prev) => ({ ...prev, [id]: v })),
    evalObs: w.evalObs,
    onEvalObs: (id: number, t: string) => w.setEvalObs((prev) => ({ ...prev, [id]: t })),
  };

  return (
    <div className="space-y-4">
      <CategoriasColapsables areaIds={[1]} {...base} />
      <CategoriasColapsables areaIds={[2]} {...base} />

      <Card>
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Estudios / Trabajo</CardTitle>
          <CardDescription className="text-xs">Marcá qué corresponde para ocultar lo que no aplica</CardDescription>
        </CardHeader>
        <CardContent className="p-3 space-y-3">
          <div className="flex gap-2">
            <ChipActivo
              label="¿Estudia?"
              activo={w.estudios}
              onClick={() => {
                const nuevo = !w.estudios;
                w.setEstudios(nuevo);
                w.setCompromisos((prev) =>
                  nuevo
                    ? prev.filter((x) => x !== "Seguir estudiando")
                    : prev.includes("Seguir estudiando") ? prev : [...prev, "Seguir estudiando"]
                );
              }}
            />
            <ChipActivo
              label="¿Trabaja?"
              activo={w.trabajo}
              onClick={() => {
                const nuevo = !w.trabajo;
                w.setTrabajo(nuevo);
                w.setCompromisos((prev) =>
                  nuevo
                    ? prev.filter((x) => x !== "Encontrar trabajo")
                    : prev.includes("Encontrar trabajo") ? prev : [...prev, "Encontrar trabajo"]
                );
              }}
            />
          </div>
          {w.estudios && <CategoriasColapsables areaIds={[3]} {...base} />}
          {w.trabajo && <CategoriasColapsables areaIds={[4]} {...base} />}
        </CardContent>
      </Card>

      <CategoriasColapsables areaIds={[5, 6, 7]} {...base} />

      <Card>
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Cierre de la reunión</CardTitle>
          <CardDescription className="text-xs">Resumen breve de la reunión</CardDescription>
        </CardHeader>
        <CardContent className="p-3 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Lo más positivo de la semana</Label>
            <Textarea rows={2} className="text-sm" value={w.positivo} onChange={(e) => w.setPositivo(e.target.value)} placeholder="¿Qué se destacó esta semana?" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Principal desafío</Label>
            <Textarea rows={2} className="text-sm" value={w.desafioPrincipal} onChange={(e) => w.setDesafioPrincipal(e.target.value)} placeholder="¿Qué cuesta más hoy?" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Compromisos para la próxima semana</Label>
            <div className="flex flex-wrap gap-1.5">
              {desafiosPredefinidos.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => w.setCompromisos(w.compromisos.includes(d) ? w.compromisos.filter((x) => x !== d) : [...w.compromisos, d])}
                  aria-pressed={w.compromisos.includes(d)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                    w.compromisos.includes(d)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {w.compromisos.includes(d) && <Check className="h-3 w-3" />}
                  {d}
                </button>
              ))}
            </div>
            <Input placeholder="Otro compromiso personalizado..." className="h-9 text-sm" value={w.desafioPersonalizado} onChange={(e) => w.setDesafioPersonalizado(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Próxima reunión</Label>
            <Input type="date" className="h-9 text-sm" value={w.proximaReunion} onChange={(e) => w.setProximaReunion(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Personas por las que ora</CardTitle>
          <CardDescription className="text-xs">Registrá las personas por las que el discípulo está orando</CardDescription>
        </CardHeader>
        <CardContent className="p-3 space-y-3">
          {w.personasOracion.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-sm bg-muted/30 rounded-lg p-2">
              <span className="flex-1 truncate">{p.nombre} {p.apellido}</span>
              <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted shrink-0">{p.estado}</span>
              <button type="button" onClick={() => w.setPersonasOracion((prev) => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-xs font-medium shrink-0">Quitar</button>
            </div>
          ))}
          <PersonaOracionForm onAgregar={(p) => w.setPersonasOracion((prev) => [...prev, p])} />
        </CardContent>
      </Card>
    </div>
  );
}