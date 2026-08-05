"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Loader2, Printer, FileBarChart, Users, Target, CheckCircle2, AlertTriangle,
  CalendarDays, Phone, Mail, MapPin, Church, User as UserIcon, Clock, Eye, GraduationCap, BookOpen, ClipboardCheck,
} from "lucide-react";
import { format } from "date-fns";
import { cn, estadoColors } from "@/lib/utils";
import { calcularEdad } from "@/lib/utils";
import { CAMPOS_EVALUACION, decodificarCampoEvaluacion } from "../seguimiento/seguimiento-constants";
import type {
  Discipulo, Etapa, Profile, Seguimiento, SeguimientoEvaluacion, SeguimientoObjetivo,
  SeguimientoObservacion, SeguimientoHistorial, Tarea, Agenda,
} from "@/types/database";

type SeguimientoFull = Seguimiento & { discipulos?: Discipulo; discipuladores?: { nombre: string; apellido: string } };

export default function ReportesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");

  const [discipulos, setDiscipulos] = useState<Discipulo[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [perfiles, setPerfiles] = useState<Profile[]>([]);
  const [seguimientos, setSeguimientos] = useState<SeguimientoFull[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<SeguimientoEvaluacion[]>([]);
  const [objetivos, setObjetivos] = useState<SeguimientoObjetivo[]>([]);
  const [observaciones, setObservaciones] = useState<SeguimientoObservacion[]>([]);
  const [historial, setHistorial] = useState<SeguimientoHistorial[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [agendas, setAgendas] = useState<Agenda[]>([]);

  const [modo, setModo] = useState<"general" | "individual">("general");
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [etapaFiltro, setEtapaFiltro] = useState<string>("");

  const fetchData = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { setLoading(false); return; }
    setCurrentUserId(authUser.id);
    const { data: profile } = await supabase.from("profiles").select("rol").eq("id", authUser.id).single();
    const admin = profile?.rol === "admin";
    setIsAdmin(admin);

    let discipulosQuery = supabase.from("discipulos").select("*").order("apellido", { ascending: true });
    if (!admin) discipulosQuery = discipulosQuery.eq("lider_id", authUser.id);

    const [dRes, eRes, pRes, sRes, evRes, oRes, obsRes, hRes, tRes, aRes] = await Promise.all([
      discipulosQuery,
      supabase.from("etapas").select("*").order("orden", { ascending: true }),
      supabase.from("profiles").select("*").order("apellido", { ascending: true }),
      supabase.from("seguimientos").select("*, discipulos:discipulo_id(*), discipuladores:discipulador_id(nombre, apellido)"),
      supabase.from("seguimiento_evaluaciones").select("*"),
      supabase.from("seguimiento_objetivos").select("*"),
      supabase.from("seguimiento_observaciones").select("*"),
      supabase.from("seguimiento_historial").select("*"),
      supabase.from("tareas").select("*"),
      supabase.from("agenda").select("*"),
    ]);

    const discipulosData = (dRes.data as Discipulo[]) || [];
    const discipulosIds = discipulosData.map((d) => d.id);
    const segData = (sRes.data as SeguimientoFull[]) || [];

    setDiscipulos(discipulosData);
    setEtapas((eRes.data as Etapa[]) || []);
    setPerfiles((pRes.data as Profile[]) || []);
    setSeguimientos(segData.filter((s) => discipulosIds.includes(s.discipulo_id)));
    setEvaluaciones((evRes.data as SeguimientoEvaluacion[]) || []);
    setObjetivos((oRes.data as SeguimientoObjetivo[]) || []);
    setObservaciones((obsRes.data as SeguimientoObservacion[]) || []);
    setHistorial((hRes.data as SeguimientoHistorial[]) || []);
    setTareas((tRes.data as Tarea[]) || []);
    setAgendas((aRes.data as Agenda[]) || []);

    if (segData.length > 0) setSelectedId(segData[0].discipulo_id);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      try {
        await fetchData();
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    })();
  }, [fetchData]);

  const segPorDiscipulo = useMemo(() => {
    const m: Record<string, SeguimientoFull> = {};
    for (const s of seguimientos) {
      const prev = m[s.discipulo_id];
      if (!prev || (prev.estado === "pausado" && s.estado === "activo")) m[s.discipulo_id] = s;
    }
    return m;
  }, [seguimientos]);

  const objPorSeguimiento = useMemo(() => {
    const m: Record<string, SeguimientoObjetivo[]> = {};
    for (const o of objetivos) {
      (m[o.seguimiento_id] ||= []).push(o);
    }
    return m;
  }, [objetivos]);

  const tareasPorDiscipulo = useMemo(() => {
    const m: Record<string, Tarea[]> = {};
    for (const t of tareas) (m[t.discipulo_id] ||= []).push(t);
    return m;
  }, [tareas]);

  const agendaPorDiscipulo = useMemo(() => {
    const m: Record<string, Agenda[]> = {};
    for (const a of agendas) (m[a.discipulo_id] ||= []).push(a);
    return m;
  }, [agendas]);

  const observacionesPorSeguimiento = useMemo(() => {
    const m: Record<string, SeguimientoObservacion[]> = {};
    for (const o of observaciones) (m[o.seguimiento_id] ||= []).push(o);
    return m;
  }, [observaciones]);

  const historialPorSeguimiento = useMemo(() => {
    const m: Record<string, SeguimientoHistorial[]> = {};
    for (const h of historial) (m[h.seguimiento_id] ||= []).push(h);
    return m;
  }, [historial]);

  const nombreDiscipulador = (id: string) => {
    const p = perfiles.find((x) => x.id === id);
    return p ? `${p.apellido}, ${p.nombre}` : "—";
  };

  const discipulosConSeg = useMemo(() => {
    return discipulos.map((d) => {
      const seg = segPorDiscipulo[d.id];
      const objs = seg ? objPorSeguimiento[seg.id] || [] : [];
      const tasks = tareasPorDiscipulo[d.id] || [];
      const encs = agendaPorDiscipulo[d.id] || [];
      return {
        d, seg, objs, tasks, encs,
        objsCompletados: objs.filter((o) => o.completado).length,
        tareasCompletadas: tasks.filter((t) => t.estado === "completada").length,
        tareasPendientes: tasks.filter((t) => t.estado === "pendiente").length,
        tareasVencidas: tasks.filter((t) => t.estado === "vencida").length,
      };
    });
  }, [discipulos, segPorDiscipulo, objPorSeguimiento, tareasPorDiscipulo, agendaPorDiscipulo]);

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    return discipulosConSeg.filter((row) => {
      if (etapaFiltro && (row.seg?.etapa ?? row.d.etapa_id) !== Number(etapaFiltro)) return false;
      if (q && !`${row.d.apellido} ${row.d.nombre}`.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => `${a.d.apellido}`.localeCompare(`${b.d.apellido}`));
  }, [discipulosConSeg, search, etapaFiltro]);

  const totales = useMemo(() => {
    const todos = discipulosConSeg;
    const conSeg = todos.filter((r) => r.seg);
    const progresoTotal = conSeg.reduce((s, r) => s + (r.seg?.progreso || 0), 0);
    const totalObjetivos = todos.reduce((s, r) => s + r.objs.length, 0);
    const completadosObjetivos = todos.reduce((s, r) => s + r.objsCompletados, 0);
    const totalTareas = todos.reduce((s, r) => s + r.tasks.length, 0);
    const completadasTareas = todos.reduce((s, r) => s + r.tareasCompletadas, 0);
    const vencidasTareas = todos.reduce((s, r) => s + r.tareasVencidas, 0);
    const totalEncuentros = todos.reduce((s, r) => s + r.encs.length, 0);
    return {
      total: todos.length,
      conSeg: conSeg.length,
      sinSeg: todos.length - conSeg.length,
      progresoProm: conSeg.length ? Math.round(progresoTotal / conSeg.length) : 0,
      totalObjetivos, completadosObjetivos,
      pctObjetivos: totalObjetivos ? Math.round((completadosObjetivos / totalObjetivos) * 100) : 0,
      totalTareas, completadasTareas, vencidasTareas,
      pctTareas: totalTareas ? Math.round((completadasTareas / totalTareas) * 100) : 0,
      totalEncuentros,
    };
  }, [discipulosConSeg]);

  const selectedRow = useMemo(() => discipulosConSeg.find((r) => r.d.id === selectedId) || null, [discipulosConSeg, selectedId]);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileBarChart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Reportes</h1>
            <p className="text-sm text-muted-foreground">Avances, logros, objetivos y tareas de cada discípulo</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <div className="flex rounded-lg border p-0.5">
            <button type="button" onClick={() => setModo("general")}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", modo === "general" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
            >General</button>
            <button type="button" onClick={() => setModo("individual")}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", modo === "individual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
            >Individual</button>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" /> Imprimir / PDF</Button>
        </div>
      </div>

      {modo === "general" ? (
        <div className="space-y-4">
          {/* RESUMEN */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card><CardContent className="p-3"><div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /><span className="text-[11px] text-muted-foreground">Discípulos</span></div><p className="text-2xl font-bold">{totales.total}</p></CardContent></Card>
            <Card><CardContent className="p-3"><div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /><span className="text-[11px] text-muted-foreground">Con seguimiento</span></div><p className="text-2xl font-bold">{totales.conSeg}</p></CardContent></Card>
            <Card><CardContent className="p-3"><div className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" /><span className="text-[11px] text-muted-foreground">Progreso prom.</span></div><p className="text-2xl font-bold">{totales.progresoProm}%</p></CardContent></Card>
            <Card><CardContent className="p-3"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /><span className="text-[11px] text-muted-foreground">Objetivos logrados</span></div><p className="text-2xl font-bold">{totales.completadosObjetivos}<span className="text-sm font-normal text-muted-foreground">/{totales.totalObjetivos}</span></p></CardContent></Card>
            <Card><CardContent className="p-3"><div className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-primary" /><span className="text-[11px] text-muted-foreground">Tareas completadas</span></div><p className="text-2xl font-bold">{totales.completadasTareas}<span className="text-sm font-normal text-muted-foreground">/{totales.totalTareas}</span></p></CardContent></Card>
            <Card><CardContent className="p-3"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /><span className="text-[11px] text-muted-foreground">Tareas vencidas</span></div><p className="text-2xl font-bold">{totales.vencidasTareas}</p></CardContent></Card>
          </div>

          {/* FILTROS */}
          <Card className="print:hidden">
            <CardContent className="p-4 flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px] space-y-1">
                <Label className="text-xs text-muted-foreground">Buscar</Label>
                <Input placeholder="Buscar por nombre..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="w-44 space-y-1">
                <Label className="text-xs text-muted-foreground">Etapa</Label>
                <Select value={etapaFiltro} onValueChange={(v) => setEtapaFiltro(v?.toString() ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    {etapas.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* TABLA GENERAL */}
          <Card>
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-base">Reporte general del discipulado</CardTitle>
              <CardDescription className="text-xs">Emitido el {format(new Date(), "dd/MM/yyyy")}</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Discípulo</TableHead>
                    <TableHead>Discipulador</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Objetivos</TableHead>
                    <TableHead>Tareas (C/P/V)</TableHead>
                    <TableHead>Encuentros</TableHead>
                    <TableHead className="print:hidden">Ver</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">No hay datos para mostrar</TableCell></TableRow>
                  ) : filtrados.map((row) => (
                    <TableRow key={row.d.id}>
                      <TableCell>
                        <p className="font-medium">{row.d.apellido}, {row.d.nombre}</p>
                        {row.d.email && <p className="text-xs text-muted-foreground">{row.d.email}</p>}
                      </TableCell>
                      <TableCell>{row.seg ? nombreDiscipulador(row.seg.discipulador_id) : "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{etapas.find((e) => e.id === (row.seg?.etapa ?? row.d.etapa_id))?.nombre || "—"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className={cn("h-2 w-2 rounded-full", estadoColors[row.d.estado])} />
                          <span className="text-xs capitalize">{row.d.estado}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {row.seg ? (
                          <div className="flex items-center gap-2 min-w-[90px]">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full", row.seg.progreso >= 80 ? "bg-emerald-500" : row.seg.progreso >= 40 ? "bg-blue-500" : "bg-amber-500")} style={{ width: `${row.seg.progreso}%` }} />
                            </div>
                            <span className="text-xs font-medium tabular-nums">{row.seg.progreso}%</span>
                          </div>
                        ) : <span className="text-xs text-muted-foreground">Sin seguimiento</span>}
                      </TableCell>
                      <TableCell>
                        <span className={cn("text-sm font-semibold", row.objsCompletados === row.objs.length && row.objs.length > 0 ? "text-emerald-600 dark:text-emerald-400" : "")}>
                          {row.objsCompletados}/{row.objs.length}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm tabular-nums">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{row.tareasCompletadas}</span>
                          <span className="text-muted-foreground"> / {row.tareasPendientes}</span>
                          <span className="text-muted-foreground"> / </span>
                          <span className={cn("font-semibold", row.tareasVencidas > 0 ? "text-red-500" : "text-muted-foreground")}>{row.tareasVencidas}</span>
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums">{row.encs.length}</TableCell>
                      <TableCell className="print:hidden">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedId(row.d.id); setModo("individual"); }}>
                          <Eye className="h-4 w-4" /> Reporte
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {/* SELECTOR */}
          <Card className="print:hidden">
            <CardContent className="p-4">
              <Label className="text-xs text-muted-foreground">Discípulo</Label>
              <Select value={selectedId} onValueChange={(v) => setSelectedId(v?.toString() ?? "")}>
                <SelectTrigger><SelectValue placeholder="Seleccionar discípulo" /></SelectTrigger>
                <SelectContent>
                  {discipulosConSeg.map((r) => (
                    <SelectItem key={r.d.id} value={r.d.id}>{r.d.apellido}, {r.d.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedRow ? <ReporteIndividual
            row={selectedRow}
            etapas={etapas}
            seg={selectedRow.seg}
            objs={selectedRow.objs}
            tasks={selectedRow.tasks}
            encs={selectedRow.encs}
            evaluacion={selectedRow.seg ? evaluaciones.find((e) => e.seguimiento_id === selectedRow.seg!.id) || null : null}
            observaciones={selectedRow.seg ? observacionesPorSeguimiento[selectedRow.seg.id] || [] : []}
            historial={selectedRow.seg ? historialPorSeguimiento[selectedRow.seg.id] || [] : []}
            nombreDiscipulador={nombreDiscipulador}
          /> : (
            <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">Seleccioná un discípulo para ver su reporte</CardContent></Card>
          )}
        </div>
      )}
    </div>
  );
}

function ReporteIndividual({ row, etapas, seg, objs, tasks, encs, evaluacion, observaciones, historial, nombreDiscipulador }: {
  row: { d: Discipulo; objsCompletados: number; tareasCompletadas: number; tareasPendientes: number; tareasVencidas: number; encs: Agenda[]; objs: SeguimientoObjetivo[]; tasks: Tarea[] };
  etapas: Etapa[];
  seg: Seguimiento | null;
  objs: SeguimientoObjetivo[];
  tasks: Tarea[];
  encs: Agenda[];
  evaluacion: SeguimientoEvaluacion | null;
  observaciones: SeguimientoObservacion[];
  historial: SeguimientoHistorial[];
  nombreDiscipulador: (id: string) => string;
}) {
  const { d } = row;
  const etapa = etapas.find((e) => e.id === (seg?.etapa ?? d.etapa_id));
  const completados = objs.filter((o) => o.completado);
  const pendientes = objs.filter((o) => !o.completado);
  const tareasCompletas = tasks.filter((t) => t.estado === "completada");
  const tareasPendientes = tasks.filter((t) => t.estado === "pendiente");
  const tareasVencidas = tasks.filter((t) => t.estado === "vencida");
  const proximosEncuentros = encs.filter((a) => new Date(a.fecha) >= new Date(new Date().toDateString())).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const encuentrosPasados = encs.filter((a) => new Date(a.fecha) < new Date(new Date().toDateString())).sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <div className="space-y-4">
      {/* FICHA */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {d.avatar_url ? (
                <img src={d.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">
                  {d.nombre?.charAt(0)?.toUpperCase()}{d.apellido?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-xl font-bold truncate">{d.apellido}, {d.nombre}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="outline">{etapa?.nombre || "Sin etapa"}</Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className={cn("h-2 w-2 rounded-full", estadoColors[d.estado])} /> {d.estado}
                  </span>
                  <Badge variant="secondary">{d.bautizado ? "Bautizado" : "Sin bautizar"}</Badge>
                  <Badge variant="secondary">{d.es_miembro ? "Miembro" : "No miembro"}</Badge>
                </div>
              </div>
            </div>
            <div className="text-sm space-y-1 sm:text-right shrink-0">
              <p className="flex items-center gap-2 sm:justify-end"><UserIcon className="h-3.5 w-3.5 text-muted-foreground" /> {d.fecha_nacimiento ? `${calcularEdad(d.fecha_nacimiento)} años` : "—"}</p>
              {d.telefono && <p className="flex items-center gap-2 sm:justify-end"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {d.telefono}</p>}
              {d.email && <p className="flex items-center gap-2 sm:justify-end truncate max-w-[280px]"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {d.email}</p>}
              {d.direccion && <p className="flex items-center gap-2 sm:justify-end"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {d.direccion}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RESUMEN SEGUIMIENTO */}
      <Card>
        <CardHeader className="p-4 pb-0"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" /> Seguimiento</CardTitle></CardHeader>
        <CardContent className="p-4">
          {seg ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Discipulador</p><p className="font-medium">{nombreDiscipulador(seg.discipulador_id)}</p></div>
                <div><p className="text-xs text-muted-foreground">Etapa</p><p className="font-medium">{etapa?.nombre || `Etapa ${seg.etapa}`}</p></div>
                <div><p className="text-xs text-muted-foreground">Inicio</p><p className="font-medium">{format(new Date(seg.fecha_inicio + "T12:00:00"), "dd/MM/yyyy")}</p></div>
                <div><p className="text-xs text-muted-foreground">Última actualización</p><p className="font-medium">{format(new Date(seg.ultima_actualizacion), "dd/MM/yyyy")}</p></div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="font-medium">{seg.progreso}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", seg.progreso >= 80 ? "bg-emerald-500" : seg.progreso >= 40 ? "bg-blue-500" : "bg-amber-500")} style={{ width: `${seg.progreso}%` }} />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Este discípulo no tiene seguimiento activo.</p>
          )}
        </CardContent>
      </Card>

      {/* EVALUACIÓN */}
      {evaluacion && (
        <Card>
          <CardHeader className="p-4 pb-0"><CardTitle className="text-base flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /> Evaluación</CardTitle></CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {CAMPOS_EVALUACION.map((campo) => {
                const val = decodificarCampoEvaluacion(campo, (evaluacion as any)[campo.key] ?? "");
                const texto = [val.opcion, val.detalle].filter(Boolean).join(" — ");
                return (
                  <div key={campo.key}>
                    <p className="text-xs text-muted-foreground">{campo.label}</p>
                    <p className="font-medium">{texto || "—"}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* OBJETIVOS */}
      <Card>
        <CardHeader className="p-4 pb-0"><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" /> Objetivos y logros</CardTitle></CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400">{completados.length} logrados</Badge>
            <Badge variant="outline">{pendientes.length} pendientes</Badge>
          </div>
          {objs.length === 0 ? <p className="text-sm text-muted-foreground">Sin objetivos registrados</p> : (
            <ul className="space-y-1.5">
              {objs.map((o) => (
                <li key={o.id} className="flex items-start gap-2 text-sm">
                  {o.completado ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" /> : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/40 mt-0.5 shrink-0" />}
                  <span className={cn(o.completado && "text-muted-foreground line-through")}>
                    {o.descripcion}
                    {o.es_habito && <Badge variant="secondary" className="ml-1 text-[10px] px-1">Hábito</Badge>}
                    {o.fecha_cumplimiento && <span className="text-xs text-muted-foreground ml-1">({format(new Date(o.fecha_cumplimiento + "T12:00:00"), "dd/MM/yyyy")})</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* TAREAS */}
      <Card>
        <CardHeader className="p-4 pb-0"><CardTitle className="text-base flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /> Tareas</CardTitle></CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400">{tareasCompletas.length} completadas</Badge>
            <Badge variant="outline">{tareasPendientes.length} pendientes</Badge>
            <Badge variant="outline" className={tareasVencidas.length > 0 ? "text-red-500" : ""}>{tareasVencidas.length} vencidas</Badge>
          </div>
          {tasks.length === 0 ? <p className="text-sm text-muted-foreground">Sin tareas asignadas</p> : (
            <ul className="space-y-1.5">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-2 text-sm py-1 border-b last:border-0">
                  <div>
                    <p className={cn(t.estado === "completada" && "text-muted-foreground line-through")}>{t.titulo}</p>
                    {t.descripcion && <p className="text-xs text-muted-foreground">{t.descripcion}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.fecha_limite && <span className="text-xs text-muted-foreground">{format(new Date(t.fecha_limite + "T12:00:00"), "dd/MM/yyyy")}</span>}
                    <Badge variant={t.estado === "completada" ? "default" : t.estado === "vencida" ? "destructive" : "secondary"}>{t.estado}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ENCUENTROS */}
      <Card>
        <CardHeader className="p-4 pb-0"><CardTitle className="text-base flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Encuentros</CardTitle></CardHeader>
        <CardContent className="p-4">
          <p className="text-sm mb-3">{encs.length} encuentros registrados · {proximosEncuentros.length} programados</p>
          {proximosEncuentros.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-1">Próximos</p>
              <ul className="space-y-1">
                {proximosEncuentros.slice(0, 3).map((a) => (
                  <li key={a.id} className="text-sm flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" />
                    {format(new Date(a.fecha + "T12:00:00"), "dd/MM/yyyy")} {a.hora && `· ${a.hora}`} {a.tema_tratado && `· ${a.tema_tratado}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {encuentrosPasados.length > 0 && (
            <ul className="space-y-1">
              {encuentrosPasados.slice(0, 5).map((a) => (
                <li key={a.id} className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  {format(new Date(a.fecha + "T12:00:00"), "dd/MM/yyyy")} {a.tema_tratado && `· ${a.tema_tratado}`}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* OBSERVACIONES */}
      {observaciones.length > 0 && (
        <Card>
          <CardHeader className="p-4 pb-0"><CardTitle className="text-base flex items-center gap-2"><Church className="h-4 w-4" /> Observaciones</CardTitle></CardHeader>
          <CardContent className="p-4">
            <ul className="space-y-2">
              {observaciones.slice(0, 10).map((o) => (
                <li key={o.id} className="text-sm border-b last:border-0 pb-2">
                  <p>{o.comentario}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(o.fecha), "dd/MM/yyyy")}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* HISTORIAL */}
      {historial.length > 0 && (
        <Card>
          <CardHeader className="p-4 pb-0"><CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Historial</CardTitle></CardHeader>
          <CardContent className="p-4">
            <ul className="space-y-1.5">
              {historial.slice(0, 12).map((h) => (
                <li key={h.id} className="text-sm flex items-start gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">{format(new Date(h.fecha), "dd/MM/yyyy")}</span>
                  <span className="capitalize text-xs text-muted-foreground mt-0.5 shrink-0">{h.tipo}:</span>
                  <span>{h.descripcion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="text-center text-xs text-muted-foreground print:hidden">Reporte emitido el {format(new Date(), "dd/MM/yyyy HH:mm")}</div>
    </div>
  );
}
