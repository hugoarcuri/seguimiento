"use client";

import { Button } from "@/components/ui/button";
import { useFontSize } from "@/components/font-size-provider";
import { cn } from "@/lib/utils";

export function FontControls({ className }: { className?: string }) {
  const { scale, increase, decrease, reset } = useFontSize();

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="h-11 w-11 text-xs font-bold md:h-9 md:w-9 lg:h-8 lg:w-8"
        onClick={decrease}
        title="Reducir texto"
        aria-label="Reducir tamaño de texto"
      >
        A−
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-11 w-11 text-xs text-muted-foreground md:h-9 md:w-9 lg:h-8 lg:w-8"
        onClick={reset}
        title="Restablecer tamaño"
        aria-label="Restablecer tamaño de texto"
      >
        {Math.round(scale * 100)}%
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-11 w-11 text-sm font-bold md:h-9 md:w-9 lg:h-8 lg:w-8"
        onClick={increase}
        title="Aumentar texto"
        aria-label="Aumentar tamaño de texto"
      >
        A+
      </Button>
    </div>
  );
}
