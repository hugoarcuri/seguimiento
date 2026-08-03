"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface ComentarioExpandibleProps {
  value: string;
  onChange: (t: string) => void;
  placeholder?: string;
}

export function ComentarioExpandible({ value, onChange, placeholder }: ComentarioExpandibleProps) {
  const [abierto, setAbierto] = useState(value.length > 0);

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setAbierto((o) => !o)}
        aria-expanded={abierto}
        aria-label={value ? "Comentario agregado" : "Agregar comentario"}
        className={`inline-flex items-center gap-1.5 text-[11px] font-medium rounded-md px-1.5 py-0.5 transition-colors ${
          value
            ? "text-primary hover:text-primary/80"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <MessageSquarePlus className="h-3 w-3" />
        {value ? "Comentario agregado" : placeholder || "Agregar comentario"}
        <svg
          className={`h-3 w-3 transition-transform duration-200 ${abierto ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div className={`grid transition-all duration-200 ease-in-out ${abierto ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <Textarea
            rows={2}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "Escribí un comentario..."}
            className="text-sm"
          />
        </div>
      </div>
    </div>
  );
}
