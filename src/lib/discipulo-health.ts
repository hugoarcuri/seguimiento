export type SaludDiscipulo = "critico" | "en_proceso" | "al_dia";

export type AlertaTipo =
  | "sin_contacto"
  | "sin_evaluacion"
  | "bautismo_pendiente"
  | "membresia_pendiente"
  | "objetivos_pendientes"
  | "oraciones_pendientes";

export type AccionSugerida =
  | "agendar_encuentro"
  | "evaluar"
  | "revisar_objetivos"
  | "pastorear_bautismo"
  | "pastorear_membresia"
  | "iniciar_seguimiento"
  | "celebrar";

export interface AlertaDiscipulo {
  tipo: AlertaTipo;
  mensaje: string;
  severidad: "alta" | "media" | "baja";
}

export interface InputSalud {
  encuentrosMes: number;
  etapa: number;
  bautizado: boolean;
  es_miembro: boolean;
  objetivosPendientes: number;
  oracionesPendientes: number;
}

export interface SaludResultado {
  salud: SaludDiscipulo;
  alertas: AlertaDiscipulo[];
  accion: AccionSugerida;
}

export const UMBRALES_SALUD = {
  contactoAlerta: 15,
  contactoCritico: 30,
} as const;

export const SALUD_CONFIG: Record<
  SaludDiscipulo,
  { etiqueta: string; orden: number; dot: string; badge: string; bar: string; border: string }
> = {
  critico: {
    etiqueta: "Crítico",
    orden: 0,
    dot: "bg-red-600",
    badge: "bg-red-600 text-white",
    bar: "bg-red-600",
    border: "border-l-red-600",
  },
  en_proceso: {
    etiqueta: "En proceso",
    orden: 1,
    dot: "bg-yellow-500",
    badge: "bg-yellow-500 text-white",
    bar: "bg-yellow-500",
    border: "border-l-yellow-500",
  },
  al_dia: {
    etiqueta: "Al día",
    orden: 2,
    dot: "bg-emerald-500",
    badge: "bg-emerald-500 text-white",
    bar: "bg-emerald-500",
    border: "border-l-emerald-500",
  },
};

export const ACCION_LABEL: Record<AccionSugerida, string> = {
  agendar_encuentro: "Agendar encuentro",
  evaluar: "Evaluar",
  revisar_objetivos: "Revisar objetivos",
  pastorear_bautismo: "Pastorear bautismo",
  pastorear_membresia: "Pastorear membresía",
  iniciar_seguimiento: "Iniciar seguimiento",
  celebrar: "Ver detalle",
};

export const ORDEN_SALUD: SaludDiscipulo[] = ["critico", "en_proceso", "al_dia"];

export function estadoEncuentrosMes(encuentrosMes: number): SaludDiscipulo {
  return encuentrosMes >= 2 ? "al_dia" : encuentrosMes === 1 ? "en_proceso" : "critico";
}

export function contarEncuentrosMes(items: { fecha: string; realizada?: boolean }[]): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const hoyISO = hoy.toISOString().slice(0, 10);
  const inicioMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;
  return items.filter((it) => {
    if (it.realizada !== true) return false;
    const fecha = it.fecha.length === 10 ? it.fecha : it.fecha.split("T")[0];
    return fecha >= inicioMes && fecha <= hoyISO;
  }).length;
}

export function citaEsRealizadaAutomatica(fecha: string): boolean {
  const hoy = new Date().toISOString().slice(0, 10);
  const f = fecha.length === 10 ? fecha : fecha.split("T")[0];
  return f <= hoy;
}

export function calcularSalud(input: InputSalud): SaludResultado {
  const alertas: AlertaDiscipulo[] = [];
  const salud = estadoEncuentrosMes(input.encuentrosMes);

  if (input.encuentrosMes === 0) {
    alertas.push({
      tipo: "sin_contacto",
      mensaje: "Sin encuentros este mes",
      severidad: "alta",
    });
  }

  if (input.etapa >= 2 && !input.bautizado) {
    alertas.push({ tipo: "bautismo_pendiente", mensaje: "Bautismo pendiente", severidad: "media" });
  }
  if (input.etapa >= 2 && !input.es_miembro) {
    alertas.push({ tipo: "membresia_pendiente", mensaje: "Membresía pendiente", severidad: "media" });
  }
  if (input.objetivosPendientes > 0) {
    alertas.push({
      tipo: "objetivos_pendientes",
      mensaje: `${input.objetivosPendientes} objetivo(s) pendiente(s)`,
      severidad: "baja",
    });
  }
  if (input.oracionesPendientes > 0) {
    alertas.push({
      tipo: "oraciones_pendientes",
      mensaje: `${input.oracionesPendientes} pedido(s) de oración`,
      severidad: "baja",
    });
  }

  const accion: AccionSugerida = alertas.some((a) => a.tipo === "sin_contacto")
    ? "agendar_encuentro"
    : alertas.some((a) => a.tipo === "objetivos_pendientes")
      ? "revisar_objetivos"
      : alertas.some((a) => a.tipo === "bautismo_pendiente")
        ? "pastorear_bautismo"
        : alertas.some((a) => a.tipo === "membresia_pendiente")
          ? "pastorear_membresia"
          : "celebrar";

  return { salud, alertas, accion };
}
