"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";

/**
 * Bloquea el acceso a la página para roles no permitidos,
 * redirigiendo al dashboard cuando el usuario carga.
 *
 * Los roles se pasan como array literal constante en cada call site.
 * No se incluyen en las dependencias del efecto porque son siempre
 * los mismos valores estáticos (ej. ["admin"]).
 */
export function useRequireRol(rolesPermitidos: string[]) {
  const { user, loading } = useUser();
  const router = useRouter();

  const permitido = !loading && user !== null && rolesPermitidos.includes(user.rol);

  useEffect(() => {
    if (loading) return;
    if (!user || !rolesPermitidos.includes(user.rol)) {
      router.replace("/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, router]);

  return { permitido, loading };
}
