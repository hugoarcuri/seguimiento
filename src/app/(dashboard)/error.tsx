"use client";

export default function DashboardError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-xl font-bold">Algo salió mal</h2>
      <p className="text-muted-foreground text-sm">Ocurrió un error al cargar esta página.</p>
      <button
        onClick={reset}
        className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-8 gap-1.5 px-2.5 text-sm font-medium"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
