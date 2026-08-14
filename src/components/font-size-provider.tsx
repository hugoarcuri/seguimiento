"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "app:font-scale:v1";
const MIN_SCALE = 0.7;
const MAX_SCALE = 1.5;
const BASE_PERCENT = 115;

interface FontSizeContextType {
  scale: number;
  increase: () => void;
  decrease: () => void;
  reset: () => void;
}

const FontSizeContext = createContext<FontSizeContextType>({
  scale: 1,
  increase: () => {},
  decrease: () => {},
  reset: () => {},
});

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = Number.parseFloat(stored);
          if (Number.isFinite(parsed)) {
            setScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, parsed)));
          }
        }
      } catch {
        // almacenamiento no disponible (modo incógnito, file://, etc.)
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${(scale * BASE_PERCENT).toFixed(0)}%`;
    try {
      window.localStorage.setItem(STORAGE_KEY, scale.toString());
    } catch {
      // almacenamiento no disponible (modo incógnito, file://, etc.)
    }
  }, [scale]);

  const increase = () => setScale((s) => Math.min(MAX_SCALE, +(s + 0.1).toFixed(1)));
  const decrease = () => setScale((s) => Math.max(MIN_SCALE, +(s - 0.1).toFixed(1)));
  const reset = () => setScale(1);

  return (
    <FontSizeContext.Provider value={{ scale, increase, decrease, reset }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export const useFontSize = () => useContext(FontSizeContext);
