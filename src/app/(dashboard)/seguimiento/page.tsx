"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, TrendingUp, TrendingDown, Minus, Book, Heart, Users, Target, Clock, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

const areaLabels: Record<string, string> = {
  comunion_dios: "Comunión con Dios",
  comunion_iglesia: "Comunión con la Iglesia",
  caracter: "Carácter cristiano",
  mision: "Misión",
};

const areaIcons: Record<string, any> = {
  comunion_dios: Book,
  comunion_iglesia: Users,
  caracter: Heart,
  mision: Target,
};

const areaColors: Record<string, string> = {
  comunion_dios: "hsl(var(--chart-1))",
  comunion_iglesia: "hsl(var(--chart-2))",
  caracter: "hsl(var(--chart-3))",
  mision: "hsl(var(--chart-4))",
};

const valorLabels = ["Nunca", "Muy poco", "A veces", "Frecuentemente", "Constante"];
const valorColors = ["bg-gray-300", "bg-red-400", "bg-amber-400", "bg-lime-400", "bg-emerald-500"];

export default function SeguimientoPage() {
  const supabase = createClient();
  const [discipulos, setDiscipulos] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [indicadoresDef, setIndicadoresDef] = useState<any[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [valores, setValores] = useState<Record<number, number>>({});
  const [historial, setHistorial] = useState<any[]>([]);
  const [notaTexto, setNotaTexto] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const discipulo = discipulos.find((d) => d.id === selectedId);

  useEffect(() => {
    supabase.from("discipulos").select("*, etapas:etapa_id(*)").order("apellido").then((res) => {
      setDiscipulos(res.data || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const d = discipulos.find((x) => x.id === selectedId);
    if (!d) return;

    supabase.from("seguimiento_indicadores_def").select("*").eq("etapa_id", d.etapa_id).order("orden").then((res) => {
      setIndicadoresDef(res.data || []);
    });

    supabase.from("seguimiento_evaluaciones").select("*, indicador_def_id, valor, fecha").eq("discipulo_id", selectedId).order("fecha", { ascending: false }).then((res) => {
      const evs = res.data || [];
      setEvaluaciones(evs);

      const latest: Record<number, number> = {};
      const seen = new Set();
      evs.forEach((ev) => {
        const key = `${ev.indicador_def_id}-${ev.fecha}`;
        if (!seen.has(key)) { seen.add(key); }
        if (!(ev.indicador_def_id in latest)) {
          latest[ev.indicador_def_id] = ev.valor;
        }
      });
      setValores(latest);
    });

    supabase.from("seguimiento_historial").select("*").eq("discipulo_id", selectedId).order("fecha", { ascending: false }).then((res) => {
      setHistorial(res.data || []);
    });
  }, [selectedId]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Debés iniciar sesión"); setSaving(false); return }

    const today = format(new Date(), "yyyy-MM-dd");
    const inserts = indicadoresDef
      .filter((def) => valores[def.id] !== undefined)
      .map((def) => ({
        discipulo_id: selectedId,
        lider_id: user.id,
        indicador_def_id: def.id,
        valor: valores[def.id],
        fecha: today,
      }));

    if (inserts.length === 0) { toast.error("No hay cambios para guardar"); setSaving(false); return }

    for (const ins of inserts) {
      const { error } = await supabase.from("seguimiento_evaluaciones").upsert(ins, {
        onConflict: "discipulo_id, indicador_def_id, fecha",
      });
      if (error) { toast.error("Error al guardar"); setSaving(false); return }
    }

    toast.success("Evaluación guardada");
    setSaving(false);

    supabase.from("seguimiento_evaluaciones").select("*, indicador_def_id, valor, fecha").eq("discipulo_id", selectedId).order("fecha", { ascending: false }).then((res) => {
      setEvaluaciones(res.data || []);
    });
  };

  const addNota = async () => {
    if (!notaTexto.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("seguimiento_historial").insert({ discipulo_id: selectedId, lider_id: user.id, contenido: notaTexto.trim() });
    setNotaTexto("");
    supabase.from("seguimiento_historial").select("*").eq("discipulo_id", selectedId).order("fecha", { ascending: false }).then((res) => setHistorial(res.data || []));
    toast.success("Nota agregada");
  };

  const avgByArea = (area: string) => {
    const defs = indicadoresDef.filter((d) => d.area === area);
    if (defs.length === 0) return 0;
    const total = defs.reduce((s, d) => s + (valores[d.id] ?? 0), 0);
    return Math.round((total / (defs.length * 4)) * 100);
  };

  const getHistoryByArea = (area: string) => {
    const defs = indicadoresDef.filter((d) => d.area === area);
    const defIds = new Set(defs.map((d) => d.id));
    const byDate: Record<string, number[]> = {};
    evaluaciones.forEach((ev) => {
      if (!defIds.has(ev.indicador_def_id)) return;
      if (!byDate[ev.fecha]) byDate[ev.fecha] = [];
      byDate[ev.fecha].push(ev.valor);
    });
    return Object.entries(byDate)
      .map(([fecha, vals]) => ({ fecha, promedio: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  };

  const radarData = Object.keys(areaLabels).map((area) => ({
    area: areaLabels[area],
    valor: avgByArea(area),
  }));

  const tendencia = (area: string) => {
    const hist = getHistoryByArea(area);
    if (hist.length < 2) return { icon: Minus, color: "text-muted-foreground" };
    const last = hist[hist.length - 1].promedio;
    const prev = hist[hist.length - 2].promedio;
    if (last > prev) return { icon: TrendingUp, color: "text-emerald-500" };
    if (last < prev) return { icon: TrendingDown, color: "text-red-500" };
    return { icon: Minus, color: "text-muted-foreground" };
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Seguimiento</h1>
          <p className="text-muted-foreground">Acompañamiento integral del discípulo</p>
        </div>
        <div className="w-72">
          <Select value={selectedId} onValueChange={(v: any) => setSelectedId(v ?? "")}>
            <SelectTrigger><SelectValue placeholder="Seleccionar discípulo" /></SelectTrigger>
            <SelectContent>
              {discipulos.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.apellido}, {d.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedId ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Seleccioná un discípulo para ver su seguimiento</CardContent></Card>
      ) : discipulo && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            {Object.entries(areaLabels).map(([key, label]) => {
              const Icon = areaIcons[key];
              const val = avgByArea(key);
              const { icon: TrendIcon, color } = tendencia(key);
              return (
                <Card key={key}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">{label}</span>
                      </div>
                      <TrendIcon className={`h-4 w-4 ${color}`} />
                    </div>
                    <p className="text-2xl font-bold">{val}%</p>
                    <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${val >= 70 ? "bg-emerald-500" : val >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${val}%` }} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Índice de Salud Espiritual</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="area" className="text-xs" />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} />
                      <Radar dataKey="valor" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Evolución por Área</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(areaLabels).slice(0, 2).map(([key, label]) => {
                  const data = getHistoryByArea(key);
                  if (data.length === 0) return <p key={key} className="text-sm text-muted-foreground">{label}: Sin datos</p>;
                  return (
                    <div key={key}>
                      <p className="text-xs font-medium mb-1">{label}</p>
                      <div className="flex items-end gap-1 h-8">
                        {data.map((d, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                            <div className="w-full rounded-t" style={{ height: `${(d.promedio / 4) * 100}%`, backgroundColor: areaColors[key], minHeight: "4px" }} />
                            <span className="text-[10px] text-muted-foreground">{format(new Date(d.fecha), "d/M")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Ver más</summary>
                  <div className="space-y-3 mt-2">
                    {Object.entries(areaLabels).slice(2).map(([key, label]) => {
                      const data = getHistoryByArea(key);
                      if (data.length === 0) return <p key={key} className="text-sm text-muted-foreground">{label}: Sin datos</p>;
                      return (
                        <div key={key}>
                          <p className="text-xs font-medium mb-1">{label}</p>
                          <div className="flex items-end gap-1 h-8">
                            {data.map((d, i) => (
                              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                                <div className="w-full rounded-t" style={{ height: `${(d.promedio / 4) * 100}%`, backgroundColor: areaColors[key], minHeight: "4px" }} />
                                <span className="text-[10px] text-muted-foreground">{format(new Date(d.fecha), "d/M")}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Indicadores - {discipulo.etapas?.nombre || `Nivel ${discipulo.etapa_id}`}</CardTitle>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                Guardar Evaluación
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {Object.entries(areaLabels).map(([key, label]) => {
                  const items = indicadoresDef.filter((d) => d.area === key);
                  if (items.length === 0) return null;
                  const Icon = areaIcons[key];
                  return (
                    <div key={key} className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium border-b pb-1.5">
                        <Icon className="h-4 w-4" /> {label}
                      </div>
                      {items.map((def) => (
                        <div key={def.id} className="flex items-center gap-2">
                          <div className="flex-1 text-sm">{def.indicador}</div>
                          <div className="flex gap-1">
                            {valorLabels.map((_, v) => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => setValores((prev) => ({ ...prev, [def.id]: v }))}
                                className={`w-7 h-7 rounded-full text-[10px] font-medium transition-all ${
                                  (valores[def.id] ?? -1) === v
                                    ? `${valorColors[v]} text-white scale-110 shadow-sm`
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial Pastoral</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Agregar nota sobre el discípulo..."
                  className="min-h-[60px] text-sm"
                  value={notaTexto}
                  onChange={(e) => setNotaTexto(e.target.value)}
                />
                <Button size="sm" className="self-end" onClick={addNota} disabled={!notaTexto.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {historial.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin notas aún</p>
                ) : (
                  historial.map((n) => (
                    <div key={n.id} className="border-b pb-2 last:border-0">
                      <p className="text-sm">{n.contenido}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(n.fecha), "dd/MM/yyyy")}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
