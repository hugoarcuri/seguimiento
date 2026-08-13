"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type PaletteId = "amber" | "indigo" | "emerald";

export interface PaletteDef {
  id: PaletteId;
  label: string;
  swatch: string;
}

export const PALETAS: PaletteDef[] = [
  { id: "amber", label: "Ámbar", swatch: "#d97706" },
  { id: "indigo", label: "Índigo", swatch: "#4f46e5" },
  { id: "emerald", label: "Esmeralda", swatch: "#059669" },
];

const STORAGE_KEY = "app:palette:v1";
const DEFAULT_PALETTE: PaletteId = "amber";

interface PaletteContextType {
  palette: PaletteId;
  setPalette: (p: PaletteId) => void;
}

const PaletteContext = createContext<PaletteContextType>({
  palette: DEFAULT_PALETTE,
  setPalette: () => {},
});

function esPaletaValida(v: unknown): v is PaletteId {
  return PALETAS.some((p) => p.id === v);
}

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [palette, setPalette] = useState<PaletteId>(DEFAULT_PALETTE);

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored && esPaletaValida(stored)) setPalette(stored);
      } catch {
        // almacenamiento no disponible (modo incógnito, file://, etc.)
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    for (const p of PALETAS) root.classList.remove(`palette-${p.id}`);
    root.classList.add(`palette-${palette}`);
    try {
      window.localStorage.setItem(STORAGE_KEY, palette);
    } catch {
      // almacenamiento no disponible (modo incógnito, file://, etc.)
    }
  }, [palette]);

  const cambiar = (p: PaletteId) => setPalette(p);

  return (
    <PaletteContext.Provider value={{ palette, setPalette: cambiar }}>
      {children}
    </PaletteContext.Provider>
  );
}

export const usePalette = () => useContext(PaletteContext);
