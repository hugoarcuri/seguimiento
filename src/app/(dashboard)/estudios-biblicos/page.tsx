"use client";

import { useUser } from "@/hooks/useUser";
import { EstudiosBiblicosClient } from "./estudios-biblicos-client";

export default function EstudiosBiblicosPage() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  const puedeVerGuia = user?.rol === "admin" || user?.rol === "discipulador";

  return <EstudiosBiblicosClient puedeVerGuia={puedeVerGuia} />;
}
