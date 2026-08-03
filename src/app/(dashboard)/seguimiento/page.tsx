"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ReunionForm } from "./reunion-form";
import { ResumenReunion } from "./resumen-reunion";
import { HistorialSemanal } from "./historial-semanal";
import { useReunionForm } from "./use-reunion-form";
import { SeguimientoHeader } from "./seguimiento-header";
import { MetaActualCard } from "./meta-actual-card";
import { DesafiosCard } from "./desafios-card";
import { fmtLocal, inicioSemana, esSemanaDe } from "./data";
import type {
  SupabaseUser, SupabaseDiscipulo, SupabaseArea, SupabaseIndicador,
  SupabaseReunion, SupabaseDesafio,
} from "./data";

export default function SeguimientoPage() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [discipulos, setDiscipulos] = useState<SupabaseDiscipulo[]>([]);
  const [areas, setAreas] = useState<SupabaseArea[]>([]);
  const [indicadores, setIndicadores] = useState<SupabaseIndicador[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  const [reuniones, setReuniones] = useState<SupabaseReunion[]>([]);
  const [desafios, setDesafios] = useState<SupabaseDesafio[]>([]);
  const [nuevoDesafio, setNuevoDesafio] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [reunionVerId, setReunionVerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cargandoReuniones, setCargandoReuniones] = useState(false);
  const [saving, setSaving] = useState(false);
  const [guardandoMeta, setGuardandoMeta] = useState(false);

  const w = useReunionForm();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("ultimoDiscipuloId");
      if (stored) {
        const t = setTimeout(() => setSelectedId(stored), 0);
        return () => clearTimeout(t);
      }
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    Promise.all([
      supabase.from("discipulos").select("*, etapas:etapa_id(*)").order("apellido"),
      supabase.from("areas").select("*").eq("activo", true).order("orden"),
      supabase.from("indicadores").select("*").eq("activo", true).order("orden"),
    ]).then(([dRes, aRes, iRes]) => {
      setDiscipulos(dRes.data || []);
      setAreas(aRes.data || []);
      setIndicadores(iRes.data || []);
      setLoading(false);
    }).catch(console.error);
  }, [supabase]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelado = false;
    const mostrarCarga = setTimeout(() => { if (!cancelado) setCargandoReuniones(true); }, 150);
    supabase
      .from("reuniones")
      .select("*, evaluaciones(*)")
      .eq("discipulo_id", selectedId)
      .order("fecha", { ascending: false })
      .then((rRes) => {
        if (cancelado) return;
        const reunionesData = (rRes.data || []) as SupabaseReunion[];
        setReuniones(reunionesData);
        const semanaActual = reunionesData.find((r) => esSemanaDe(r.fecha, new Date()));
        if (semanaActual && !w.saved) {
          const vals: Record<number, number> = {};
          const obs: Record<number, string> = {};
          (semanaActual.evaluaciones || []).forEach((e) => {
            if (e.valor !== null && e.valor !== undefined) vals[e.indicador_id] = e.valor;
            if (e.observaciones) obs[e.indicador_id] = e.observaciones;
          });
          w.setValores(vals);
          w.setEvalObs(obs);
          if (semanaActual.observaciones_generales) {
            const parts = semanaActual.observaciones_generales.split("\n\n").filter(Boolean);
            if (parts[0]) w.setPositivo(parts[0]);
            if (parts[1]) w.setDesafioPrincipal(parts[1]);
          }
          if (semanaActual.compromisos) w.setCompromisos(semanaActual.compromisos.split("\n").filter(Boolean));
          if (semanaActual.proxima_reunion) w.setProximaReunion(semanaActual.proxima_reunion);
        }
        setCargandoReuniones(false);
        clearTimeout(mostrarCarga);
      },
      () => { if (!cancelado) { setCargandoReuniones(false); clearTimeout(mostrarCarga); } }
    );

    supabase.from("desafios").select("*").eq("discipulo_id", selectedId).order("fecha_asignado", { ascending: false }).then((d) => {
      if (!cancelado) setDesafios((d.data || []) as SupabaseDesafio[]);
    });
    supabase.from("personas_oracion").select("*").eq("discipulo_id", selectedId).eq("activo", true).then((p) => {
      if (!cancelado && p.data?.length) w.setPersonasOracion(p.data.map((x: { nombre: string; apellido: string; estado: string }) => ({ nombre: x.nombre, apellido: x.apellido, estado: x.estado })));
    });
    return () => { cancelado = true; clearTimeout(mostrarCarga); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, supabase]);

  const handleSelectDiscipulo = (id: string) => {
    if (id === selectedId) return;
    w.reset();
    setReuniones([]);
    setDesafios([]);
    setReunionVerId(null);
    setDeleteId(null);
    setNuevoDesafio("");
    setSelectedId(id);
    localStorage.setItem("ultimoDiscipuloId", id);
  };

  const discipulo = discipulos.find((d) => d.id === selectedId);
  const semanaActualReunion = reuniones.find((r) => esSemanaDe(r.fecha, new Date()));
  const indicadoresRespondidos = indicadores.filter((i) => w.valores[i.id] !== undefined).length;
  const pct = indicadores.length > 0 ? Math.round((indicadoresRespondidos / indicadores.length) * 100) : 0;

  const handleAgregarDesafio = async () => {
    if (!user || !selectedId || !nuevoDesafio.trim()) return;
    const { data, error } = await supabase.from("desafios").insert({
      discipulo_id: selectedId, lider_id: user.id, descripcion: nuevoDesafio.trim(),
    }).select().single();
    if (error) { toast.error("Error al agregar desafío"); return; }
    setDesafios((prev) => [data as SupabaseDesafio, ...prev]);
    setNuevoDesafio("");
    toast.success("Desafío agregado");
  };

  const handleEliminarDesafio = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("desafios").delete().eq("id", deleteId);
    if (error) { toast.error("Error al eliminar desafío"); return; }
    setDesafios((prev) => prev.filter((d) => d.id !== deleteId));
    setDeleteId(null);
    toast.success("Desafío eliminado");
  };

  const handleSave = async () => {
    setSaving(true);
    if (!user) { toast.error("Debés iniciar sesión"); setSaving(false); return; }
    const today = format(new Date(), "yyyy-MM-dd");
    const obsFinal = [w.positivo, w.desafioPrincipal].filter(Boolean).join("\n\n") || null;
    const compromisosText = [...w.compromisos, w.desafioPersonalizado].filter(Boolean).join("\n") || null;

    const hoy = new Date();
    const ws = inicioSemana(hoy);
    const we = new Date(ws);
    we.setDate(ws.getDate() + 7);
    const { data: reunionExistente, error: errExists } = await supabase
      .from("reuniones")
      .select("id")
      .eq("discipulo_id", selectedId)
      .gte("fecha", fmtLocal(ws))
      .lt("fecha", fmtLocal(we))
      .maybeSingle();
    if (errExists) { toast.error("Error al guardar"); setSaving(false); return; }

    let reunionId: string;
    if (reunionExistente) {
      const { error: upErr } = await supabase
        .from("reuniones")
        .update({
          observaciones_generales: obsFinal,
          compromisos: compromisosText,
          proxima_reunion: w.proximaReunion || null,
        })
        .eq("id", reunionExistente.id);
      if (upErr) { toast.error("Error al guardar la reunión de la semana"); setSaving(false); return; }
      reunionId = reunionExistente.id;
    } else {
      const { data: reunion, error: insErr } = await supabase.from("reuniones").insert({
        discipulo_id: selectedId, lider_id: user.id, fecha: today,
        observaciones_generales: obsFinal,
        compromisos: compromisosText,
        proxima_reunion: w.proximaReunion || null,
      }).select().single();
      if (insErr || !reunion) { toast.error("Error al guardar"); setSaving(false); return; }
      reunionId = reunion.id;
    }

    const inserts = indicadores
      .filter((ind) => w.valores[ind.id] !== undefined)
      .map((ind) => ({
        reunion_id: reunionId,
        indicador_id: ind.id,
        valor: w.valores[ind.id],
        no_evaluado: false,
        observaciones: w.evalObs[ind.id] || null,
      }));
    if (inserts.length > 0) {
      for (const ins of inserts) {
        const { error } = await supabase.from("evaluaciones").upsert(ins, { onConflict: "reunion_id, indicador_id" });
        if (error) { toast.error("Error al guardar las evaluaciones"); setSaving(false); return; }
      }
    }

    const { error: delPersonasErr } = await supabase.from("personas_oracion").delete().eq("discipulo_id", selectedId);
    if (delPersonasErr) { toast.error("Error al guardar las personas"); setSaving(false); return; }
    for (const p of w.personasOracion) {
      const { error: insPersonaErr } = await supabase.from("personas_oracion").insert({ discipulo_id: selectedId, nombre: p.nombre, apellido: p.apellido, estado: p.estado });
      if (insPersonaErr) { toast.error("Error al guardar las personas"); setSaving(false); return; }
    }

    w.setSaved(true);
    setSaving(false);
    setReunionVerId(null);
    toast.success(reunionExistente ? "Reunión de la semana actualizada" : "Reunión guardada");

    void supabase.from("reuniones").select("*, evaluaciones(*)").eq("discipulo_id", selectedId).order("fecha", { ascending: false }).then((r) => {
      setReuniones((r.data || []) as SupabaseReunion[]);
    });
  };

  const handleGuardarMeta = async (texto: string) => {
    if (!selectedId) return;
    setGuardandoMeta(true);
    const { error } = await supabase.from("discipulos").update({
      meta_actual: texto.trim() || null,
      meta_actual_desde: texto.trim() ? fmtLocal(new Date()) : null,
    }).eq("id", selectedId);
    if (error) { toast.error("Error al guardar la meta"); setGuardandoMeta(false); return; }
    setDiscipulos((prev) => prev.map((d) => d.id === selectedId ? { ...d, meta_actual: texto.trim() || null, meta_actual_desde: texto.trim() ? fmtLocal(new Date()) : null } : d));
    setGuardandoMeta(false);
    toast.success("Meta guardada");
  };

  const handleCompletarMeta = async () => {
    if (!selectedId) return;
    setGuardandoMeta(true);
    const { error } = await supabase.from("discipulos").update({ meta_actual: null, meta_actual_desde: null }).eq("id", selectedId);
    if (error) { toast.error("Error al completar la meta"); setGuardandoMeta(false); return; }
    setDiscipulos((prev) => prev.map((d) => d.id === selectedId ? { ...d, meta_actual: null, meta_actual_desde: null } : d));
    setGuardandoMeta(false);
    toast.success("Meta completada. ¡Felicitaciones!");
  };

  const reunionVer = reuniones.find((r) => r.id === reunionVerId);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-4 max-w-[920px] mx-auto">
      <SeguimientoHeader
        discipulos={discipulos}
        selectedId={selectedId}
        onSelect={handleSelectDiscipulo}
        discipulo={discipulo}
        reuniones={reuniones}
        pct={pct}
        cargandoReuniones={cargandoReuniones}
      />

      {!selectedId ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Seleccioná un discípulo para iniciar la reunión de seguimiento
        </p>
      ) : discipulo ? (
        <>
          <MetaActualCard
            metaActual={discipulo.meta_actual}
            metaActualDesde={discipulo.meta_actual_desde}
            onGuardar={handleGuardarMeta}
            onCompletar={handleCompletarMeta}
            saving={guardandoMeta}
          />

          {reunionVer ? (
            <ResumenReunion
              reunion={reunionVer}
              indicadores={indicadores}
              areas={areas}
              saving={saving}
              editable={semanaActualReunion?.id === reunionVer.id}
              onEditar={() => { setReunionVerId(null); w.setSaved(false); }}
              onCerrar={() => setReunionVerId(null)}
            />
          ) : w.saved && semanaActualReunion ? (
            <ResumenReunion
              reunion={semanaActualReunion}
              indicadores={indicadores}
              areas={areas}
              saving={saving}
              editable
              onEditar={() => w.setSaved(false)}
            />
          ) : (
            <>
              <ReunionForm w={w} areas={areas} indicadores={indicadores} />

              {semanaActualReunion && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium text-center">
                  Ya hay una reunión de esta semana guardada · se actualizará al guardar
                </p>
              )}

              <div className="flex justify-end pt-1">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  <Save className="h-4 w-4 mr-1" />
                  {semanaActualReunion ? "Actualizar reunión" : "Guardar reunión"}
                </Button>
              </div>
            </>
          )}

          <DesafiosCard
            desafios={desafios}
            nuevoDesafio={nuevoDesafio}
            setNuevoDesafio={setNuevoDesafio}
            onAgregar={handleAgregarDesafio}
            onSolicitarEliminar={(id) => setDeleteId(id)}
          />

          <HistorialSemanal
            reuniones={reuniones}
            indicadores={indicadores}
            areas={areas}
            reunionSeleccionadaId={reunionVerId}
            onSeleccionarReunion={(id) => setReunionVerId((prev) => (prev === id ? null : id))}
          />
        </>
      ) : null}

      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar desafío</DialogTitle>
            <DialogDescription>¿Estás seguro de eliminar este desafío? Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" size="sm" onClick={handleEliminarDesafio}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}