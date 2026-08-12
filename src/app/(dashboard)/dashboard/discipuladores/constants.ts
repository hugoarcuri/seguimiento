export type Periodo = "7d" | "30d" | "90d" | "todo";

export const DEFAULT_PERIODO: Periodo = "30d";

export const PERIODOS: { value: Periodo; label: string }[] = [
  { value: "7d", label: "Últimos 7 días" },
  { value: "30d", label: "Últimos 30 días" },
  { value: "90d", label: "Últimos 3 meses" },
  { value: "todo", label: "Todo" },
];

export const DIAS_POR_PERIODO: Record<Periodo, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  todo: Infinity,
};

export const PROGRESO_BAJO = 40;
export const SIN_CONTACTO_DIAS = 15;

export const ESTADO_UMBRAL_EXCELENTE = 80;
export const ESTADO_UMBRAL_BUENO = 60;
export const ESTADO_UMBRAL_RIESGO = 40;
export const ESTADO_UMBRAL_CRITICO = 25;

export type EstadoDiscipulador =
  | "excelente"
  | "bueno"
  | "en_riesgo"
  | "necesita_ayuda"
  | "critico"
  | "sin_discipulos";

export const ESTADOS_DISCIPULADOR: Record<
  EstadoDiscipulador,
  { label: string; dot: string; badge: string; card: string; bar: string }
> = {
  excelente: {
    label: "Excelente",
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    card: "border-emerald-200 dark:border-emerald-900",
    bar: "bg-emerald-500",
  },
  bueno: {
    label: "Bueno",
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    card: "border-blue-200 dark:border-blue-900",
    bar: "bg-blue-500",
  },
  en_riesgo: {
    label: "En riesgo",
    dot: "bg-yellow-500",
    badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
    card: "border-yellow-200 dark:border-yellow-900",
    bar: "bg-yellow-500",
  },
  necesita_ayuda: {
    label: "Necesita ayuda",
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    card: "border-red-200 dark:border-red-900",
    bar: "bg-red-500",
  },
  critico: {
    label: "Crítico",
    dot: "bg-red-600",
    badge: "bg-red-600 text-white",
    card: "border-red-300 dark:border-red-800",
    bar: "bg-red-600",
  },
  sin_discipulos: {
    label: "Sin discípulos",
    dot: "bg-muted-foreground",
    badge: "bg-muted text-muted-foreground",
    card: "border-border",
    bar: "bg-muted-foreground/40",
  },
};

export function calcularEstado(
  progresoPromedio: number | null,
  reunionPct: number | null
): EstadoDiscipulador {
  if (progresoPromedio === null) return "sin_discipulos";
  const pct = reunionPct ?? 0;
  if (progresoPromedio < ESTADO_UMBRAL_CRITICO || pct === 0) return "critico";
  if (progresoPromedio < ESTADO_UMBRAL_RIESGO || pct < 40) return "necesita_ayuda";
  if (progresoPromedio < ESTADO_UMBRAL_BUENO || pct < 60) return "en_riesgo";
  if (progresoPromedio < ESTADO_UMBRAL_EXCELENTE || pct < 80) return "bueno";
  return "excelente";
}
