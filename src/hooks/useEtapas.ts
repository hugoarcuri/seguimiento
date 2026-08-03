"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { Etapa } from "@/types/database";

let cachedEtapas: Etapa[] | null = null;

export function useEtapas() {
  const [etapas, setEtapas] = useState<Etapa[]>(cachedEtapas || []);
  const [loading, setLoading] = useState(cachedEtapas === null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    (async () => {
      try {
        const { data } = await supabase.from("etapas").select("*").order("orden", { ascending: true });
        if (!mounted) return;
        const list = (data as Etapa[]) || [];
        cachedEtapas = list;
        setEtapas(list);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const refresh = async () => {
    cachedEtapas = null;
    const supabase = createClient();
    const { data } = await supabase.from("etapas").select("*").order("orden", { ascending: true });
    const list = (data as Etapa[]) || [];
    cachedEtapas = list;
    setEtapas(list);
    setLoading(false);
  };

  return { etapas, loading, refresh };
}
