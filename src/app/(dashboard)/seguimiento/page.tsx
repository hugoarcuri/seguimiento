"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, TrendingDown, Minus, Book, Heart, Users, Target, Sparkles, Hand, GraduationCap, Crown, Plus, User as UserIcon, Calendar, Clock, MapPin, CheckCircle2, AlertTriangle, Lightbulb, ChevronDown, ChevronUp, FileText, MessageSquare, ClipboardList } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const areasMeta: Record<number, { label: string; icon: any; color: string }> = {
  1: { label: "Vida Devocional", icon: Book, color: "hsl(var(--chart-1))" },
  2: { label: "Relación con Dios", icon: Heart, color: "hsl(var(--chart-2))" },
  3: { label: "Carácter Cristiano", icon: Sparkles, color: "hsl(var(--chart-3))" },
  4: { label: "Comunión", icon: Users, color: "hsl(var(--chart-4))" },
  5: { label: "Servicio", icon: Hand, color: "hsl(var(--chart-5))" },
  6: { label: "Evangelismo", icon: Target, color: "hsl(var(--chart-6))" },
  7: { label: "Discipulado", icon: GraduationCap, color: "hsl(var(--chart-7))" },
  8: { label: "Liderazgo", icon: Crown, color: "hsl(var(--chart-8))" },
};

const valorLabels = ["No aplica", "Nunca", "Rara vez", "Algunas veces", "Frecuentemente", "Siempre"];
const valorColors = ["bg-gray-300", "bg-red-400", "bg-orange-400", "bg-amber-400", "bg-lime-400", "bg-emerald-500"];

const estadoDesafioColor: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  en_proceso: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completado: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  no_realizado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function SeguimientoPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [discipulos, setDiscipulos] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [indicadores, setIndicadores] = useState<any[]>([]);
  const [objetivosNivel, setObjetivosNivel] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string>("");
  const [reuniones, setReuniones] = useState<any[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [desafios, setDesafios] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [valores, setValores] = useState<Record<number, number>>({});
  const [noEvaluados, setNoEvaluados] = useState<Record<number, boolean>>({});
  const [evalObservaciones, setEvalObservaciones] = useState<Record<number, string>>({});

  const [showNuevaReunion, setShowNuevaReunion] = useState(false);
  const [nuevaReunion, setNuevaReunion] = useState<{ fecha: string; lugar: string; duracion_minutos: number; tema_tratado: string; observaciones_generales: string; compromisos: string; pedidos_oracion: string; respuestas_oracion: string; proxima_reunion: string }>({ fecha: format(new Date(), "yyyy-MM-dd"), lugar: "", duracion_minutos: 60, tema_tratado: "", observaciones_generales: "", compromisos: "", pedidos_oracion: "", respuestas_oracion: "", proxima_reunion: "" });
  const [pastoral, setPastoral] = useState({ animo_espiritual: "", evidencias_crecimiento: "", luchas_desafios: "", fortalezas: "", enfoque_proximo: "" });
  const [nuevoDesafio, setNuevoDesafio] = useState({ descripcion: "", fecha_vencimiento: "" });
  const [showNuevoDesafio, setShowNuevoDesafio] = useState(false);
  const [activeTab, setActiveTab] = useState<"evaluacion" | "reuniones" | "desafios" | "alertas">("evaluacion");

  const discipulo = discipulos.find((d) => d.id === selectedId);
  const indicadoresPorArea = areas.map((a) => ({ area: a, items: indicadores.filter((i) => i.area_id === a.id) }));

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    Promise.all([
      supabase.from("discipulos").select("*, etapas:etapa_id(*)").order("apellido"),
      supabase.from("areas").select("*").order("orden"),
      supabase.from("indicadores").select("*").order("orden"),
      supabase.from("indicador_nivel").select("*"),
    ]).then(([dRes, aRes, iRes, oRes]) => {
      setDiscipulos(dRes.data || []);
      setAreas(aRes.data || []);
      setIndicadores(iRes.data || []);
      const objMap: Record<string, string> = {};
      (oRes.data || []).forEach((o: any) => { objMap[`${o.indicador_id}-${o.nivel_id}`] = o.objetivo; });
      setObjetivosNivel(objMap);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    Promise.all([
      supabase.from("reuniones").select("*").eq("discipulo_id", selectedId).order("fecha", { ascending: false }),
      supabase.from("desafios").select("*").eq("discipulo_id", selectedId).order("fecha_asignado", { ascending: false }),
      supabase.from("alertas").select("*").eq("discipulo_id", selectedId).eq("activa", true).order("created_at", { ascending: false }),
    ]).then(([rRes, dRes, aRes]) => {
      setReuniones(rRes.data || []);
      setDesafios(dRes.data || []);
      setAlertas(aRes.data || []);
    });
  }, [selectedId]);

  useEffect(() => {
    if (reuniones.length === 0) { setEvaluaciones([]); return; }
    const ids = reuniones.map((r) => r.id);
    supabase.from("evaluaciones").select("*, indicador_id, valor, no_evaluado, observaciones, reunion_id").in("reunion_id", ids).then((res) => {
      setEvaluaciones(res.data || []);
      const v: Record<number, number> = {};
      const ne: Record<number, boolean> = {};
      const obs: Record<number, string> = {};
      (res.data || []).forEach((ev: any) => {
        if (ev.valor !== null) v[ev.indicador_id] = ev.valor;
        if (ev.no_evaluado) ne[ev.indicador_id] = true;
        if (ev.observaciones) obs[ev.indicador_id] = ev.observaciones;
      });
      setValores(v);
      setNoEvaluados(ne);
      setEvalObservaciones(obs);
    });
  }, [reuniones]);

  const getObjetivo = (indicadorId: number, nivelId: number) => objetivosNivel[`${indicadorId}-${nivelId}`] || "";

  const avgByArea = (areaId: number) => {
    const items = indicadores.filter((i) => i.area_id === areaId);
    if (items.length === 0) return 0;
    const vals = items.map((i) => valores[i.id] ?? -1).filter((v) => v >= 0);
    if (vals.length === 0) return 0;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length / 5) * 100);
  };

  const radarData = areas.map((a) => ({ area: a.nombre, valor: avgByArea(a.id) }));

  const evolutionData = () => {
    const byDate: Record<string, Record<number, number[]>> = {};
    evaluaciones.forEach((ev: any) => {
      if (ev.valor === null) return;
      const ind = indicadores.find((i) => i.id === ev.indicador_id);
      if (!ind) return;
      const reunion = reuniones.find((r) => r.id === ev.reunion_id);
      if (!reunion) return;
      const fecha = reunion.fecha;
      if (!byDate[fecha]) byDate[fecha] = {};
      if (!byDate[fecha][ind.area_id]) byDate[fecha][ind.area_id] = [];
      byDate[fecha][ind.area_id].push(ev.valor);
    });
    return Object.entries(byDate).map(([fecha, areas]) => ({
      fecha,
      ...Object.fromEntries(Object.entries(areas).map(([aid, vals]) => [aid, Math.round((vals as number[]).reduce((a, b) => a + b, 0) / (vals as number[]).length)])),
    })).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(-12);
  };

  const fortalezas = areas.map((a) => ({ id: a.id, nombre: a.nombre, valor: avgByArea(a.id) })).filter((a) => a.valor > 0).sort((a, b) => b.valor - a.valor).slice(0, 3);

  const areasCrecimiento = areas.map((a) => ({ id: a.id, nombre: a.nombre, valor: avgByArea(a.id) })).filter((a) => a.valor > 0).sort((a, b) => a.valor - b.valor).slice(0, 3);

  const recomendaciones = (() => {
    const recs: string[] = [];
    if (!alertas.length) return recs;
    alertas.forEach((a) => recs.push(a.mensaje));
    return recs;
  })();

  const generarAlertas = useCallback(async () => {
    if (!selectedId || !user) return;
    const evs = evaluaciones.filter((ev: any) => ev.valor !== null);
    const indOracion = indicadores.find((i) => i.nombre === "Oración");
    if (indOracion) {
      const vals = evs.filter((ev: any) => ev.indicador_id === indOracion.id).map((ev: any) => ev.valor);
      if (vals.length >= 3 && vals.slice(-3).every((v: number) => v <= 2)) {
        const existe = alertas.some((a) => a.tipo === "oracion_baja" && a.activa);
        if (!existe) {
          await supabase.from("alertas").insert({ discipulo_id: selectedId, tipo: "oracion_baja", mensaje: "El discípulo está perdiendo constancia en su vida de oración." });
        }
      }
    }
    const indAsistencia = indicadores.find((i) => i.nombre === "Asistencia al culto");
    if (indAsistencia) {
      const vals = evs.filter((ev: any) => ev.indicador_id === indAsistencia.id).map((ev: any) => ev.valor);
      if (vals.length > 0 && vals.every((v: number) => v <= 1)) {
        const existe = alertas.some((a) => a.tipo === "asistencia_baja" && a.activa);
        if (!existe) {
          await supabase.from("alertas").insert({ discipulo_id: selectedId, tipo: "asistencia_baja", mensaje: "Recomendación: realizar una visita pastoral." });
        }
      }
    }
    supabase.from("alertas").select("*").eq("discipulo_id", selectedId).eq("activa", true).then((res) => setAlertas(res.data || []));
  }, [selectedId, user, evaluaciones, indicadores, alertas, supabase]);

  useEffect(() => { if (evaluaciones.length > 0) generarAlertas(); }, [evaluaciones.length]);

  const handleSaveEvaluacion = async () => {
    setSaving(true);
    if (!user) { toast.error("Debés iniciar sesión"); setSaving(false); return; }

    const today = format(new Date(), "yyyy-MM-dd");
    let reunion = reuniones.find((r) => r.fecha === today && !r.tema_tratado);
    if (!reunion) {
      const { data } = await supabase.from("reuniones").insert({ discipulo_id: selectedId, lider_id: user.id, fecha: today }).select().single();
      if (data) { reunion = data; setReuniones((prev) => [data, ...prev]); }
    }
    if (!reunion) { toast.error("Error al crear reunión"); setSaving(false); return; }

    const inserts = indicadores.map((ind) => {
      if (noEvaluados[ind.id]) {
        return { reunion_id: reunion.id, indicador_id: ind.id, valor: null, no_evaluado: true, observaciones: evalObservaciones[ind.id] || null };
      }
      if (valores[ind.id] !== undefined) {
        return { reunion_id: reunion.id, indicador_id: ind.id, valor: valores[ind.id], no_evaluado: false, observaciones: evalObservaciones[ind.id] || null };
      }
      return null;
    }).filter(Boolean);

    if (inserts.length === 0) { toast.error("No hay cambios para guardar"); setSaving(false); return; }

    for (const ins of inserts) {
      await supabase.from("evaluaciones").upsert(ins as any, { onConflict: "reunion_id, indicador_id" });
    }

    toast.success("Evaluación guardada");
    setSaving(false);
    supabase.from("evaluaciones").select("*").in("reunion_id", [reunion.id]).then((res) => {
      setEvaluaciones((prev) => [...prev, ...(res.data || [])]);
    });
  };

  const handleCrearReunion = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("reuniones").insert({
      discipulo_id: selectedId, lider_id: user.id, ...nuevaReunion,
      proxima_reunion: nuevaReunion.proxima_reunion || null,
    }).select().single();
    if (error) { toast.error("Error al crear reunión"); return; }
    if (pastoral.animo_espiritual || pastoral.evidencias_crecimiento || pastoral.luchas_desafios || pastoral.fortalezas || pastoral.enfoque_proximo) {
      await supabase.from("observaciones_pastorales").insert({ reunion_id: data.id, ...pastoral });
    }
    setReuniones((prev) => [data, ...prev]);
    setShowNuevaReunion(false);
    setNuevaReunion({ fecha: format(new Date(), "yyyy-MM-dd"), lugar: "", duracion_minutos: 60, tema_tratado: "", observaciones_generales: "", compromisos: "", pedidos_oracion: "", respuestas_oracion: "", proxima_reunion: "" });
    setPastoral({ animo_espiritual: "", evidencias_crecimiento: "", luchas_desafios: "", fortalezas: "", enfoque_proximo: "" });
    toast.success("Reunión registrada");
  };

  const handleCrearDesafio = async () => {
    if (!user || !nuevoDesafio.descripcion.trim()) return;
    await supabase.from("desafios").insert({
      discipulo_id: selectedId, lider_id: user.id,
      descripcion: nuevoDesafio.descripcion.trim(),
      fecha_vencimiento: nuevoDesafio.fecha_vencimiento || null,
    });
    setNuevoDesafio({ descripcion: "", fecha_vencimiento: "" });
    setShowNuevoDesafio(false);
    supabase.from("desafios").select("*").eq("discipulo_id", selectedId).order("fecha_asignado", { ascending: false }).then((res) => setDesafios(res.data || []));
    toast.success("Desafío asignado");
  };

  const cambiarEstadoDesafio = async (id: string, estado: string) => {
    await supabase.from("desafios").update({ estado }).eq("id", id);
    setDesafios((prev) => prev.map((d) => d.id === id ? { ...d, estado } : d));
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Seguimiento</h1>
          <p className="text-muted-foreground">Acompañamiento integral del discípulo</p>
        </div>
      </div>

      {/* DISCIPLE BUTTONS */}
      <div className="flex flex-wrap gap-2">
        {discipulos.length === 0 && <p className="text-sm text-muted-foreground">No hay discípulos</p>}
        {discipulos.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setSelectedId(d.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedId === d.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            <UserIcon className="h-3.5 w-3.5" />
            {d.apellido}, {d.nombre}
          </button>
        ))}
      </div>

      {!selectedId ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Seleccioná un discípulo para ver su seguimiento</CardContent></Card>
      ) : discipulo ? (
        <>
          {/* DISCIPLE DASHBOARD */}
          <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">
                {discipulo.nombre?.[0]}{discipulo.apellido?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{discipulo.nombre} {discipulo.apellido}</h2>
                  <Badge variant="outline">{discipulo.etapas?.nombre || `Nivel ${discipulo.etapa_id}`}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {discipulo.fecha_nacimiento && `Edad: ${Math.floor((new Date().getTime() - new Date(discipulo.fecha_nacimiento).getTime()) / 31557600000)} años`}
                  {discipulo.created_at && ` · En discipulado desde ${format(new Date(discipulo.created_at), "MMM yyyy")}`}
                  {reuniones.length > 0 && ` · ${reuniones.length} reuniones`}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowNuevaReunion(true)}>
                <Plus className="h-4 w-4 mr-1" /> Nueva reunión
              </Button>
            </CardContent>
          </Card>

          {/* RADAR + EVOLUTION + STRENGTHS + RECS */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* RADAR */}
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">Índice de Salud Espiritual</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[260px] relative">
                  {radarData.every((d) => d.valor === 0) ? (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm z-10">
                      Sin datos aún — guardá una evaluación para ver el gráfico
                    </div>
                  ) : null}
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

            {/* EVOLUTION */}
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">Evolución por Áreas</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[260px]">
                  {evolutionData().length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sin datos</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={evolutionData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" tick={{ fontSize: 10 }} tickFormatter={(v) => format(parseISO(v), "MMM")} />
                        <YAxis domain={[0, 5]} tick={false} />
                        <Tooltip labelFormatter={(v) => format(parseISO(v as string), "dd/MM/yyyy")} />
                        {areas.map((a) => (
                          <Bar key={a.id} dataKey={a.id} name={a.nombre} fill={areasMeta[a.id]?.color || "hsl(var(--primary))"} stackId="a" />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* STRENGTHS + GROWTH + RECS */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-500" /> Fortalezas</CardTitle></CardHeader>
              <CardContent>
                {fortalezas.length === 0 ? <p className="text-sm text-muted-foreground">Sin datos</p> : (
                  <ul className="space-y-1">
                    {fortalezas.map((f) => (
                      <li key={f.id} className="flex items-center gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {f.nombre} <span className="text-muted-foreground">({f.valor}%)</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="h-4 w-4 text-red-500" /> Áreas de crecimiento</CardTitle></CardHeader>
              <CardContent>
                {areasCrecimiento.length === 0 ? <p className="text-sm text-muted-foreground">Sin datos</p> : (
                  <ul className="space-y-1">
                    {areasCrecimiento.map((a) => (
                      <li key={a.id} className="flex items-center gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {a.nombre} <span className="text-muted-foreground">({a.valor}%)</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-500" /> Recomendaciones</CardTitle></CardHeader>
              <CardContent>
                {alertas.length === 0 ? <p className="text-sm text-muted-foreground">Sin alertas activas</p> : (
                  <ul className="space-y-2">
                    {alertas.map((a) => (
                      <li key={a.id} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        <span>{a.mensaje}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* TABS: Evaluación | Reuniones | Desafíos | Alertas */}
          <div className="flex gap-1 border-b">
            {(["evaluacion", "reuniones", "desafios", "alertas"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "evaluacion" && "Evaluación"}
                {tab === "reuniones" && "Reuniones"}
                {tab === "desafios" && "Desafíos"}
                {tab === "alertas" && "Alertas"}
              </button>
            ))}
          </div>

          {/* TAB: EVALUACIÓN */}
          {activeTab === "evaluacion" && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Evaluación de Indicadores</CardTitle>
                  <Button size="sm" onClick={handleSaveEvaluacion} disabled={saving}>
                    {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                    Guardar Evaluación
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {indicadoresPorArea.map(({ area, items }) => {
                      if (items.length === 0) return null;
                      const Icon = areasMeta[area.id]?.icon || Book;
                      return (
                        <div key={area.id} className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium border-b pb-1.5">
                            <Icon className="h-4 w-4" /> {area.nombre}
                            <span className="ml-auto text-xs text-muted-foreground">{avgByArea(area.id)}%</span>
                          </div>
                          {items.map((ind) => {
                            const obj = getObjetivo(ind.id, discipulo.etapa_id);
                            return (
                              <div key={ind.id} className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{ind.nombre}</p>
                                    {obj && <p className="text-[11px] text-muted-foreground leading-tight">{obj}</p>}
                                  </div>
                                  <label className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                                    <input
                                      type="checkbox"
                                      checked={noEvaluados[ind.id] || false}
                                      onChange={(e) => setNoEvaluados((prev) => ({ ...prev, [ind.id]: e.target.checked }))}
                                      className="h-3 w-3"
                                    />
                                    No evaluado
                                  </label>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="flex gap-0.5">
                                    {valorLabels.map((label, v) => (
                                      <button
                                        key={v}
                                        type="button"
                                        disabled={noEvaluados[ind.id]}
                                        onClick={() => setValores((prev) => ({ ...prev, [ind.id]: v }))}
                                        title={label}
                                        className={`w-6 h-6 rounded-full text-[9px] font-medium transition-all ${
                                          !noEvaluados[ind.id] && (valores[ind.id] ?? -1) === v
                                            ? `${valorColors[v]} text-white scale-110 shadow-sm`
                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                        } ${noEvaluados[ind.id] ? "opacity-30 cursor-not-allowed" : ""}`}
                                      >
                                        {v}
                                      </button>
                                    ))}
                                  </div>
                                  {noEvaluados[ind.id] && (
                                    <Input
                                      placeholder="Observación..."
                                      className="h-6 text-[11px] flex-1"
                                      value={evalObservaciones[ind.id] || ""}
                                      onChange={(e) => setEvalObservaciones((prev) => ({ ...prev, [ind.id]: e.target.value }))}
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* TAB: REUNIONES */}
          {activeTab === "reuniones" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setShowNuevaReunion(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Nueva reunión
                </Button>
              </div>
              {reuniones.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">No hay reuniones registradas</CardContent></Card>
              ) : (
                reuniones.map((r) => (
                  <ReunionCard key={r.id} reunion={r} supabase={supabase} indicadores={indicadores} areas={areas} areasMeta={areasMeta} user={user} />
                ))
              )}
            </div>
          )}

          {/* TAB: DESAFÍOS */}
          {activeTab === "desafios" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setShowNuevoDesafio(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Nuevo desafío
                </Button>
              </div>
              {desafios.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">No hay desafíos asignados</CardContent></Card>
              ) : (
                <div className="grid gap-3">
                  {desafios.map((d) => (
                    <Card key={d.id}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="flex-1">
                          <p className="text-sm">{d.descripcion}</p>
                          <p className="text-xs text-muted-foreground">
                            Asignado {format(new Date(d.fecha_asignado), "dd/MM/yyyy")}
                            {d.fecha_vencimiento && ` · Vence ${format(new Date(d.fecha_vencimiento), "dd/MM/yyyy")}`}
                          </p>
                        </div>
                        <Select value={d.estado} onValueChange={(v) => cambiarEstadoDesafio(d.id, v)}>
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendiente" className="text-xs">Pendiente</SelectItem>
                            <SelectItem value="en_proceso" className="text-xs">En proceso</SelectItem>
                            <SelectItem value="completado" className="text-xs">Completado</SelectItem>
                            <SelectItem value="no_realizado" className="text-xs">No realizado</SelectItem>
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: ALERTAS */}
          {activeTab === "alertas" && (
            <div className="space-y-3">
              {alertas.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">No hay alertas activas</CardContent></Card>
              ) : (
                alertas.map((a) => (
                  <Card key={a.id}>
                    <CardContent className="p-4 flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm">{a.mensaje}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(a.created_at), "dd/MM/yyyy HH:mm")}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      ) : null}

      {/* DIALOG: NUEVA REUNIÓN */}
      <Dialog open={showNuevaReunion} onOpenChange={setShowNuevaReunion}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva reunión de discipulado</DialogTitle>
            <DialogDescription>Registrá los detalles del encuentro con el discípulo</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Fecha</Label>
                <Input type="date" value={nuevaReunion.fecha} onChange={(e) => setNuevaReunion((p) => ({ ...p, fecha: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Lugar</Label>
                <Input placeholder="Iglesia, casa, etc." value={nuevaReunion.lugar} onChange={(e) => setNuevaReunion((p) => ({ ...p, lugar: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Duración (min)</Label>
                <Input type="number" value={nuevaReunion.duracion_minutos} onChange={(e) => setNuevaReunion((p) => ({ ...p, duracion_minutos: +e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tema tratado</Label>
              <Input placeholder="Tema principal de la reunión" value={nuevaReunion.tema_tratado} onChange={(e) => setNuevaReunion((p) => ({ ...p, tema_tratado: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Observaciones generales</Label>
              <Textarea rows={2} value={nuevaReunion.observaciones_generales} onChange={(e) => setNuevaReunion((p) => ({ ...p, observaciones_generales: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Compromisos asumidos</Label>
                <Textarea rows={2} value={nuevaReunion.compromisos} onChange={(e) => setNuevaReunion((p) => ({ ...p, compromisos: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Pedidos de oración</Label>
                <Textarea rows={2} value={nuevaReunion.pedidos_oracion} onChange={(e) => setNuevaReunion((p) => ({ ...p, pedidos_oracion: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Respuestas de oración</Label>
                <Textarea rows={2} value={nuevaReunion.respuestas_oracion} onChange={(e) => setNuevaReunion((p) => ({ ...p, respuestas_oracion: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Próxima reunión</Label>
                <Input type="date" value={nuevaReunion.proxima_reunion} onChange={(e) => setNuevaReunion((p) => ({ ...p, proxima_reunion: e.target.value }))} />
              </div>
            </div>

            <details>
              <summary className="text-sm font-medium cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-1">
                <MessageSquare className="h-4 w-4" /> Evaluación pastoral
              </summary>
              <div className="space-y-3 mt-3 pl-2 border-l-2">
                <div className="space-y-1">
                  <Label className="text-xs">¿Cómo percibes el ánimo espiritual del discípulo?</Label>
                  <Textarea rows={2} value={pastoral.animo_espiritual} onChange={(e) => setPastoral((p) => ({ ...p, animo_espiritual: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">¿Hay evidencias de crecimiento desde la última reunión?</Label>
                  <Textarea rows={2} value={pastoral.evidencias_crecimiento} onChange={(e) => setPastoral((p) => ({ ...p, evidencias_crecimiento: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">¿Qué luchas o desafíos enfrenta actualmente?</Label>
                  <Textarea rows={2} value={pastoral.luchas_desafios} onChange={(e) => setPastoral((p) => ({ ...p, luchas_desafios: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">¿Qué fortalezas observas?</Label>
                  <Textarea rows={2} value={pastoral.fortalezas} onChange={(e) => setPastoral((p) => ({ ...p, fortalezas: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">¿Cuál debería ser el enfoque del próximo encuentro?</Label>
                  <Select value={pastoral.enfoque_proximo} onValueChange={(v) => setPastoral((p) => ({ ...p, enfoque_proximo: v ?? "" }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar enfoque" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Devocional">Devocional</SelectItem>
                      <SelectItem value="Carácter">Carácter</SelectItem>
                      <SelectItem value="Servicio">Servicio</SelectItem>
                      <SelectItem value="Evangelismo">Evangelismo</SelectItem>
                      <SelectItem value="Discipulado">Discipulado</SelectItem>
                      <SelectItem value="Liderazgo">Liderazgo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </details>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNuevaReunion(false)}>Cancelar</Button>
            <Button onClick={handleCrearReunion}>Guardar reunión</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: NUEVO DESAFÍO */}
      <Dialog open={showNuevoDesafio} onOpenChange={setShowNuevoDesafio}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo desafío</DialogTitle>
            <DialogDescription>Asigná un desafío al discípulo</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Descripción del desafío</Label>
              <Textarea rows={3} placeholder="Ej: Leer Juan capítulos 1 al 5" value={nuevoDesafio.descripcion} onChange={(e) => setNuevoDesafio((p) => ({ ...p, descripcion: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fecha de vencimiento (opcional)</Label>
              <Input type="date" value={nuevoDesafio.fecha_vencimiento} onChange={(e) => setNuevoDesafio((p) => ({ ...p, fecha_vencimiento: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNuevoDesafio(false)}>Cancelar</Button>
            <Button onClick={handleCrearDesafio} disabled={!nuevoDesafio.descripcion.trim()}>Asignar desafío</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReunionCard({ reunion, supabase, indicadores, areas, areasMeta, user }: any) {
  const [evs, setEvs] = useState<any[]>([]);
  const [pastoralObs, setPastoralObs] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    supabase.from("evaluaciones").select("*, indicador_id, valor, no_evaluado, observaciones").eq("reunion_id", reunion.id).then((res: any) => setEvs(res.data || []));
    supabase.from("observaciones_pastorales").select("*").eq("reunion_id", reunion.id).single().then((res: any) => setPastoralObs(res.data || null));
  }, [reunion.id]);

  const evsPorArea: Record<number, any[]> = {};
  evs.forEach((ev: any) => {
    const ind = indicadores.find((i: any) => i.id === ev.indicador_id);
    if (!ind) return;
    if (!evsPorArea[ind.area_id]) evsPorArea[ind.area_id] = [];
    evsPorArea[ind.area_id].push({ ...ev, indicador: ind });
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{format(new Date(reunion.fecha), "dd/MM/yyyy")}</span>
            {reunion.tema_tratado && <span className="text-sm text-muted-foreground">— {reunion.tema_tratado}</span>}
          </div>
          <div className="flex items-center gap-2">
            {reunion.duracion_minutos && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> {reunion.duracion_minutos}min
              </span>
            )}
            {reunion.lugar && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {reunion.lugar}
              </span>
            )}
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>

        {expanded && (
          <div className="mt-3 space-y-3 border-t pt-3">
            {reunion.observaciones_generales && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Observaciones</p>
                <p className="text-sm">{reunion.observaciones_generales}</p>
              </div>
            )}
            {reunion.compromisos && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Compromisos</p>
                <p className="text-sm whitespace-pre-wrap">{reunion.compromisos}</p>
              </div>
            )}
            {reunion.pedidos_oracion && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Pedidos de oración</p>
                <p className="text-sm whitespace-pre-wrap">{reunion.pedidos_oracion}</p>
              </div>
            )}
            {reunion.respuestas_oracion && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Respuestas de oración</p>
                <p className="text-sm whitespace-pre-wrap">{reunion.respuestas_oracion}</p>
              </div>
            )}
            {reunion.proxima_reunion && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Próxima reunión: <span className="font-medium">{format(new Date(reunion.proxima_reunion), "dd/MM/yyyy")}</span>
              </div>
            )}

            {/* Evaluaciones de la reunión */}
            {Object.keys(evsPorArea).length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Indicadores evaluados</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(evsPorArea).map(([aid, items]: [string, any]) => {
                    const meta = areasMeta[+aid];
                    return (
                      <div key={aid} className="text-xs space-y-0.5">
                        <p className="font-medium">{meta?.label || `Área ${aid}`}</p>
                        {(items as any[]).map((ev: any) => (
                          <div key={ev.id} className="flex items-center gap-1 text-muted-foreground">
                            <span>{ev.indicador.nombre}:</span>
                            {ev.no_evaluado ? <Badge variant="outline" className="text-[10px] px-1">No eval.</Badge> : (
                              <span className={`font-medium ${ev.valor >= 4 ? "text-emerald-500" : ev.valor >= 2 ? "text-amber-500" : "text-red-500"}`}>{valorLabels[ev.valor]}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Evaluación pastoral */}
            {pastoralObs && (
              <details>
                <summary className="text-xs font-medium cursor-pointer text-muted-foreground flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Evaluación pastoral
                </summary>
                <div className="mt-2 space-y-2 text-xs pl-2 border-l-2">
                  {pastoralObs.animo_espiritual && <p><span className="text-muted-foreground">Ánimo:</span> {pastoralObs.animo_espiritual}</p>}
                  {pastoralObs.evidencias_crecimiento && <p><span className="text-muted-foreground">Crecimiento:</span> {pastoralObs.evidencias_crecimiento}</p>}
                  {pastoralObs.luchas_desafios && <p><span className="text-muted-foreground">Luchas:</span> {pastoralObs.luchas_desafios}</p>}
                  {pastoralObs.fortalezas && <p><span className="text-muted-foreground">Fortalezas:</span> {pastoralObs.fortalezas}</p>}
                  {pastoralObs.enfoque_proximo && <p><span className="text-muted-foreground">Próximo enfoque:</span> {pastoralObs.enfoque_proximo}</p>}
                </div>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
