"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) {
      router.push("/login");
      return;
    }
    const supabase = createClient();
    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error: exchangeError }) => {
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
        router.push("/dashboard");
        router.refresh();
      });
  }, [router]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted p-4">
      <div aria-hidden className="pointer-events-none absolute -top-40 -right-32 h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-44 -left-28 h-[26rem] w-[26rem] rounded-full bg-primary/10 blur-3xl" />
      {error ? (
        <p className="relative text-sm text-destructive text-center max-w-sm">{error}</p>
      ) : (
        <Loader2 className="relative h-8 w-8 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
