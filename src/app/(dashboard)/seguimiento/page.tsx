"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Loader2, Search, Pencil, Eye, ArrowUpDown, CalendarPlus, Trash2, Download, BookOpen, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { descargarCSV } from "@/lib/csv";
import { estadoEncuentrosMes, contarEncuentrosMes, SALUD_CONFIG } from "@/lib/discipulo-health";
import { SeguimientoForm } from "./seguimiento-form";
import { useEtapas } from "@/hooks/useEtapas";
import type { Seguimiento } from "@/types/database";

type SeguimientoFila = Seguimiento & {
  discipulos?: { id: string; nombre: string; apellido: string; avatar_url?: string | null; estado?: string; lider_id?: string | null };
};

type EncuentroProximo = { fecha: string; hora?: string; tema_tratado?: string; esFuturo: boolean };

export default function SeguimientoPage() {
  const supabase = useMemo(() => createClient(), []);
  const { etapas } = useEtapas();
  const [seguimientos, setSeguimientos] = useState<SeguimientoFila[]>([]);
  const [proximoEncuentroPorDiscipulo, setProximoEncuentroPorDiscipulo] = useState<Record<string, EncuentroProximo>>({});
  const [encuentrosMesPorDiscipulo, setEncuentrosMesPorDiscipulo] = useState<Record<string, number>>({});
  const [discipulos, setDiscipulos] = useState<Array<{ id: string; nombre: string; apellido: string }>>([]);
  const [discipuladores, setDiscipuladores] = useState<Array<{ id: string; nombre: string; apellido: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const [search, setSearch] = useState("");
  const [etapaFiltro, setEtapaFiltro] = useState<string>("");
  const [discipuladorFiltro, setDiscipuladorFiltro] = useState<string>("");
  const [orden, setOrden] = useState<"desc" | "asc">("desc");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Seguimiento | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [eliminarOpen, setEliminarOpen] = useState(false);
  const [eliminarUno, setEliminarUno] = useState<SeguimientoFila | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    setCurrentUserId(authUser.id);

    const { data: profile } = await supabase.from("profiles").select("rol").eq("id", authUser.id).single();
    const admin = profile?.rol === "admin";
    setIsAdmin(admin);

    let discipulosQuery = supabase
      .from("discipulos")
      .select("id, nombre, apellido")
      .order("apellido", { ascending: true });
    if (!admin) discipulosQuery = discipulosQuery.eq("lider_id", authUser.id);

    const [seguimientosRes, discipulosRes, discipuladoresRes] = await Promise.all([
      supabase
        .from("seguimientos")
        .select("*, discipulos:discipulo_id(nombre, apellido, avatar_url, lider_id)")
        .order("ultima_actualizacion", { ascending: false }),
      discipulosQuery,
      supabase.from("profiles").select("id, nombre, apellido").order("apellido", { ascending: true }),
    ]);
    const seguimientosData = (seguimientosRes.data as SeguimientoFila[]) || [];
    setSeguimientos(seguimientosData);
    setDiscipulos(discipulosRes.data || []);
    setDiscipuladores(discipuladoresRes.data || []);

    const ids = [...new Set(seguimientosData.map((s) => s.discipulo_id))];
    if (ids.length) {
      const { data: agendaData } = await supabase
        .from("agenda")
        .select("discipulo_id, fecha, hora, tema_tratado, realizada")
        .in("discipulo_id", ids)
        .order("fecha", { ascending: true });
      const hoy = new Date().toISOString().split("T")[0];
      const mapa: Record<string, EncuentroProximo> = {};
      const fechasPorDiscipulo: Record<string, { fecha: string; realizada?: boolean }[]> = {};
      for (const a of agendaData || []) {
        if (!a.discipulo_id) continue;
        const esFuturo = !a.realizada && a.fecha >= hoy;
        const item: EncuentroProximo = { fecha: a.fecha, hora: a.hora ?? undefined, tema_tratado: a.tema_tratado ?? undefined, esFuturo };
        const actual = mapa[a.discipulo_id];
        if (!actual) {
          mapa[a.discipulo_id] = item;
        } else if (actual.esFuturo !== esFuturo) {
          if (esFuturo) mapa[a.discipulo_id] = item;
        } else if (actual.esFuturo ? a.fecha < actual.fecha : a.fecha > actual.fecha) {
          mapa[a.discipulo_id] = item;
        }
        (fechasPorDiscipulo[a.discipulo_id] ||= []).push({ fecha: a.fecha, realizada: a.realizada });
      }
      setProximoEncuentroPorDiscipulo(mapa);
      const encuentrosMap: Record<string, number> = {};
      for (const [id, fechas] of Object.entries(fechasPorDiscipulo)) {
        encuentrosMap[id] = contarEncuentrosMes(fechas);
      }
      setEncuentrosMesPorDiscipulo(encuentrosMap);
    } else {
      setProximoEncuentroPorDiscipulo({});
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      try {
        await fetchData();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchData]);

  const onValidarUnico = useCallback(async (discipuloId: string) => {
    const { data } = await supabase
      .from("seguimientos")
      .select("id")
      .eq("discipulo_id", discipuloId)
      .eq("estado", "activo")
      .maybeSingle();
    return !data;
  }, [supabase]);

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...seguimientos]
      .filter((s) => {
        if (etapaFiltro && s.etapa !== Number(etapaFiltro)) return false;
        if (discipuladorFiltro && s.discipulos?.lider_id !== discipuladorFiltro) return false;
        if (q) {
          const nombre = `${s.discipulos?.apellido || ""} ${s.discipulos?.nombre || ""}`.toLowerCase();
          if (!nombre.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const diff = new Date(a.ultima_actualizacion).getTime() - new Date(b.ultima_actualizacion).getTime();
        return orden === "desc" ? -diff : diff;
      });
  }, [seguimientos, search, etapaFiltro, discipuladorFiltro, orden]);

  const toggleSeleccion = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const todosSeleccionados = filtrados.length > 0 && filtrados.every((s) => selectedIds.includes(s.id));

  const toggleTodos = () => {
    const ids = new Set(filtrados.map((s) => s.id));
    setSelectedIds((prev) =>
      todosSeleccionados ? prev.filter((id) => !ids.has(id)) : [...new Set([...prev, ...ids])]
    );
  };

  const handleEliminarSeleccionados = async () => {
    if (!selectedIds.length) return;
    setDeleting(true);
    const { error } = await supabase.from("seguimientos").delete().in("id", selectedIds);
    setDeleting(false);
    if (error) {
      toast.error(`Error al eliminar: ${error.message}`);
      return;
    }
    toast.success(`${selectedIds.length} seguimiento(s) eliminado(s)`);
    setEliminarOpen(false);
    setSelectedIds([]);
    fetchData();
  };

  const handleEliminarUno = async () => {
    if (!eliminarUno) return;
    setDeleting(true);
    const { error } = await supabase.from("seguimientos").delete().eq("id", eliminarUno.id);
    setDeleting(false);
    if (error) {
      toast.error(`Error al eliminar: ${error.message}`);
      return;
    }
    const nombre = eliminarUno.discipulos ? `${eliminarUno.discipulos.apellido}, ${eliminarUno.discipulos.nombre}` : "el seguimiento";
    toast.success(`Seguimiento de ${nombre} eliminado`);
    setEliminarUno(null);
    fetchData();
  };

  const exportarSeleccionados = () => {
    const sel = filtrados.filter((s) => selectedIds.includes(s.id));
    if (sel.length === 0) return;
    const filas = sel.map((s) => {
      const prox = proximoEncuentroPorDiscipulo[s.discipulo_id];
      const lider = discipuladores.find((p) => p.id === s.discipulos?.lider_id);
      return {
        "Discípulo": s.discipulos ? `${s.discipulos.apellido}, ${s.discipulos.nombre}` : "",
        "Discipulador": lider ? `${lider.apellido}, ${lider.nombre}` : "",
        "Etapa": etapas.find((e) => e.id === s.etapa)?.nombre || `Etapa ${s.etapa}`,
        "Progreso": `${s.etapa}/${etapas.length}`,
        "Próximo encuentro": prox ? format(new Date(prox.fecha + "T12:00:00"), "dd/MM/yyyy") : "",
        "Última actualización": format(new Date(s.ultima_actualizacion), "dd/MM/yyyy HH:mm"),
      };
    });
    descargarCSV("seguimientos.csv", filas);
    toast.success(`${sel.length} seguimiento(s) exportado(s)`);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Seguimiento</h1>
          <p className="text-muted-foreground">Crecimiento espiritual de cada discípulo</p>
        </div>
        {selectedIds.length > 0 && (
          <Button variant="outline" onClick={exportarSeleccionados}>
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
        )}
        {selectedIds.length > 0 && (
          <Button variant="destructive" onClick={() => setEliminarOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Eliminar ({selectedIds.length})
          </Button>
        )}
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Seguimiento
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-0 space-y-1">
              <Label htmlFor="buscar" className="text-xs text-muted-foreground">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="buscar" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
              <div className="w-full space-y-1 sm:w-44">
              <Label className="text-xs text-muted-foreground">Etapa</Label>
              <Select value={etapaFiltro} onValueChange={(v) => setEtapaFiltro(v?.toString() ?? "")} items={[{ value: "", label: "Todas" }, ...etapas.map((e) => ({ value: String(e.id), label: e.nombre }))]}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {etapas.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
              <div className="w-full space-y-1 sm:w-52">
              <Label className="text-xs text-muted-foreground">Discipulador</Label>
              <Select value={discipuladorFiltro} onValueChange={(v) => setDiscipuladorFiltro(v?.toString() ?? "")} items={[{ value: "", label: "Todos" }, ...discipuladores.map((p) => ({ value: p.id, label: `${p.apellido}, ${p.nombre}` }))]}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {discipuladores.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.apellido}, {p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="icon" title={orden === "desc" ? "Orden: más recientes primero" : "Orden: más antiguos primero"} onClick={() => setOrden((o) => (o === "desc" ? "asc" : "desc"))}>
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="md:hidden">
            {filtrados.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground">No hay seguimientos registrados</p>
            ) : (
              <div className="space-y-3 p-3">
                {filtrados.map((s) => {
                  const prox = proximoEncuentroPorDiscipulo[s.discipulo_id];
                  const lider = discipuladores.find((p) => p.id === s.discipulos?.lider_id);
                  const estado = estadoEncuentrosMes(encuentrosMesPorDiscipulo[s.discipulo_id] || 0);
                  const cfg = SALUD_CONFIG[estado];
                  const etapaIdx = etapas.findIndex((ev) => ev.id === s.etapa);
                  return (
                    <div key={s.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(s.id)}
                            onChange={() => toggleSeleccion(s.id)}
                            aria-label="Seleccionar"
                            title="Seleccionar"
                            className="size-4 shrink-0 cursor-pointer accent-primary mt-1"
                          />
                          {s.discipulos?.avatar_url ? (
                            <img src={s.discipulos.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {(s.discipulos?.nombre?.[0] || "").toUpperCase()}
                              {(s.discipulos?.apellido?.[0] || "").toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold truncate">
                              {s.discipulos ? `${s.discipulos.apellido}, ${s.discipulos.nombre}` : "—"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {lider ? `${lider.apellido}, ${lider.nombre}` : "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Link href={`/seguimiento/ver?id=${s.id}`}>
                            <Button variant="ghost" size="icon" title="Ver">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" title="Editar" onClick={() => { setEditing(s); setDialogOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Eliminar" onClick={() => setEliminarUno(s)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      {s.etapa === 2 && (
                        <div className="flex gap-1.5">
                          <Link href="/estudios-biblicos" className="inline-flex items-center gap-1 rounded-md border bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent transition-colors">
                            <BookOpen className="h-3.5 w-3.5" /> Ver material
                          </Link>
                          <Link href={`/seguimiento/ver?id=${s.id}`} className="inline-flex items-center gap-1 rounded-md border bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent transition-colors">
                            <FileText className="h-3.5 w-3.5" /> Notas del discipulador
                          </Link>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{etapas.find((e) => e.id === s.etapa)?.nombre || `Etapa ${s.etapa}`}</Badge>
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", cfg.badge)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full bg-white/80")} />
                          {cfg.etiqueta}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{encuentrosMesPorDiscipulo[s.discipulo_id] || 0} encuentro(s) este mes</span>
                      </div>
                      <div className="flex items-center gap-2" title="Etapa del discipulado (1 a 5)">
                        <div className="flex flex-1 items-center gap-0.5">
                          {etapas.map((e, i) => (
                            <span key={e.id} className={cn("h-2 flex-1 rounded-sm", i <= etapaIdx ? "bg-primary" : "bg-muted")} />
                          ))}
                        </div>
                        <span className="text-xs font-medium tabular-nums text-muted-foreground">{s.etapa}/{etapas.length}</span>
                      </div>
                      {prox ? (
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">{format(new Date(prox.fecha + "T12:00:00"), "dd/MM/yyyy")}</p>
                          <p className="text-xs text-muted-foreground">{prox.hora || prox.tema_tratado || "Programado"}</p>
                        </div>
                      ) : (
                        <Link href={`/seguimiento/ver?id=${s.id}&encuentro=1`} className="block">
                          <Button variant="outline" size="sm" className="w-full">
                            <CalendarPlus className="mr-1 h-4 w-4" /> Registrar encuentro
                          </Button>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    {filtrados.length > 0 && (
                      <input
                        type="checkbox"
                        checked={todosSeleccionados}
                        onChange={() => toggleTodos()}
                        aria-label="Seleccionar todos"
                        className="size-4 shrink-0 cursor-pointer accent-primary"
                      />
                    )}
                  </TableHead>
                  <TableHead>Discípulo</TableHead>
                  <TableHead>Discipulador</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Próximo encuentro</TableHead>                <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      No hay seguimientos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  filtrados.map((s) => {
                    const prox = proximoEncuentroPorDiscipulo[s.discipulo_id];
                    const lider = discipuladores.find((p) => p.id === s.discipulos?.lider_id);
                    return (
                    <TableRow key={s.id}>
                      <TableCell className="w-10">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(s.id)}
                          onChange={() => toggleSeleccion(s.id)}
                          aria-label="Seleccionar"
                          title="Seleccionar"
                          className="size-4 shrink-0 cursor-pointer accent-primary"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          {s.discipulos?.avatar_url ? (
                            <img src={s.discipulos.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {(s.discipulos?.nombre?.[0] || "").toUpperCase()}
                              {(s.discipulos?.apellido?.[0] || "").toUpperCase()}
                            </div>
                          )}
                          <p className="text-base font-semibold">
                            {s.discipulos ? `${s.discipulos.apellido}, ${s.discipulos.nombre}` : "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {lider ? `${lider.apellido}, ${lider.nombre}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{etapas.find((e) => e.id === s.etapa)?.nombre || `Etapa ${s.etapa}`}</Badge>
                      </TableCell>
                      <TableCell className="min-w-[110px] sm:min-w-[170px]">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-1 items-center gap-0.5" title="Etapa del discipulado (1 a 5)">
                            {etapas.map((e, i) => (
                              <span key={e.id} className={cn("h-2.5 flex-1 rounded-sm", i <= etapas.findIndex((ev) => ev.id === s.etapa) ? "bg-primary" : "bg-muted")} />
                            ))}
                          </div>
                          <span className="text-xs font-medium tabular-nums text-muted-foreground">{s.etapa}/{etapas.length}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const estado = estadoEncuentrosMes(encuentrosMesPorDiscipulo[s.discipulo_id] || 0);
                          const cfg = SALUD_CONFIG[estado];
                          return (
                            <div className="flex flex-col items-start gap-0.5">
                              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", cfg.badge)}>
                                <span className={cn("h-1.5 w-1.5 rounded-full bg-white/80")} />
                                {cfg.etiqueta}
                              </span>
                              <span className="text-[11px] text-muted-foreground">{encuentrosMesPorDiscipulo[s.discipulo_id] || 0} encuentro(s) este mes</span>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {prox ? (
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium">{format(new Date(prox.fecha + "T12:00:00"), "dd/MM/yyyy")}</p>
                            <p className="text-xs text-muted-foreground">{prox.hora || prox.tema_tratado || "Programado"}</p>
                          </div>
                        ) : (
                          <Link href={`/seguimiento/ver?id=${s.id}&encuentro=1`}>
                            <Button variant="outline" size="sm">
                              <CalendarPlus className="mr-1 h-4 w-4" /> Registrar encuentro
                            </Button>
                          </Link>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {s.etapa === 2 && (
                            <>
                              <Link href="/estudios-biblicos">
                                <Button variant="ghost" size="icon" title="Ver material">
                                  <BookOpen className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Link href={`/seguimiento/ver?id=${s.id}`}>
                                <Button variant="ghost" size="icon" title="Notas del discipulador">
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </Link>
                            </>
                          )}
                          <Link href={`/seguimiento/ver?id=${s.id}`}>
                            <Button variant="ghost" size="icon" title="Ver">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" title="Editar" onClick={() => { setEditing(s); setDialogOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Eliminar" onClick={() => setEliminarUno(s)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <SeguimientoForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={fetchData}
        discipulos={discipulos}
        discipuladores={discipuladores}
        etapas={etapas}
        defaultDiscipuladorId={isAdmin ? undefined : currentUserId}
        onValidarUnico={onValidarUnico}
      />

      <Dialog open={eliminarOpen} onOpenChange={setEliminarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar seguimientos</DialogTitle>
            <DialogDescription>
              ¿Eliminar {selectedIds.length} seguimiento(s) seleccionado(s)? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEliminarOpen(false)} disabled={deleting}>Cancelar</Button>
            <Button variant="destructive" onClick={handleEliminarSeleccionados} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={eliminarUno !== null} onOpenChange={(o) => { if (!o) setEliminarUno(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar seguimiento</DialogTitle>
            <DialogDescription>
              ¿Eliminar el seguimiento de {eliminarUno?.discipulos ? `${eliminarUno.discipulos.apellido}, ${eliminarUno.discipulos.nombre}` : "este discípulo"}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEliminarUno(null)} disabled={deleting}>Cancelar</Button>
            <Button variant="destructive" onClick={handleEliminarUno} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}