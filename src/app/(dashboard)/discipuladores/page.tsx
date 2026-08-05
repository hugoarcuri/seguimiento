"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DiscipuladoresClient } from "./discipuladores-client";
import type { Profile, Discipulo, Etapa } from "@/types/database";

export default function DiscipuladoresPage() {
  const [discipuladores, setDiscipuladores] = useState<Profile[]>([]);
  const [discipulos, setDiscipulos] = useState<Discipulo[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarDatos = useCallback(async () => {
    const supabase = createClient();
    const [discipuladoresRes, discipulosRes, etapasRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("rol", "discipulador").order("apellido", { ascending: true }),
      supabase
        .from("discipulos")
        .select("id, apellido, nombre, avatar_url, etapa_id, estado, lider_id, created_at, updated_at")
        .order("apellido", { ascending: true }),
      supabase.from("etapas").select("*").order("orden", { ascending: true }),
    ]);
    setDiscipuladores(discipuladoresRes.data || []);
    setDiscipulos((discipulosRes.data as Discipulo[] | null) || []);
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

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;

  return <DiscipuladoresClient discipuladores={discipuladores} discipulos={discipulos} etapas={etapas} onCambio={cargarDatos} />;
}
