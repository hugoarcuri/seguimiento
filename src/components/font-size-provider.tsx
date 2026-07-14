"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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
    const stored = localStorage.getItem("font-scale");
    if (stored) setScale(parseFloat(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("font-scale", scale.toString());
    document.documentElement.style.fontSize = `${(scale * 100).toFixed(0)}%`;
  }, [scale]);

  const increase = () => setScale((s) => Math.min(1.5, +(s + 0.1).toFixed(1)));
  const decrease = () => setScale((s) => Math.max(0.7, +(s - 0.1).toFixed(1)));
  const reset = () => setScale(1);

  return (
    <FontSizeContext.Provider value={{ scale, increase, decrease, reset }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export const useFontSize = () => useContext(FontSizeContext);
