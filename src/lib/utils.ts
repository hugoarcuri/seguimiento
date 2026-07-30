import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const estadoColors: Record<string, string> = {
  activo: "bg-green-500",
  pausado: "bg-yellow-500",
  completado: "bg-blue-500",
  retirado: "bg-red-500",
};

export function calcularEdad(fecha_nacimiento: string): number {
  const hoy = new Date();
  const nac = new Date(fecha_nacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}
