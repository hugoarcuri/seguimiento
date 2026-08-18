"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useRef } from "react";

let synced = false;

export function useSyncMiembros() {
  const ran = useRef(false);

  useEffect(() => {
    if (synced || ran.current) return;
    ran.current = true;
    synced = true;

    const supabase = createClient();
    supabase.rpc("admin_sync_miembros_discipulos").then(({ error }) => {
      if (error) console.error("sync miembros:", error);
    });
  }, []);
}
