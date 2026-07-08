"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { OracionClient } from "./oracion-client";

export default function OracionPage() {
  const [oraciones, setOraciones] = useState<any[]>([]);
  const [discipulos, setDiscipulos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("oraciones").select("*, discipulos:discipulo_id(nombre, apellido)").order("fecha", { ascending: false }),
      supabase.from("discipulos").select("id, nombre, apellido").eq("estado", "activo").order("apellido", { ascending: true }),
    ]).then(([oracionesRes, discipulosRes]) => {
      setOraciones(oracionesRes.data || []);
      setDiscipulos(discipulosRes.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;

  return <OracionClient oraciones={oraciones} discipulos={discipulos} />;
}
