"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MaterialesClient } from "./materiales-client";
import type { Etapa } from "@/types/database";

export default function MaterialesPage() {
  const [materiales, setMateriales] = useState<any[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("materiales").select("*, etapas:etapa_id(nombre)").order("created_at", { ascending: false }),
      supabase.from("etapas").select("*").order("orden", { ascending: true }),
    ]).then(([materialesRes, etapasRes]) => {
      setMateriales(materialesRes.data || []);
      setEtapas(etapasRes.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;

  return <MaterialesClient materiales={materiales} etapas={etapas} />;
}
