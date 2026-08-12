"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { cargarRadar, type DiscipuloRadar } from "./radar-data";
import { DiscipulosClient } from "./discipulos-client";
import type { Etapa } from "@/types/database";

export default function DiscipulosPage() {
  const { user } = useUser();
  const [discipulos, setDiscipulos] = useState<DiscipuloRadar[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarDatos = useCallback(async () => {
    const { discipulos: lista, etapas: etapasLista } = await cargarRadar();
    setDiscipulos(lista);
    setEtapas(etapasLista);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await cargarDatos();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [cargarDatos]);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;

  return (
    <DiscipulosClient
      discipulos={discipulos}
      etapas={etapas}
      esAdmin={user?.rol === "admin"}
      onCambio={cargarDatos}
    />
  );
}
