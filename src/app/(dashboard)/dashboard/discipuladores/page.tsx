"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DiscipuladoresDashboardClient } from "./discipuladores-dashboard-client";
import { useEtapas } from "@/hooks/useEtapas";
import { useRequireRol } from "@/hooks/useRequireRol";
import { differenceInCalendarDays } from "date-fns";

const PROGRESO_BAJO = 40;
const SIN_CONTACTO_DIAS = 15;

interface DiscipuloRaw {
  id: string;
  nombre: string;
  apellido: string;
  avatar_url?: string | null;
  etapa_id: number;
  estado: string;
  lider_id?: string | null;
}

interface SeguimientoRaw {
  id: string;
  discipulo_id: string;
  progreso: number;
  estado: string;
}

interface AgendaRaw {
  id: string;
  discipulo_id: string;
  fecha: string;
}

interface DiscipuladorRaw {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
}

interface RawData {
  discipuladores: DiscipuladorRaw[];
  discipulos: DiscipuloRaw[];
  seguimientos: SeguimientoRaw[];
  agenda: AgendaRaw[];
}

export default function DiscipuladoresDashboardPage() {
  const { etapas } = useEtapas();
  const { permitido, loading: autorizando } = useRequireRol(["admin"]);
  const [raw, setRaw] = useState<RawData | null>(null);

  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      supabase.from("profiles").select("id, nombre, apellido, email").eq("rol", "discipulador").order("apellido", { ascending: true }),
      supabase.from("discipulos").select("id, nombre, apellido, avatar_url, etapa_id, estado, lider_id"),
      supabase.from("seguimientos").select("id, discipulo_id, progreso, estado"),
      supabase.from("agenda").select("id, discipulo_id, fecha").order("fecha", { ascending: false }),
    ]).then(([discipuladoresRes, discipulosRes, seguimientosRes, agendaRes]) => {
      setRaw({
        discipuladores: (discipuladoresRes.data || []) as DiscipuladorRaw[],
        discipulos: (discipulosRes.data || []) as DiscipuloRaw[],
        seguimientos: (seguimientosRes.data || []) as SeguimientoRaw[],
        agenda: (agendaRes.data || []) as AgendaRaw[],
      });
    }).catch(console.error);
  }, []);

  const data = useMemo(() => {
    if (!raw || etapas.length === 0) return null;
    const { discipuladores, discipulos, seguimientos, agenda } = raw;
    const hoy = new Date();
    const diasDesde = (fecha: string) => differenceInCalendarDays(hoy, new Date(fecha + "T00:00:00"));

    const segPorDiscipulo = new Map<string, SeguimientoRaw>();
    for (const s of seguimientos) {
      const existente = segPorDiscipulo.get(s.discipulo_id);
      if (!existente || (s.estado === "activo" && existente.estado !== "activo")) {
        segPorDiscipulo.set(s.discipulo_id, s);
      }
    }

    const ultimoEncuentro = new Map<string, string>();
    for (const a of agenda) {
      if (!ultimoEncuentro.has(a.discipulo_id)) ultimoEncuentro.set(a.discipulo_id, a.fecha);
    }

    const enRiesgo = (d: DiscipuloRaw, seg?: SeguimientoRaw): string[] => {
      const razones: string[] = [];
      if (!seg) razones.push("Sin seguimiento");
      else if (seg.progreso < PROGRESO_BAJO) razones.push(`Progreso bajo (${seg.progreso}%)`);
      const f = ultimoEncuentro.get(d.id);
      if (!f) razones.push("Sin encuentros");
      else if (diasDesde(f) >= SIN_CONTACTO_DIAS) razones.push(`Sin encuentro (${diasDesde(f)} días)`);
      return razones;
    };

    const detalle = discipuladores.map((disc) => {
      const susDiscipulos = discipulos.filter((d) => d.lider_id === disc.id);
      const conSeg = susDiscipulos.map((d) => ({ d, seg: segPorDiscipulo.get(d.id) }));
      const enRiesgoCount = susDiscipulos.filter((d) => enRiesgo(d, segPorDiscipulo.get(d.id)).length > 0).length;
      const sinContacto = susDiscipulos.filter((d) => {
        const f = ultimoEncuentro.get(d.id);
        return !f || diasDesde(f) >= SIN_CONTACTO_DIAS;
      }).length;
      const progresos = conSeg.filter((x) => x.seg && x.seg.estado === "activo" && x.seg.progreso != null).map((x) => x.seg!.progreso);
      const progresoPromedio = progresos.length ? Math.round(progresos.reduce((a, b) => a + b, 0) / progresos.length) : null;
      const listosAvanzar = conSeg.filter((x) => x.seg && x.seg.estado === "activo" && x.seg.progreso >= 80).length;

      return {
        id: disc.id,
        nombre: disc.nombre,
        apellido: disc.apellido,
        email: disc.email,
        total: susDiscipulos.length,
        activos: susDiscipulos.filter((d) => d.estado === "activo").length,
        enRiesgo: enRiesgoCount,
        sinContacto,
        progresoPromedio,
        listosAvanzar,
        discipulos: susDiscipulos.map((d) => {
          const seg = segPorDiscipulo.get(d.id);
          const f = ultimoEncuentro.get(d.id);
          const etapa = etapas.find((e) => e.id === d.etapa_id);
          return {
            id: d.id,
            nombre: d.nombre,
            apellido: d.apellido,
            avatar_url: d.avatar_url || null,
            estado: d.estado,
            etapa: etapa?.nombre ? etapa.nombre.replace(/^\d+\.\s*/, "") : `Etapa ${d.etapa_id}`,
            progreso: seg?.progreso ?? null,
            razones: enRiesgo(d, seg),
            diasSinContacto: f ? diasDesde(f) : null,
          };
        }),
      };
    });

    const totalAsignados = detalle.reduce((acc, x) => acc + x.total, 0);
    const totalEnRiesgo = detalle.reduce((acc, x) => acc + x.enRiesgo, 0);
    const totalSinContacto = detalle.reduce((acc, x) => acc + x.sinContacto, 0);

    const sinDiscipulos = discipuladores.filter(
      (d) => !discipulos.some((x) => x.lider_id === d.id)
    ).length;

    return {
      kpis: {
        totalDiscipuladores: discipuladores.length,
        totalAsignados,
        totalEnRiesgo,
        totalSinContacto,
        sinDiscipulos,
      },
      detalle: detalle
        .slice()
        .sort((a, b) => b.enRiesgo - a.enRiesgo || b.sinContacto - a.sinContacto || a.total - b.total),
    };
  }, [raw, etapas]);

  if (!data || autorizando) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;
  if (!permitido) return null;

  return <DiscipuladoresDashboardClient data={data} />;
}
