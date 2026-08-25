"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRequireRol } from "@/hooks/useRequireRol";
import { useUser } from "@/hooks/useUser";
import { useEtapas } from "@/hooks/useEtapas";
import { MiDesempenoClient, type DesempenoData } from "./mi-desempeno-client";
import type { MiembroRaw, AgendaRaw, TareaRaw, SeguimientoRaw } from "@/types/raw-queries";

export default function MiDesempenoPage() {
  const { permitido } = useRequireRol(["discipulador", "admin"]);
  const { user } = useUser();
  const { etapas } = useEtapas();
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState<DesempenoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!permitido || !user) return;

    (async () => {
      const now = new Date();
      const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const inicioTrimestre = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 10);
      const hoy = now.toISOString().slice(0, 10);

      const [miembrosRes, agendaRes, tareasRes, seguimientosRes] = await Promise.all([
        supabase
          .from("miembros")
          .select("id, nombre, apellido, avatar_url, etapa_id, estado")
          .eq("lider_id", user.id)
          .eq("estado", "activo"),
        supabase
          .from("agenda")
          .select("miembro_id, fecha, realizada")
          .eq("lider_id", user.id)
          .gte("fecha", inicioTrimestre),
        supabase
          .from("tareas")
          .select("miembro_id, estado, fecha_limite")
          .eq("lider_id", user.id),
        supabase
          .from("seguimientos")
          .select("miembro_id, etapa, progreso, estado")
          .eq("discipulador_id", user.id)
          .eq("estado", "activo"),
      ]);

      const miembros = (miembrosRes.data || []) as MiembroRaw[];
      const agenda = (agendaRes.data || []) as AgendaRaw[];
      const tareas = (tareasRes.data || []) as TareaRaw[];
      const seguimientos = (seguimientosRes.data || []) as SeguimientoRaw[];

      const mapaSeg: Record<string, SeguimientoRaw> = {};
      for (const s of seguimientos) mapaSeg[s.miembro_id] = s;

      const tabla = miembros.map((m) => {
        const agendaMiembro = agenda.filter((a) => a.miembro_id === m.id);
        const realizadasMes = agendaMiembro.filter(
          (a) => a.realizada && a.fecha >= inicioMes && a.fecha <= hoy
        ).length;
        const programadasMes = agendaMiembro.filter(
          (a) => a.fecha >= inicioMes && a.fecha <= hoy
        ).length;
        const ultimaVisita = agendaMiembro
          .filter((a) => a.realizada)
          .sort((a, b) => b.fecha.localeCompare(a.fecha))[0]?.fecha || null;

        const tareasMiembro = tareas.filter((t) => t.miembro_id === m.id);
        const tareasCompletadas = tareasMiembro.filter((t) => t.estado === "completada").length;
        const tareasPendientes = tareasMiembro.filter((t) => t.estado === "pendiente").length;
        const tareasVencidas = tareasMiembro.filter((t) => t.estado === "vencida").length;
        const totalTareas = tareasMiembro.length;

        const seg = mapaSeg[m.id];

        return {
          id: m.id,
          nombre: m.nombre,
          apellido: m.apellido,
          avatar_url: m.avatar_url || null,
          etapa_id: m.etapa_id,
          etapa_nombre: etapas.find((e) => e.id === m.etapa_id)?.nombre || `Etapa ${m.etapa_id}`,
          progreso: seg?.progreso ?? 0,
          visitasMes: realizadasMes,
          programadasMes,
          ultimaVisita,
          diasSinContacto: ultimaVisita
            ? Math.floor((now.getTime() - new Date(ultimaVisita + "T12:00:00").getTime()) / 86400000)
            : null,
          tareasTotal: totalTareas,
          tareasCompletadas,
          tareasPendientes,
          tareasVencidas,
          cumplimiento: totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : null,
        };
      });

      const miembrosTotal = miembros.length;
      const visitasMes = tabla.reduce((s, t) => s + t.visitasMes, 0);
      const tareasCompletadasTotal = tabla.reduce((s, t) => s + t.tareasCompletadas, 0);
      const tareasPendientesTotal = tabla.reduce((s, t) => s + t.tareasPendientes, 0);
      const tareasVencidasTotal = tabla.reduce((s, t) => s + t.tareasVencidas, 0);
      const totalTareasGeneral = tabla.reduce((s, t) => s + t.tareasTotal, 0);
      const cumplimientoPromedio =
        tabla.filter((t) => t.cumplimiento !== null).length > 0
          ? Math.round(
              tabla.filter((t) => t.cumplimiento !== null).reduce((s, t) => s + (t.cumplimiento || 0), 0) /
                tabla.filter((t) => t.cumplimiento !== null).length
            )
          : null;
      const sinVisita = tabla.filter((t) => t.visitasMes === 0).length;
      const enRiesgo = tabla.filter((t) => (t.diasSinContacto ?? 999) >= 15).length;

      setData({
        kpis: {
          miembrosTotal,
          visitasMes,
          tareasCompletadas: tareasCompletadasTotal,
          tareasPendientes: tareasPendientesTotal,
          tareasVencidas: tareasVencidasTotal,
          totalTareas: totalTareasGeneral,
          cumplimientoPromedio,
          sinVisita,
          enRiesgo,
        },
        tabla,
      });
      setLoading(false);
    })();
  }, [permitido, user, supabase, etapas]);

  if (!permitido || loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <MiDesempenoClient data={data} />;
}
