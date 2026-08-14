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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      {error ? (
        <p className="text-sm text-destructive text-center max-w-sm">{error}</p>
      ) : (
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
