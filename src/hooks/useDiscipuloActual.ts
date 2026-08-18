"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { Discipulo } from "@/types/database";

let cachedDiscipulo: Discipulo | null = null;
let cachedUserId: string | null = null;

export function useDiscipuloActual() {
  const [discipulo, setDiscipulo] = useState<Discipulo | null>(cachedDiscipulo);
  const [loading, setLoading] = useState(cachedDiscipulo === null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted || !user) { if (mounted) setLoading(false); return; }

      if (cachedUserId === user.id && cachedDiscipulo) {
        if (mounted) setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("discipulos")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!mounted) return;
      cachedUserId = user.id;
      cachedDiscipulo = (data as Discipulo) || null;
      setDiscipulo(cachedDiscipulo);
      setLoading(false);
    })();

    return () => { mounted = false; };
  }, []);

  const refresh = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("discipulos")
      .select("*")
      .eq("user_id", user.id)
      .single();

    cachedUserId = user.id;
    cachedDiscipulo = (data as Discipulo) || null;
    setDiscipulo(cachedDiscipulo);
  };

  return { discipulo, loading, refresh };
}
