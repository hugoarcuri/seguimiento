"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { Profile } from "@/types/database";

// Cache a nivel módulo: Sidebar, Navbar y MobileSidebar comparten
// un único fetch del perfil en vez de hacer 3 por cada montaje.
let cachedProfile: Profile | null = null;

export function invalidarCachePerfil() {
  cachedProfile = null;
}

async function fetchProfile(id: string): Promise<Profile | null> {
  if (cachedProfile) return cachedProfile;
  const supabase = createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", id).single();
  cachedProfile = data || null;
  return cachedProfile;
}

export function useUser() {
  const [user, setUser] = useState<Profile | null>(cachedProfile);
  const [loading, setLoading] = useState(cachedProfile === null);
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
        const profile = await fetchProfile(authUser.id);
        if (!mounted) return;
        if (profile?.deleted_at) {
          const supabase = createClient();
          await supabase.auth.signOut();
          cachedProfile = null;
          setUser(null);
          router.replace("/login");
          return;
        }
        setUser(profile);
      } else {
        cachedProfile = null;
        setUser(null);
      }
      if (mounted) setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        cachedProfile = null;
        fetchProfile(session.user.id).then(async (profile) => {
          if (!mounted) return;
          if (profile?.deleted_at) {
            await supabase.auth.signOut();
            cachedProfile = null;
            setUser(null);
            router.replace("/login");
            return;
          }
          setUser(profile);
        });
      } else {
        cachedProfile = null;
        setUser(null);
      }
      if (mounted) setLoading(false);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    cachedProfile = null;
    setUser(null);
    router.push("/login");
  };

  return { user, loading, logout };
}
