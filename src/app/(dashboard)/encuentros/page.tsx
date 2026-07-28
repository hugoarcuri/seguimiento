"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EncuentrosClient } from "./encuentros-client";
import type { Encuentro } from "@/types/database";

type EncuentroConDiscipulo = Encuentro & { discipulos?: { nombre: string; apellido: string } };

export default function EncuentrosPage() {
  const [encuentros, setEncuentros] = useState<EncuentroConDiscipulo[]>([]);
  const [discipulos, setDiscipulos] = useState<Array<{ id: string; nombre: string; apellido: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("encuentros").select("*, discipulos:discipulo_id(nombre, apellido)").order("fecha", { ascending: false }),
      supabase.from("discipulos").select("id, nombre, apellido").eq("estado", "activo").order("apellido", { ascending: true }),
    ]).then(([encuentrosRes, discipulosRes]) => {
      setEncuentros(encuentrosRes.data || []);
      setDiscipulos(discipulosRes.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;

  return <EncuentrosClient encuentros={encuentros} discipulos={discipulos} />;
}
