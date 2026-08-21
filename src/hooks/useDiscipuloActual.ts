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

      const { data: miembroId, error: rpcError } = await supabase.rpc("ensure_miembro");

      if (!mounted) return;

      if (rpcError || !miembroId) {
        cachedUserId = user.id;
        cachedMiembro = null;
        setMiembro(null);
        setLoading(false);
        return;
      }

      if (miembroId) {
        const { data } = await supabase
          .from("miembros")
          .select("*")
          .eq("id", miembroId)
          .single();

        if (!mounted) return;
        cachedUserId = user.id;
        cachedMiembro = (data as Miembro) || null;
        setMiembro(cachedMiembro);
      } else {
        cachedUserId = user.id;
        cachedMiembro = null;
        setMiembro(null);
      }
      setLoading(false);
    })();

    return () => { mounted = false; };
  }, []);

  const refresh = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: miembroId, error: rpcError } = await supabase.rpc("ensure_miembro");

    if (rpcError || !miembroId) {
      cachedUserId = user.id;
      cachedMiembro = null;
      setMiembro(null);
      return;
    }

    const { data } = await supabase
      .from("miembros")
      .select("*")
      .eq("id", miembroId)
      .single();

    cachedUserId = user.id;
    cachedMiembro = (data as Miembro) || null;
    setMiembro(cachedMiembro);
  };

  return { miembro, loading, refresh };
}
