"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileDown, Users, CalendarCheck, Target, CheckCircle2, ListTodo, Heart } from "lucide-react";
import { generarReportePDF, type ReporteData } from "@/lib/reporte-pdf";
import { cn } from "@/lib/utils";

export type PeriodoReporte = "1m" | "3m" | "6m" | "1y";

export const PERIODOS: { id: PeriodoReporte; label: string; dias: number }[] = [
  { id: "1m", label: "1 mes", dias: 30 },
  { id: "3m", label: "3 meses", dias: 90 },
  { id: "6m", label: "6 meses", dias: 180 },
  { id: "1y", label: "1 año", dias: 365 },
];

interface DiscipuladorOption {
  id: string;
  nombre: string;
  apellido: string;
}

interface ReportesClientProps {
  data: ReporteData;
  discipuladores: DiscipuladorOption[];
  discipuladorId: string;
  onDiscipuladorChange: (id: string) => void;
  periodo: PeriodoReporte;
  onPeriodoChange: (p: PeriodoReporte) => void;
}

export function ReportesClient({
  data,
  discipuladores,
  discipuladorId,
  onDiscipuladorChange,
  periodo,
  onPeriodoChange,
}: ReportesClientProps) {
  const totalDiscipulos = data.kpis.discipulosTotal;

  const kpis = useMemo(
    () => [
      {
        label: "Discípulos activos",
        valor: `${data.kpis.discipulosActivos} / ${totalDiscipulos}`,
        icon: Users,
        color: "text-blue-600 dark:text-blue-400",
      },
      {
        label: "Encuentros en el período",
        valor: data.kpis.encuentrosPeriodo,
        icon: CalendarCheck,
        color: "text-emerald-600 dark:text-emerald-400",
      },
      {
        label: "Progreso promedio",
        valor: data.kpis.progresoPromedio !== null ? `${data.kpis.progresoPromedio}%` : "—",
        icon: Target,
        color: "text-violet-600 dark:text-violet-400",
      },
      {
        label: "Tareas pendientes",
        valor: data.kpis.tareasPendientes,
        icon: ListTodo,
        color: "text-amber-600 dark:text-amber-400",
      },
      {
        label: "Objetivos completados",
        valor: `${data.kpis.objetivosCompletados} / ${data.kpis.objetivosCompletados + data.kpis.objetivosPendientes}`,
        icon: CheckCircle2,
        color: "text-sky-600 dark:text-sky-400",
      },
      {
        label: "Personas de evangelismo",
        valor: data.kpis.personasEvangelismo,
        icon: Heart,
        color: "text-rose-600 dark:text-rose-400",
      },
    ],
    [data, totalDiscipulos]
  );

  const descargar = () => generarReportePDF(data);

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Reportes</h1>
          <p className="text-xs text-muted-foreground">Generá un informe PDF de un discipulador</p>
        </div>
        <Button onClick={descargar} className="shrink-0">
          <FileDown className="h-4 w-4 mr-1" /> Generar PDF
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">Discipulador</label>
          <select
            className="w-full h-11 md:h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
            value={discipuladorId}
            onChange={(e) => onDiscipuladorChange(e.target.value)}
          >
            {discipuladores.map((d) => (
              <option key={d.id} value={d.id}>
                {d.apellido}, {d.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Período</label>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {PERIODOS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPeriodoChange(p.id)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  periodo === p.id
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-semibold">
            {data.discipulador ? `${data.discipulador.nombre} ${data.discipulador.apellido}` : "Sin discipulador"}
            <span className="font-normal text-muted-foreground text-xs ml-2">
              Período {data.periodoLabel} · {data.desde.split("-").reverse().join("/")} al {data.hasta.split("-").reverse().join("/")}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 break-words">{data.discipulador?.email}</p>
        </CardContent>
      </Card>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label}>
              <CardContent className="p-3 flex flex-col items-start gap-1 min-w-0">
                <Icon className={cn("h-5 w-5", k.color)} />
                <p className="text-lg font-bold leading-none truncate w-full">{k.valor}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{k.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Discípulos</h2>
            <Badge variant="secondary" className="text-[10px]">{data.discipulos.length}</Badge>
          </div>
          {data.discipulos.length === 0 ? (
            <p className="text-xs text-muted-foreground">Este discipulador no tiene discípulos.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b">
                    <th className="py-1.5 pr-2 font-medium">Nombre</th>
                    <th className="py-1.5 pr-2 font-medium">Etapa</th>
                    <th className="py-1.5 pr-2 font-medium">Salud</th>
                    <th className="py-1.5 pr-2 font-medium text-right">Progreso</th>
                    <th className="py-1.5 pr-2 font-medium text-right">Encuentros</th>
                    <th className="py-1.5 font-medium text-right">Tareas pend.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.discipulos.map((d) => (
                    <tr key={d.id} className="border-b border-muted/50">
                      <td className="py-1.5 pr-2 whitespace-nowrap">{d.apellido}, {d.nombre}</td>
                      <td className="py-1.5 pr-2">{d.etapa}</td>
                      <td className="py-1.5 pr-2"><Badge variant="outline" className="text-[10px]">{d.salud}</Badge></td>
                      <td className="py-1.5 pr-2 text-right">{d.progreso !== null ? `${d.progreso}%` : "—"}</td>
                      <td className="py-1.5 pr-2 text-right">{d.encuentrosPeriodo}</td>
                      <td className="py-1.5 text-right">{d.tareasPendientes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
