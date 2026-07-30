"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ObservacionInputProps {
  personaId: string;
  onRegistrar: (id: string, tipo: string, desc: string) => void;
  labelOnly?: boolean;
}

export function ObservacionInput({ personaId, onRegistrar, labelOnly }: ObservacionInputProps) {
  const [val, setVal] = useState("");
  const handle = () => {
    if (!val.trim()) return;
    onRegistrar(personaId, labelOnly ? "observacion" : "acto_servicio", val.trim());
    setVal("");
  };
  return (
    <div className="flex gap-1 w-full mt-1">
      <Input placeholder={labelOnly ? "Escribí una observación..." : "Otro..."} className="h-7 text-xs flex-1" value={val} onChange={(e) => setVal(e.target.value)} />
      <Button size="sm" className="h-7 text-xs" onClick={handle} disabled={!val.trim()}>+</Button>
    </div>
  );
}
