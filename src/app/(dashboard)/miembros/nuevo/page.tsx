"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MiembroForm } from "../miembro-form";
import type { Etapa } from "@/types/database";

export default function NuevoMiembroPage() {
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [discipuladores, setDiscipuladores] = useState<Array<{ id: string; nombre: string; apellido: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      try {
        const [etapasRes, discipuladoresRes] = await Promise.all([
          supabase.from("etapas").select("*").order("orden", { ascending: true }),
          supabase.from("profiles").select("id, nombre, apellido").or("rol.eq.discipulador,rol.eq.admin").order("apellido", { ascending: true }),
        ]);
        setEtapas(etapasRes.data || []);
        setDiscipuladores(discipuladoresRes.data || []);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold break-words">Nuevo Miembro</h1>
        <p className="text-muted-foreground">Registra un nuevo miembro en el sistema</p>
      </div>
      <MiembroForm etapas={etapas} discipuladores={discipuladores} />
    </div>
  );
}
