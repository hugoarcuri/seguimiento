"use client";

import { useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { usePalette, type PaletteId } from "@/components/palette-provider";

const ROL_PALETTE: Record<string, PaletteId> = {
  admin: "amber",
  discipulador: "indigo",
  miembro: "emerald",
  discipulo: "emerald",
};

export function RolePalette() {
  const { user } = useUser();
  const { setPalette } = usePalette();

  useEffect(() => {
    if (user?.rol && user.rol in ROL_PALETTE) {
      setPalette(ROL_PALETTE[user.rol]);
    }
  }, [user?.rol, setPalette]);

  return null;
}
