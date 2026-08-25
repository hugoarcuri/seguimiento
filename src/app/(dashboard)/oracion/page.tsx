"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { OracionClient } from "./oracion-client";

export default function OracionPage() {
  const [oraciones, setOraciones] = useState<Array<{ id: string; miembro_id: string; pedido: string; respuesta?: string; estado: string; fecha: string; miembros?: { nombre: string; apellido: string } }>>([]);
  const [miembros, setMiembros] = useState<Array<{ id: string; nombre: string; apellido: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("oraciones").select("*, miembros:miembro_id(nombre, apellido)").order("fecha", { ascending: false }),
      supabase.from("miembros").select("id, nombre, apellido").eq("estado", "activo").order("apellido", { ascending: true }),
    ]).then(([oracionesRes, miembrosRes]) => {
      setOraciones(oracionesRes.data || []);
      setMiembros(miembrosRes.data || []);
      setLoading(false);
    }).catch(() => {});
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;

  return <OracionClient oraciones={oraciones} setOraciones={setOraciones} miembros={miembros} />;
}
