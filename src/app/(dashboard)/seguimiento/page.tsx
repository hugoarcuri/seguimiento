"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, Book, Heart, Users, Target, Sparkles, Hand, GraduationCap, Crown, User as UserIcon, AlertTriangle, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, ClipboardCheck } from "lucide-react";
import { format, parseISO } from "date-fns";
import Link from "next/link";
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

const wizardSteps = [
  { id: 1, title: "Vida Devocional", areas: [1, 2], icon: Book },
  { id: 2, title: "Comunión", areas: [4], icon: Users },
  { id: 3, title: "Carácter", areas: [3], icon: Sparkles },
  { id: 4, title: "Servicio", areas: [5, 7], icon: Hand },
  { id: 5, title: "Evangelismo", areas: [6, 8], icon: Target },
  { id: 6, title: "Observaciones", areas: [], icon: Heart },
  { id: 7, title: "Desafíos", areas: [], icon: ClipboardCheck },
];

const opcionesIndicador: Record<string, { type: "escala" | "si_no"; labels: string[] }> = {
  Oración: { type: "escala", labels: ["Nunca", "1-2 veces", "3-4 veces", "5-6 veces", "Todos los días"] },
  "Lectura bíblica": { type: "escala", labels: ["Nunca", "1-2 días", "3-4 días", "5-6 días", "Todos los días"] },
  "Tiempo devocional": { type: "escala", labels: ["Muy malo", "Malo", "Regular", "Bueno", "Excelente"] },
  "Memorización bíblica": { type: "escala", labels: ["No memoriza", "1 versículo", "2-3 versículos", "4-5 versículos", "6+ versículos"] },
  Meditación: { type: "escala", labels: ["Nunca", "Rara vez", "A veces", "Frecuentemente", "Siempre"] },
  Ayuno: { type: "escala", labels: ["No ayuna", "1 vez al mes", "Cada 15 días", "1 vez/semana", "Regularmente"] },
  "Seguridad de salvación": { type: "escala", labels: ["No seguro", "Poco seguro", "Algo seguro", "Seguro", "Muy seguro"] },
  "Dependencia de Dios": { type: "escala", labels: ["No depende", "Poco", "A veces", "Frecuentemente", "Siempre"] },
  "Confesión de pecados": { type: "escala", labels: ["No confiesa", "Rara vez", "A veces", "Frecuentemente", "Siempre"] },
  Gratitud: { type: "escala", labels: ["Quejoso", "Poco agradecido", "A veces", "Agradecido", "Muy agradecido"] },
  Adoración: { type: "escala", labels: ["No adora", "Rara vez", "A veces", "Frecuentemente", "Siempre"] },
  Fe: { type: "escala", labels: ["Incrédulo", "Duda mucho", "Duda a veces", "Confía", "Fe firme"] },
  "Asistencia al culto": { type: "escala", labels: ["Nunca", "1 vez/mes", "2 veces/mes", "3 veces/mes", "Siempre"] },
  "Asistencia al grupo pequeño": { type: "escala", labels: ["Nunca", "Casi nunca", "A veces", "Frecuentemente", "Siempre"] },
  Participación: { type: "escala", labels: ["No participa", "Poco", "A veces", "Activamente", "Lidera"] },
  "Relaciones sanas": { type: "escala", labels: ["Muy malas", "Malas", "Regulares", "Buenas", "Excelentes"] },
  "Sujeción pastoral": { type: "escala", labels: ["No acepta", "Se resiste", "A veces", "Acepta", "Ejemplar"] },
  "Integración con la iglesia": { type: "escala", labels: ["No integrado", "Poco", "A veces", "Integrado", "Muy integrado"] },
  "Participa en un ministerio": { type: "si_no", labels: ["No", "Sí"] },
  "Sirvió esta semana": { type: "si_no", labels: ["No", "Sí"] },
  "Comparte el evangelio": { type: "si_no", labels: ["No", "Sí"] },
  "Comparte su testimonio": { type: "si_no", labels: ["No", "Sí"] },
  "Invita personas": { type: "si_no", labels: ["No", "Sí"] },
  "Ora por inconversos": { type: "si_no", labels: ["No", "Sí"] },
  "Seguimiento de nuevos": { type: "si_no", labels: ["No", "Sí"] },
  "Recibe discipulado": { type: "si_no", labels: ["No", "Sí"] },
  "Discipula a otros": { type: "si_no", labels: ["No", "Sí"] },
  "Acompaña nuevos": { type: "si_no", labels: ["No", "Sí"] },
};

const defaultOpts = ["1", "2", "3", "4", "5"];

const desafiosPredefinidos = [
  "Orar diariamente",
  "Leer Juan capítulos 1 al 5",
  "Participar del grupo pequeño",
  "Servir el próximo domingo",
  "Evangelizar a un amigo",
  "Memorizar Efesios 2:8-9",
];

const ministerios = ["Club Bíblico", "Escuela Dominical", "JH", "Enfoque", "Alabanza"];

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
  const [saved, setSaved] = useState(false);

  const [step, setStep] = useState(1);
  const [valores, setValores] = useState<Record<number, number>>({});
  const [evalObs, setEvalObs] = useState<Record<number, string>>({});
  const [ministerioSeleccionado, setMinisterioSeleccionado] = useState("");
  const [ministerioCustom, setMinisterioCustom] = useState("");
  const [pasajeLeido, setPasajeLeido] = useState("");
  const [materialLeido, setMaterialLeido] = useState("");
  const [motivosOracion, setMotivosOracion] = useState("");
  const [personasOracion, setPersonasOracion] = useState<{ nombre: string; apellido: string; estado: string }[]>([]);
  const [mensajeoAlguien, setMensajeoAlguien] = useState<number | undefined>(undefined);
  const [mensajeoQuien, setMensajeoQuien] = useState("");
  const [visitoAlguien, setVisitoAlguien] = useState<number | undefined>(undefined);
  const [visitoQuien, setVisitoQuien] = useState("");
  const [actoServicio, setActoServicio] = useState<number | undefined>(undefined);
  const [actoServicioDesc, setActoServicioDesc] = useState("");
  const [obsGenerales, setObsGenerales] = useState("");
  const [compromisos, setCompromisos] = useState<string[]>([]);
  const [desafioPersonalizado, setDesafioPersonalizado] = useState("");
  const [proximaReunion, setProximaReunion] = useState("");

  const discipulo = discipulos.find((d) => d.id === selectedId);

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
    setSaved(false);
    setStep(1);
    setValores({});
    setEvalObs({});
    setMinisterioSeleccionado("");
    setMinisterioCustom("");
    setPasajeLeido("");
    setMaterialLeido("");
    setMotivosOracion("");
    setPersonasOracion([]);
    setMensajeoAlguien(undefined);
    setMensajeoQuien("");
    setVisitoAlguien(undefined);
    setVisitoQuien("");
    setActoServicio(undefined);
    setActoServicioDesc("");
    setObsGenerales("");
    setCompromisos([]);
    setDesafioPersonalizado("");
    setProximaReunion("");
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

  const getIndicadoresByArea = (areaId: number) => indicadores.filter((i) => i.area_id === areaId);
  const stepAreas = wizardSteps.find((s) => s.id === step)?.areas || [];
  const stepIndicadores = stepAreas.flatMap((aid) => getIndicadoresByArea(aid));
  const stepObjetivo = (indId: number) => objetivosNivel[`${indId}-${discipulo?.etapa_id}`] || "";

  const getOpciones = (indNombre: string) => opcionesIndicador[indNombre] || { type: "escala" as const, labels: defaultOpts };

  const handleSave = async () => {
    setSaving(true);
    if (!user) { toast.error("Debés iniciar sesión"); setSaving(false); return; }
    const today = format(new Date(), "yyyy-MM-dd");
    const extras: string[] = [];
    if (pasajeLeido) extras.push(`Pasaje leído: ${pasajeLeido}`);
    if (materialLeido) extras.push(`Material leído: ${materialLeido}`);
    if (motivosOracion) extras.push(`Motivos de oración: ${motivosOracion}`);
    if (mensajeoAlguien !== undefined) extras.push(`Contactó a alguien: ${mensajeoAlguien === 1 ? `Sí — ${mensajeoQuien || "(no especificó)"}` : "No"}`);
    if (visitoAlguien !== undefined) extras.push(`Visitó a alguien: ${visitoAlguien === 1 ? `Sí — ${visitoQuien || "(no especificó)"}` : "No"}`);
    if (actoServicio !== undefined) extras.push(`Acto de servicio: ${actoServicio === 1 ? `Sí — ${actoServicioDesc || "(no especificó)"}` : "No"}`);
    if (ministerioSeleccionado) extras.push(`Ministerio: ${ministerioSeleccionado}${ministerioCustom ? ` (${ministerioCustom})` : ""}`);
    if (personasOracion.length > 0) {
      const personasStr = personasOracion.map((p) => `${p.nombre} ${p.apellido} (${p.estado})`).join(", ");
      extras.push(`Personas por las que ora: ${personasStr}`);
    }
    const obsFinal = [obsGenerales, ...extras].filter(Boolean).join("\n\n");

    const { data: reunion } = await supabase.from("reuniones").insert({
      discipulo_id: selectedId, lider_id: user.id, fecha: today,
      observaciones_generales: obsFinal || null,
      compromisos: compromisos.length > 0 || desafioPersonalizado ? [...compromisos, ...(desafioPersonalizado ? [desafioPersonalizado] : [])].join("\n") : null,
      proxima_reunion: proximaReunion || null,
    }).select().single();
    if (!reunion) { toast.error("Error al guardar"); setSaving(false); return; }

    const inserts = indicadores.map((ind) => {
      if (valores[ind.id] === undefined) return null;
      return { reunion_id: reunion.id, indicador_id: ind.id, valor: valores[ind.id], no_evaluado: false, observaciones: evalObs[ind.id] || null };
    }).filter(Boolean);

    if (inserts.length > 0) {
      for (const ins of inserts) {
        await supabase.from("evaluaciones").upsert(ins as any, { onConflict: "reunion_id, indicador_id" });
      }
    }

    const desafiosACrear = [...compromisos];
    if (desafioPersonalizado.trim()) desafiosACrear.push(desafioPersonalizado.trim());
    for (const desc of desafiosACrear) {
      await supabase.from("desafios").insert({ discipulo_id: selectedId, lider_id: user.id, descripcion: desc });
    }

    setSaved(true);
    setSaving(false);
    toast.success("Evaluación guardada");

    supabase.from("reuniones").select("*").eq("discipulo_id", selectedId).order("fecha", { ascending: false }).then((r) => setReuniones(r.data || []));
    supabase.from("desafios").select("*").eq("discipulo_id", selectedId).order("fecha_asignado", { ascending: false }).then((d) => setDesafios(d.data || []));
    supabase.from("evaluaciones").select("*").in("reunion_id", [reunion.id]).then((res) => setEvaluaciones((prev) => [...prev, ...(res.data || [])]));
  };

  const avgByArea = (areaId: number) => {
    const items = indicadores.filter((i) => i.area_id === areaId);
    if (items.length === 0) return 0;
    const vals = items.map((i) => valores[i.id] ?? -1).filter((v) => v >= 0);
    if (vals.length === 0) {
      const evs = evaluaciones.filter((ev: any) => items.some((i) => i.id === ev.indicador_id) && ev.valor !== null);
      if (evs.length === 0) return 0;
      return Math.round((evs.reduce((s: number, ev: any) => s + ev.valor, 0) / evs.length / 5) * 100);
    }
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length / 5) * 100);
  };

  const allEvalData = [...evaluaciones, ...(saved ? indicadores.map((i) => ({ indicador_id: i.id, valor: valores[i.id] })).filter((x) => x.valor !== undefined) : [])];
  const radarData = areas.map((a) => ({ area: a.nombre, valor: avgByArea(a.id) }));
  const areasConValor = (arr: any[]) => arr.filter((a) => a.valor > 0);
  const fortalezas = areasConValor(areas.map((a) => ({ id: a.id, nombre: a.nombre, valor: avgByArea(a.id) }))).sort((a, b) => b.valor - a.valor).slice(0, 3);
  const debilidades = areasConValor(areas.map((a) => ({ id: a.id, nombre: a.nombre, valor: avgByArea(a.id) }))).sort((a, b) => a.valor - b.valor).slice(0, 3);

  const evolutionData = () => {
    const byDate: Record<string, Record<number, number[]>> = {};
    const allEvs = saved ? allEvalData : evaluaciones;
    allEvs.forEach((ev: any) => {
      if (ev.valor === null) return;
      const ind = indicadores.find((i) => i.id === ev.indicador_id);
      if (!ind) return;
      const fecha = ev.reunion_id ? reuniones.find((r) => r.id === ev.reunion_id)?.fecha : format(new Date(), "yyyy-MM-dd");
      if (!fecha) return;
      if (!byDate[fecha]) byDate[fecha] = {};
      if (!byDate[fecha][ind.area_id]) byDate[fecha][ind.area_id] = [];
      byDate[fecha][ind.area_id].push(ev.valor);
    });
    return Object.entries(byDate).map(([fecha, areas]) => ({
      fecha, ...Object.fromEntries(Object.entries(areas).map(([aid, vals]) => [aid, Math.round((vals as number[]).reduce((a, b) => a + b, 0) / (vals as number[]).length)])),
    })).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(-12);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Seguimiento</h1>
          <p className="text-xs text-muted-foreground">Reunión de discipulado</p>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-end max-w-[60%]">
          {discipulos.map((d) => (
            <button key={d.id} type="button" onClick={() => setSelectedId(d.id)}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                selectedId === d.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            ><UserIcon className="h-3 w-3" />{d.nombre}</button>
          ))}
        </div>
      </div>

      {!selectedId ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">Seleccioná un discípulo para iniciar la evaluación</CardContent></Card>
      ) : discipulo ? (
        <>
          {/* DISCIPLE INFO BAR */}
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
              {discipulo.nombre?.[0]}{discipulo.apellido?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{discipulo.nombre} {discipulo.apellido}</p>
              <p className="text-[11px] text-muted-foreground">{discipulo.etapas?.nombre || `Nivel ${discipulo.etapa_id}`}{reuniones.length > 0 && ` · ${reuniones.length} reuniones`}</p>
            </div>
          </div>

          {/* WIZARD */}
          {!saved ? (
            <>
              {/* STEP INDICATOR */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {wizardSteps.map((s) => (
                  <button key={s.id} type="button" onClick={() => setStep(s.id)}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
                      step === s.id ? "bg-primary text-primary-foreground" : step > s.id || (step > s.id) ? "bg-muted text-muted-foreground" : "bg-muted/50 text-muted-foreground/60"
                    }`}
                  >
                    {step > s.id ? <CheckCircle2 className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
                    {s.title}
                  </button>
                ))}
              </div>

              {/* STEP CONTENT */}
              {step < 6 && (
                <div className="space-y-3">
                  {/* Extra fields for Step 1: Vida Devocional */}
                  {step === 1 && (
                    <Card>
                      <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-sm">Lectura y oración de la semana</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Pasaje bíblico, libro o capítulo que leyó esta semana</Label>
                          <Input placeholder="Ej: Juan 1-5, Salmos 23..." className="h-9 text-sm" value={pasajeLeido} onChange={(e) => setPasajeLeido(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Libro cristiano u otro material leído</Label>
                          <Input placeholder="Título del libro o material..." className="h-9 text-sm" value={materialLeido} onChange={(e) => setMaterialLeido(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">¿Cuáles fueron sus motivos de oración en la semana?</Label>
                          <Textarea rows={2} className="text-sm" value={motivosOracion} onChange={(e) => setMotivosOracion(e.target.value)} placeholder="Familia, trabajo, salud, etc." />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Extra fields for Step 5: Evangelismo */}
                  {step === 5 && (
                    <>
                      <Card>
                        <CardHeader className="p-3 pb-0">
                          <CardTitle className="text-sm">Acompañamiento evangelístico</CardTitle>
                          <CardDescription className="text-xs">Gestioná el proceso completo de evangelismo (oración → servicio → evangelismo)</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3">
                          <Link href="/evangelismo" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                            <Heart className="h-4 w-4" /> Ir a Acompañamiento Evangelístico →
                          </Link>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="p-3 pb-0">
                          <CardTitle className="text-sm">Personas por las que ora</CardTitle>
                          <CardDescription className="text-xs">Registrá las personas por las que el discípulo está orando</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 space-y-3">
                          {personasOracion.map((p, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm bg-muted/30 rounded-lg p-2">
                              <span className="flex-1">{p.nombre} {p.apellido}</span>
                              <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">{p.estado}</span>
                              <button type="button" onClick={() => setPersonasOracion((prev) => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-xs font-medium">Quitar</button>
                            </div>
                          ))}
                          <PersonaOracionForm onAgregar={(p) => setPersonasOracion((prev) => [...prev, p])} />
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {/* Extra fields for Step 2: Comunión */}
                  {step === 2 && (
                    <Card>
                      <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-sm">Contacto y servicio semanal</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs">¿Envió mensaje o llamó a alguien esta semana?</Label>
                          <div className="flex gap-2 mt-1">
                            {["No", "Sí"].map((label, v) => (
                              <button key={v} type="button" onClick={() => { setMensajeoAlguien(v); if (v === 0) setMensajeoQuien(""); }}
                                className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all ${
                                  (mensajeoAlguien ?? -1) === v ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                              >{label}</button>
                            ))}
                          </div>
                          {mensajeoAlguien === 1 && (
                            <Input placeholder="¿A quién?" className="h-9 text-sm mt-1" value={mensajeoQuien} onChange={(e) => setMensajeoQuien(e.target.value)} />
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">¿Visitó a alguien en la semana?</Label>
                          <div className="flex gap-2 mt-1">
                            {["No", "Sí"].map((label, v) => (
                              <button key={v} type="button" onClick={() => { setVisitoAlguien(v); if (v === 0) setVisitoQuien(""); }}
                                className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all ${
                                  (visitoAlguien ?? -1) === v ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                              >{label}</button>
                            ))}
                          </div>
                          {visitoAlguien === 1 && (
                            <Input placeholder="¿A quién visitó?" className="h-9 text-sm mt-1" value={visitoQuien} onChange={(e) => setVisitoQuien(e.target.value)} />
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">¿Realizó algún acto de servicio?</Label>
                          <div className="flex gap-2 mt-1">
                            {["No", "Sí"].map((label, v) => (
                              <button key={v} type="button" onClick={() => { setActoServicio(v); if (v === 0) setActoServicioDesc(""); }}
                                className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all ${
                                  (actoServicio ?? -1) === v ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                              >{label}</button>
                            ))}
                          </div>
                          {actoServicio === 1 && (
                            <Input placeholder="¿Qué hizo?" className="h-9 text-sm mt-1" value={actoServicioDesc} onChange={(e) => setActoServicioDesc(e.target.value)} />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {stepAreas.map((aid) => {
                    const area = areas.find((a) => a.id === aid);
                    if (!area) return null;
                    const items = getIndicadoresByArea(aid);
                    if (items.length === 0) return null;
                    const Icon = areasMeta[aid]?.icon || Book;
                    return (
                      <Card key={aid}>
                        <CardHeader className="p-3 pb-0">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Icon className="h-4 w-4" /> {area.nombre}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 space-y-3">
                          {items.map((ind) => {
                            const opts = getOpciones(ind.nombre);
                            const obj = stepObjetivo(ind.id);
                            return (
                              <div key={ind.id}>
                                <div className="flex items-start justify-between mb-1">
                                  <div>
                                    <p className="text-sm font-medium">{ind.nombre}</p>
                                    {obj && <p className="text-[11px] text-muted-foreground leading-tight">{obj}</p>}
                                  </div>
                                </div>
                                {ind.nombre === "Sirvió esta semana" && valores[ind.id] === 1 ? (
                                  <div className="space-y-2">
                                    <div className="flex gap-1">
                                      {opts.labels.map((label, v) => (
                                        <button key={v} type="button" onClick={() => setValores((prev) => ({ ...prev, [ind.id]: v }))}
                                          className={`flex-1 h-8 rounded-lg text-xs font-medium transition-all ${
                                            (valores[ind.id] ?? -1) === v ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                                          }`}
                                        >{label}</button>
                                      ))}
                                    </div>
                                    {(valores[ind.id] ?? -1) === 1 && (
                                      <div className="space-y-2">
                                        <Select value={ministerioSeleccionado} onValueChange={(v) => setMinisterioSeleccionado(v ?? "")}>
                                          <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Seleccionar ministerio" /></SelectTrigger>
                                          <SelectContent>
                                            {ministerios.map((m) => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}
                                            <SelectItem value="Otro" className="text-xs">Otro</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        {ministerioSeleccionado === "Otro" && (
                                          <Input placeholder="¿Cuál?" className="h-8 text-xs" value={ministerioCustom} onChange={(e) => setMinisterioCustom(e.target.value)} />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : opts.type === "si_no" ? (
                                  <div className="flex gap-2">
                                    {opts.labels.map((label, v) => (
                                      <button key={v} type="button" onClick={() => setValores((prev) => ({ ...prev, [ind.id]: v }))}
                                        className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all ${
                                          (valores[ind.id] ?? -1) === v ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                                        }`}
                                      >{label}</button>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <div className="flex gap-1">
                                      {opts.labels.map((label, v) => (
                                        <button key={v} type="button" onClick={() => setValores((prev) => ({ ...prev, [ind.id]: v }))}
                                          className={`flex-1 h-9 rounded-lg text-xs font-medium transition-all ${
                                            (valores[ind.id] ?? -1) === v ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                                          }`}
                                        >{label}</button>
                                      ))}
                                    </div>
                                    <Input placeholder="Observación..." className="h-7 text-xs" value={evalObs[ind.id] || ""} onChange={(e) => setEvalObs((prev) => ({ ...prev, [ind.id]: e.target.value }))} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {step === 6 && (
                <Card>
                  <CardHeader className="p-3 pb-0">
                    <CardTitle className="text-sm flex items-center gap-2"><Heart className="h-4 w-4" /> Observaciones pastorales</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">¿Cómo percibes el ánimo espiritual del discípulo?</Label>
                      <Textarea rows={2} className="text-sm" value={obsGenerales} onChange={(e) => setObsGenerales(e.target.value)} placeholder="Escribí tus observaciones..." />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Próxima reunión</Label>
                      <Input type="date" className="h-9 text-sm" value={proximaReunion} onChange={(e) => setProximaReunion(e.target.value)} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === 7 && (
                <Card>
                  <CardHeader className="p-3 pb-0">
                    <CardTitle className="text-sm flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /> Desafíos y compromisos</CardTitle>
                    <CardDescription className="text-xs">Seleccioná los desafíos para esta semana</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 space-y-3">
                    <div className="space-y-2">
                      {desafiosPredefinidos.map((d) => (
                        <label key={d} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" className="h-4 w-4" checked={compromisos.includes(d)} onChange={(e) => setCompromisos(e.target.checked ? [...compromisos, d] : compromisos.filter((x) => x !== d))} />
                          {d}
                        </label>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Otro desafío personalizado</Label>
                      <Input placeholder="Ej: Leer Santiago completo" className="h-9 text-sm" value={desafioPersonalizado} onChange={(e) => setDesafioPersonalizado(e.target.value)} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* NAVIGATION */}
              <div className="flex items-center justify-between gap-3">
                <Button variant="outline" size="sm" disabled={step === 1} onClick={() => setStep(step - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                </Button>
                {step < 7 ? (
                  <Button size="sm" onClick={() => setStep(step + 1)}>
                    Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    Guardar evaluación
                  </Button>
                )}
              </div>
            </>
          ) : (
            /* SAVED - SHOW ANALYSIS */
            <div className="space-y-4">
              <Card className="border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Evaluación guardada</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(), "dd/MM/yyyy")} · {indicadores.filter((i) => valores[i.id] !== undefined).length} indicadores evaluados</p>
                  </div>
                  <Button size="sm" variant="outline" className="ml-auto" onClick={() => { setSaved(false); setValores({}); setEvalObs({}); setObsGenerales(""); setCompromisos([]); setDesafioPersonalizado(""); setProximaReunion(""); setStep(1); }}>
                    Nueva evaluación
                  </Button>
                </CardContent>
              </Card>

              {/* RADAR */}
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

              {/* EVOLUTION */}
              <Card>
                <CardHeader className="p-3 pb-0"><CardTitle className="text-sm">Evolución</CardTitle></CardHeader>
                <CardContent className="p-3">
                  <div className="h-[200px]">
                    {evolutionData().length === 0 ? (
                      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Sin datos históricos</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={evolutionData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="fecha" tick={{ fontSize: 9 }} tickFormatter={(v) => format(parseISO(v), "dd/MM")} />
                          <YAxis domain={[0, 5]} tick={false} />
                          <Tooltip labelFormatter={(v) => format(parseISO(v as string), "dd/MM/yyyy")} />
                          {areas.filter((a) => evolutionData().some((ed: any) => ed[a.id] !== undefined)).map((a) => (
                            <Bar key={a.id} dataKey={a.id} name={a.nombre} fill={areasMeta[a.id]?.color || "hsl(var(--primary))"} stackId="a" />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* FORTALEZAS + DEBILIDADES + ALERTAS */}
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
          )}
        </>
      ) : null}
    </div>
  );
}

function PersonaOracionForm({ onAgregar }: { onAgregar: (p: { nombre: string; apellido: string; estado: string }) => void }) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [estado, setEstado] = useState("Oración");

  const handleAgregar = () => {
    if (!nombre.trim() || !apellido.trim()) return;
    onAgregar({ nombre: nombre.trim(), apellido: apellido.trim(), estado });
    setNombre("");
    setApellido("");
    setEstado("Oración");
  };

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 space-y-1">
        <Label className="text-xs">Nombre</Label>
        <Input className="h-8 text-xs" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>
      <div className="flex-1 space-y-1">
        <Label className="text-xs">Apellido</Label>
        <Input className="h-8 text-xs" placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Estado</Label>
        <Select value={estado} onValueChange={(v) => setEstado(v ?? "Oración")}>
          <SelectTrigger className="h-8 text-xs w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Oración" className="text-xs">Oración</SelectItem>
            <SelectItem value="Oración y servicio" className="text-xs">Oración y servicio</SelectItem>
            <SelectItem value="Oración y predicación" className="text-xs">Oración y predicación</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button size="sm" className="h-8" onClick={handleAgregar} disabled={!nombre.trim() || !apellido.trim()}>Agregar</Button>
    </div>
  );
}
