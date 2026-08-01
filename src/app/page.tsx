"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const [redirigiendo, setRedirigiendo] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelado = false;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelado) return;
      router.replace(user ? "/dashboard" : "/login");
      setRedirigiendo(false);
    });

    return () => {
      cancelado = true;
    };
  }, [router]);

  if (redirigiendo) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </main>
    );
  }

  return null;
}
