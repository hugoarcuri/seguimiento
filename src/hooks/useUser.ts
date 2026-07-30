"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { Profile } from "@/types/database";

export function useUser() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    const getUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (!mounted) return;
        setUser(profile);
      }
      if (mounted) setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (!mounted) return;
        setUser(profile);
      } else {
        setUser(null);
      }
      if (mounted) setLoading(false);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
  };

  return { user, loading, logout };
}
