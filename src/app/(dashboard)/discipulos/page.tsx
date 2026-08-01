"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DiscipulosClient } from "./discipulos-client";
import type { Discipulo, Etapa } from "@/types/database";

export default function DiscipulosPage() {
  const [discipulos, setDiscipulos] = useState<Discipulo[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarDatos = useCallback(async () => {
    const supabase = createClient();
    const [discipulosRes, etapasRes] = await Promise.all([
      supabase.from("discipulos").select("*").order("created_at", { ascending: false }),
      supabase.from("etapas").select("*").order("orden", { ascending: true }),
    ]);
    setDiscipulos(discipulosRes.data || []);
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

  return <DiscipulosClient discipulos={discipulos} etapas={etapas} onCambio={cargarDatos} />;
}
