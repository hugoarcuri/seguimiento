"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useEtapas } from "@/hooks/useEtapas";
import { createClient } from "@/lib/supabase/client";
import { EstudiosBiblicosClient } from "./estudios-biblicos-client";
import type { EstudioBiblicoRespuesta, EstudioBiblicoProgreso } from "@/types/database";

export default function EstudiosBiblicosPage() {
  const { user, loading: userLoading } = useUser();
  const { etapas, loading: etapasLoading } = useEtapas();
  const [etapaMiembro, setEtapaMiembro] = useState<number | null>(null);
  const [miembroId, setMiembroId] = useState<string | null>(null);
  const [respuestas, setRespuestas] = useState<EstudioBiblicoRespuesta[]>([]);
  const [progreso, setProgreso] = useState<EstudioBiblicoProgreso[]>([]);
  const [cargandoRespuestas, setCargandoRespuestas] = useState(true);

  useEffect(() => {
    if (!user || userLoading) return;

    const supabase = createClient();
    (async () => {
      const { data: miembro } = await supabase
        .from("miembros")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (miembro) {
        setMiembroId(miembro.id);

        const { data: seg } = await supabase
          .from("seguimientos")
          .select("etapa")
          .eq("miembro_id", miembro.id)
          .eq("estado", "activo")
          .maybeSingle();

        if (seg?.etapa) setEtapaMiembro(seg.etapa);

        const [respRes, progRes] = await Promise.all([
          supabase.from("estudios_biblicos_respuestas").select("*").eq("miembro_id", miembro.id),
          supabase.from("estudios_biblicos_progreso").select("*").eq("miembro_id", miembro.id),
        ]);

        setRespuestas((respRes.data || []) as EstudioBiblicoRespuesta[]);
        setProgreso((progRes.data || []) as EstudioBiblicoProgreso[]);
      }

      setCargandoRespuestas(false);
    })();
  }, [user, userLoading]);

  const puedeVerGuia = user?.rol === "admin" || user?.rol === "discipulador";

  if (userLoading || etapasLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <EstudiosBiblicosClient
      etapas={etapas}
      puedeVerGuia={puedeVerGuia}
      etapaMiembro={etapaMiembro}
      miembroId={miembroId}
      respuestas={respuestas}
      progreso={progreso}
      cargandoRespuestas={cargandoRespuestas}
      onActualizarRespuestas={setRespuestas}
      onActualizarProgreso={setProgreso}
    />
  );
}
