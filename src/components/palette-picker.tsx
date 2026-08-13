"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette, Check } from "lucide-react";
import { PALETAS, usePalette, type PaletteId } from "@/components/palette-provider";

export function PalettePicker() {
  const { palette, setPalette } = usePalette();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="h-11 w-11 md:h-9 md:w-9 lg:h-8 lg:w-8" title="Color de la app">
            <Palette className="h-4 w-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-52">
        {PALETAS.map((p) => (
          <DropdownMenuItem key={p.id} onClick={() => setPalette(p.id as PaletteId)}>
            <span
              className="mr-2 h-4 w-4 rounded-full border border-border"
              style={{ backgroundColor: p.swatch }}
              aria-hidden
            />
            <span className="flex-1">{p.label}</span>
            {palette === p.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
