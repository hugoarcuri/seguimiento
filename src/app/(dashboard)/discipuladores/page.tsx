"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DiscipuladoresClient } from "./discipuladores-client";
import type { Profile, Miembro, Etapa } from "@/types/database";
import { useRequireRol } from "@/hooks/useRequireRol";


export default function DiscipuladoresPage() {
  const { permitido, loading: autorizando } = useRequireRol(["admin"]);
  const supabase = useMemo(() => createClient(), []);
  const [discipuladores, setDiscipuladores] = useState<Profile[]>([]);
  const [discipuladoresEliminados, setDiscipuladoresEliminados] = useState<Profile[]>([]);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarDatos = useCallback(async () => {
    const [discipuladoresRes, eliminadosRes, miembrosRes, etapasRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("rol", "discipulador").is("deleted_at", null).order("apellido", { ascending: true }),
      supabase.from("profiles").select("*").eq("rol", "discipulador").not("deleted_at", "is", null).order("apellido", { ascending: true }),
      supabase
        .from("miembros")
        .select("id, apellido, nombre, avatar_url, etapa_id, estado, lider_id, created_at, updated_at")
        .order("apellido", { ascending: true }),
      supabase.from("etapas").select("*").order("orden", { ascending: true }),
    ]);
    setDiscipuladores(discipuladoresRes.data || []);
    setDiscipuladoresEliminados(eliminadosRes.data || []);
    setMiembros((miembrosRes.data as Miembro[] | null) || []);
    setEtapas(etapasRes.data || []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await cargarDatos();
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [cargarDatos]);

  if (loading || autorizando) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;
  if (!permitido) return null;

  return <DiscipuladoresClient discipuladores={discipuladores} discipuladoresEliminados={discipuladoresEliminados} miembros={miembros} etapas={etapas} onCambio={cargarDatos} />;
}
