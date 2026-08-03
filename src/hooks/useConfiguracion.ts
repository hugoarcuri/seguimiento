"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { Configuracion } from "@/types/database";

const SEGUIMIENTO_DEFAULTS = {
  ficha_personal: true,
  resumen: true,
  evaluacion: true,
  objetivos: true,
  encuentros: true,
  historial: true,
  observaciones: true,
  campos_evaluacion: {
    habitos_pecaminosos: true,
    don_espiritual: true,
    ministerio: true,
    relacion_autoridad: true,
    estudia: true,
    trabaja: true,
    convive_con: true,
  },
};

const PERSONAL_DEFAULTS = {
  edad: true,
  sexo: true,
  telefono: true,
  email: true,
  direccion: true,
  ministerio: true,
  dones: true,
  fecha_conversion: true,
  fecha_bautismo: true,
  observaciones: true,
};

function mergeSeguimiento(valor: Record<string, unknown>) {
  return {
    ...SEGUIMIENTO_DEFAULTS,
    ...valor,
    campos_evaluacion: {
      ...SEGUIMIENTO_DEFAULTS.campos_evaluacion,
      ...(typeof valor?.campos_evaluacion === "object" && valor.campos_evaluacion ? valor.campos_evaluacion : {}),
    },
  };
}

function mergePersonal(valor: Record<string, unknown>) {
  return { ...PERSONAL_DEFAULTS, ...valor };
}

// Caché a nivel módulo (patrón de useUser): evita repetir fetch por montaje.
let cachedConfig: (Configuracion & {
  seguimiento: ReturnType<typeof mergeSeguimiento>;
  personal: ReturnType<typeof mergePersonal>;
}) | null = null;

async function fetchConfig() {
  if (cachedConfig) return cachedConfig;
  const supabase = createClient();
  const { data } = await supabase.from("configuracion").select("*").eq("id", 1).maybeSingle();
  if (data) {
    cachedConfig = {
      ...(data as Configuracion),
      seguimiento: mergeSeguimiento(((data as Configuracion).seguimiento || {}) as Record<string, unknown>),
      personal: mergePersonal(((data as Configuracion).personal || {}) as Record<string, unknown>),
    };
  } else {
    cachedConfig = {
      id: 1,
      seguimiento: mergeSeguimiento({}),
      personal: mergePersonal({}),
      updated_at: new Date().toISOString(),
    };
  }
  return cachedConfig;
}

export function useConfiguracion() {
  const [config, setConfig] = useState(cachedConfig);
  const [loading, setLoading] = useState(cachedConfig === null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchConfig();
        if (!mounted) return;
        setConfig(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const refresh = async () => {
    cachedConfig = null;
    const data = await fetchConfig();
    setConfig(data);
    setLoading(false);
  };

  return { config, loading, refresh };
}

export { mergeSeguimiento, mergePersonal };
