"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DiscipuloForm } from "../discipulo-form";
import type { Etapa } from "@/types/database";

export default function NuevoDiscipuloPage() {
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      try {
        const etapasRes = await supabase.from("etapas").select("*").order("orden", { ascending: true });
        setEtapas(etapasRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuevo Discípulo</h1>
        <p className="text-muted-foreground">Registra un nuevo discípulo en el sistema</p>
      </div>
      <DiscipuloForm etapas={etapas} />
    </div>
  );
}
