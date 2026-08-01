"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, TrendingUp, TrendingDown, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "@/components/recharts-dynamic";
interface AreaMeta { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
interface SupabaseArea { id: number; nombre: string; orden: number }
interface SupabaseAlerta { id: string; discipulo_id: string; mensaje: string; activa: boolean }

interface ResultadoEvaluacionProps {
  radarData: { area: string; valor: number }[];
  evolutionData: { fecha: string; [key: string]: unknown }[];
  monthlyData: { mes: string; [key: string]: unknown }[];
  fortalezas: { id: number; nombre: string; valor: number }[];
  debilidades: { id: number; nombre: string; valor: number }[];
  alertas: SupabaseAlerta[];
  areas: SupabaseArea[];
  areasMeta: Record<number, AreaMeta>;
  indicadores: { id: number; area_id: number; nombre: string }[];
  saving?: boolean;
  onNuevaEvaluacion: () => void;
}

export function ResultadoEvaluacion({
  radarData,
  evolutionData: evoData,
  monthlyData: mData,
  fortalezas,
  debilidades,
  alertas,
  areas,
  areasMeta,
  indicadores,
  saving,
  onNuevaEvaluacion,
}: ResultadoEvaluacionProps) {
  return (
    <div className="space-y-4">
      <Card className="border-emerald-200 dark:border-emerald-800">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Evaluación guardada</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), "dd/MM/yyyy")} ·{" "}
              {indicadores.filter((i) => radarData.find((r) => r.area === areas.find((a) => a.id === i.area_id)?.nombre)).length} indicadores evaluados
            </p>
          </div>
          <Button size="sm" variant="outline" className="ml-auto" onClick={onNuevaEvaluacion} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Nueva evaluación
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3 pb-0"><CardTitle className="text-sm">Índice de Salud Espiritual</CardTitle></CardHeader>
        <CardContent className="p-3">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="area" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} />
                <Radar dataKey="valor" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3 pb-0"><CardTitle className="text-sm">Evolución</CardTitle></CardHeader>
        <CardContent className="p-3">
          <div className="h-[200px]">
            {evoData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Sin datos históricos</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 9 }} tickFormatter={(v: string) => format(parseISO(v), "dd/MM")} />
                  <YAxis domain={[0, 5]} tick={false} />
                  <Tooltip labelFormatter={(v) => format(parseISO(v as string), "dd/MM/yyyy")} />
                  {areas.filter((a) => evoData.some((ed) => ed[String(a.id)] !== undefined)).map((a) => (
                    <Bar key={a.id} dataKey={a.id} name={a.nombre} fill={areasMeta[a.id]?.color || "hsl(var(--primary))"} stackId="a" />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {mData.length > 0 && (
        <Card>
          <CardHeader className="p-3 pb-0"><CardTitle className="text-sm">Resumen Mensual</CardTitle></CardHeader>
          <CardContent className="p-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b text-muted-foreground">
                <th className="text-left py-1 pr-2">Mes</th>
                {areas.map((a) => <th key={a.id} className="text-center py-1 px-1">{a.nombre}</th>)}
              </tr></thead>
              <tbody>
                {mData.map((row) => (
                  <tr key={row.mes as string} className="border-b last:border-0">
                    <td className="py-1.5 pr-2 font-medium whitespace-nowrap">{format(parseISO((row.mes as string) + "-01"), "MMMM yyyy")}</td>
                    {areas.map((a) => {
                      const v = row[String(a.id)] as number | undefined;
                      return <td key={a.id} className="text-center py-1.5 px-1">
                        <span className={cn("inline-block w-6 h-6 rounded-full text-[10px] font-bold leading-6", v !== undefined && v >= 70 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" : v !== undefined && v >= 40 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" : v !== undefined ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" : "")}>{v ?? "-"}</span>
                      </td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="p-3 pb-0"><CardTitle className="text-xs flex items-center gap-1"><TrendingUp className="h-3 w-3 text-emerald-500" /> Fortalezas</CardTitle></CardHeader>
          <CardContent className="p-3">
            {fortalezas.length === 0 ? <p className="text-xs text-muted-foreground">Sin datos</p> : (
              <ul className="space-y-0.5">{fortalezas.map((f) => <li key={f.id} className="flex items-center gap-1.5 text-xs"><span className="w-1 h-1 rounded-full bg-emerald-500" />{f.nombre} <span className="text-muted-foreground">({f.valor}%)</span></li>)}</ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-0"><CardTitle className="text-xs flex items-center gap-1"><TrendingDown className="h-3 w-3 text-red-500" /> A crecer</CardTitle></CardHeader>
          <CardContent className="p-3">
            {debilidades.length === 0 ? <p className="text-xs text-muted-foreground">Sin datos</p> : (
              <ul className="space-y-0.5">{debilidades.map((d) => <li key={d.id} className="flex items-center gap-1.5 text-xs"><span className="w-1 h-1 rounded-full bg-red-500" />{d.nombre} <span className="text-muted-foreground">({d.valor}%)</span></li>)}</ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-0"><CardTitle className="text-xs flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-500" /> Alertas</CardTitle></CardHeader>
          <CardContent className="p-3">
            {alertas.length === 0 ? <p className="text-xs text-muted-foreground">Sin alertas</p> : (
              <ul className="space-y-1">{alertas.map((a) => <li key={a.id} className="flex items-start gap-1 text-xs"><AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />{a.mensaje}</li>)}</ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
