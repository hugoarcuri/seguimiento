"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DiscipuladoresClient } from "./discipuladores-client";
import type { Profile, Miembro, Etapa } from "@/types/database";
import { useRequireRol } from "@/hooks/useRequireRol";
import { useSyncMiembros } from "@/hooks/useSyncMiembros";

export default function DiscipuladoresPage() {
  const { permitido, loading: autorizando } = useRequireRol(["admin"]);
  const [discipuladores, setDiscipuladores] = useState<Profile[]>([]);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);

  useSyncMiembros();

  const cargarDatos = useCallback(async () => {
    const supabase = createClient();
    const [discipuladoresRes, miembrosRes, etapasRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("rol", "discipulador").order("apellido", { ascending: true }),
      supabase
        .from("miembros")
        .select("id, apellido, nombre, avatar_url, etapa_id, estado, lider_id, created_at, updated_at")
        .order("apellido", { ascending: true }),
      supabase.from("etapas").select("*").order("orden", { ascending: true }),
    ]);
    setDiscipuladores(discipuladoresRes.data || []);
    setMiembros((miembrosRes.data as Miembro[] | null) || []);
    setEtapas(etapasRes.data || []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await cargarDatos();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [cargarDatos]);

  if (loading || autorizando) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;
  if (!permitido) return null;

  return <DiscipuladoresClient discipuladores={discipuladores} miembros={miembros} etapas={etapas} onCambio={cargarDatos} />;
}
