"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { Miembro } from "@/types/database";

let cachedMiembro: Miembro | null = null;
let cachedUserId: string | null = null;

export function useMiembroActual() {
  const [miembro, setMiembro] = useState<Miembro | null>(cachedMiembro);
  const [loading, setLoading] = useState(cachedMiembro === null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted || !user) { if (mounted) setLoading(false); return; }

      if (cachedUserId === user.id && cachedMiembro) {
        if (mounted) setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("miembros")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!mounted) return;

      cachedUserId = user.id;
      cachedMiembro = (data as Miembro) || null;
      setMiembro(cachedMiembro);
      setLoading(false);
    })();

    return () => { mounted = false; };
  }, []);

  const refresh = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("miembros")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    cachedUserId = user.id;
    cachedMiembro = (data as Miembro) || null;
    setMiembro(cachedMiembro);
  };

  return { miembro, loading, refresh };
}
