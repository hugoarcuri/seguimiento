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
import { Progress } from "@/components/ui/progress";
import { Plus, Loader2, Search, Pencil, Eye, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { SeguimientoForm } from "./seguimiento-form";
import { useEtapas } from "@/hooks/useEtapas";
import type { Seguimiento } from "@/types/database";

type SeguimientoFila = Seguimiento & {
  discipulos?: { id: string; nombre: string; apellido: string; estado?: string };
  discipuladores?: { id: string; nombre: string; apellido: string };
};

const DIAS_SIN_CONTACTO = 15;

function diasSinEncuentro(fecha: string | null): number {
  if (!fecha) return Infinity;
  const t = new Date(fecha.length === 10 ? `${fecha}T12:00:00` : fecha).getTime();
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}

export default function SeguimientoPage() {
  const supabase = useMemo(() => createClient(), []);
  const { etapas } = useEtapas();
  const [seguimientos, setSeguimientos] = useState<SeguimientoFila[]>([]);
  const [ultimaFechaPorDiscipulo, setUltimaFechaPorDiscipulo] = useState<Record<string, string | null>>({});
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
        .select("*, discipulos:discipulo_id(nombre, apellido), discipuladores:discipulador_id(nombre, apellido)")
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
        .select("discipulo_id, fecha")
        .in("discipulo_id", ids)
        .order("fecha", { ascending: false });
      const mapa: Record<string, string | null> = {};
      for (const a of agendaData || []) {
        if (a.discipulo_id && mapa[a.discipulo_id] === undefined) mapa[a.discipulo_id] = a.fecha;
      }
      setUltimaFechaPorDiscipulo(mapa);
    } else {
      setUltimaFechaPorDiscipulo({});
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
        if (discipuladorFiltro && s.discipulador_id !== discipuladorFiltro) return false;
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

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Seguimiento</h1>
          <p className="text-muted-foreground">Crecimiento espiritual de cada discípulo</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Seguimiento
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px] space-y-1">
              <Label htmlFor="buscar" className="text-xs text-muted-foreground">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="buscar" placeholder="Buscar por nombre..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="w-44 space-y-1">
              <Label className="text-xs text-muted-foreground">Etapa</Label>
              <Select value={etapaFiltro} onValueChange={(v) => setEtapaFiltro(v?.toString() ?? "")}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {etapas.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-52 space-y-1">
              <Label className="text-xs text-muted-foreground">Discipulador</Label>
              <Select value={discipuladorFiltro} onValueChange={(v) => setDiscipuladorFiltro(v?.toString() ?? "")}>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Discípulo</TableHead>
                <TableHead>Discipulador</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead>Última actualización</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No hay seguimientos registrados
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map((s) => {
                  const dias = diasSinEncuentro(ultimaFechaPorDiscipulo[s.discipulo_id] ?? null);
                  return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <div>{s.discipulos ? `${s.discipulos.apellido}, ${s.discipulos.nombre}` : "—"}</div>
                        {dias > DIAS_SIN_CONTACTO && (
                          <Badge variant="destructive">
                            {dias === Infinity ? "Sin encuentro registrado" : `Sin encuentro hace ${dias} días`}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {s.discipuladores ? `${s.discipuladores.apellido}, ${s.discipuladores.nombre}` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{etapas.find((e) => e.id === s.etapa)?.nombre || `Etapa ${s.etapa}`}</Badge>
                    </TableCell>
                    <TableCell className="min-w-[160px]">
                      <div className="flex items-center gap-2">
                        <Progress value={s.progreso} className="flex-1" />
                        <span className="text-xs font-medium tabular-nums w-8 text-right">{s.progreso}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(s.ultima_actualizacion), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/seguimiento/ver?id=${s.id}`}>
                          <Button variant="ghost" size="icon" title="Ver">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" title="Editar" onClick={() => { setEditing(s); setDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
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
    </div>
  );
}