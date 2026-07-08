"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DiscipuloForm } from "../discipulo-form";
import type { Etapa, Profile } from "@/types/database";

export default function NuevoDiscipuloPage() {
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [lideres, setLideres] = useState<Pick<Profile, "id" | "nombre" | "apellido">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("etapas").select("*").order("orden", { ascending: true }),
      supabase.from("profiles").select("id, nombre, apellido").eq("rol", "admin"),
    ]).then(([etapasRes, lideresRes]) => {
      setEtapas(etapasRes.data || []);
      setLideres(lideresRes.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuevo Discípulo</h1>
        <p className="text-muted-foreground">Registra un nuevo discípulo en el sistema</p>
      </div>
      <DiscipuloForm etapas={etapas} lideres={lideres} />
    </div>
  );
}
