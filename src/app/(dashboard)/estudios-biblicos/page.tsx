"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useEtapas } from "@/hooks/useEtapas";
import { createClient } from "@/lib/supabase/client";
import { EstudiosBiblicosClient } from "./estudios-biblicos-client";

export default function EstudiosBiblicosPage() {
  const { user, loading: userLoading } = useUser();
  const { etapas, loading: etapasLoading } = useEtapas();
  const [etapaMiembro, setEtapaMiembro] = useState<number | null>(null);

  useEffect(() => {
    if (!user || userLoading) return;
    if (user.rol === "admin" || user.rol === "discipulador") return;

    const supabase = createClient();
    (async () => {
      const { data: miembro } = await supabase
        .from("miembros")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!miembro) return;

      const { data: seg } = await supabase
        .from("seguimientos")
        .select("etapa")
        .eq("miembro_id", miembro.id)
        .eq("estado", "activo")
        .maybeSingle();

      if (seg?.etapa) setEtapaMiembro(seg.etapa);
    })();
  }, [user, userLoading]);

  if (userLoading || etapasLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  const puedeVerGuia = user?.rol === "admin" || user?.rol === "discipulador";

  return (
    <EstudiosBiblicosClient
      etapas={etapas}
      puedeVerGuia={puedeVerGuia}
      etapaMiembro={etapaMiembro}
    />
  );
}
