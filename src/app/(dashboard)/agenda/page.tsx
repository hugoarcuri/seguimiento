"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AgendaClient } from "./agenda-client";
import type { Agenda } from "@/types/database";

type AgendaConMiembro = Agenda & { miembros?: { nombre: string; apellido: string } };

export default function AgendaPage() {
  const [agendas, setAgendas] = useState<AgendaConMiembro[]>([]);
  const [miembros, setMiembros] = useState<Array<{ id: string; nombre: string; apellido: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("agenda").select("*, miembros:miembro_id(nombre, apellido)").order("fecha", { ascending: false }),
      supabase.from("miembros").select("id, nombre, apellido").eq("estado", "activo").order("apellido", { ascending: true }),
    ]).then(([agendasRes, miembrosRes]) => {
      setAgendas(agendasRes.data || []);
      setMiembros(miembrosRes.data || []);
      setLoading(false);
    }).catch(() => {});
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;

  return <AgendaClient agendas={agendas} setAgendas={setAgendas} miembros={miembros} />;
}