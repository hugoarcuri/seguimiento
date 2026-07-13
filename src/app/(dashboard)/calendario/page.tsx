"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CalendarioClient } from "./calendario-client";

export default function CalendarioPage() {
  const [encuentros, setEncuentros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("encuentros")
      .select("*, discipulos:discipulo_id(nombre, apellido)")
      .order("fecha", { ascending: true })
      .then((res) => {
        setEncuentros(res.data || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;

  return <CalendarioClient encuentros={encuentros} clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""} />;
}
