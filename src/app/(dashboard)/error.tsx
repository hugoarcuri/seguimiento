"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-xl font-bold">Algo salió mal</h2>
      <p className="text-muted-foreground text-sm">Ocurrió un error al cargar esta página.</p>
      <Button onClick={reset} className="h-8 gap-1.5 px-2.5 text-sm font-medium">
        Intentar de nuevo
      </Button>
    </div>
  );
}
