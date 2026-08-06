export function descargarCSV(nombreArchivo: string, filas: Record<string, unknown>[]): number {
  if (filas.length === 0) return 0;
  const headers = Object.keys(filas[0]);
  const csv = [
    headers.join(";"),
    ...filas.map((f) => headers.map((h) => `"${String(f[h] ?? "").replace(/"/g, '""')}"`).join(";")),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(a.href);
  return filas.length;
}
