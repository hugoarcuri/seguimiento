"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { cargarRadar, type MiembroRadar } from "./radar-data";
import { MiembrosClient } from "./miembros-client";
import type { Etapa } from "@/types/database";

export default function MiembrosPage() {
  const { user } = useUser();
  const [miembros, setMiembros] = useState<MiembroRadar[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarDatos = useCallback(async () => {
    const { miembros: lista, etapas: etapasLista } = await cargarRadar();
    setMiembros(lista);
    setEtapas(etapasLista);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await cargarDatos();
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [cargarDatos]);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;

  return (
    <MiembrosClient
      miembros={miembros}
      etapas={etapas}
      esAdmin={user?.rol === "admin"}
      onCambio={cargarDatos}
    />
  );
}
