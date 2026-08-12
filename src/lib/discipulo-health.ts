export type SaludDiscipulo =
  | "sin_seguimiento"
  | "critico"
  | "necesita_ayuda"
  | "en_riesgo"
  | "bueno"
  | "excelente";

export type AlertaTipo =
  | "sin_contacto"
  | "progreso_bajo"
  | "sin_evaluacion"
  | "bautismo_pendiente"
  | "membresia_pendiente"
  | "objetivos_pendientes"
  | "oraciones_pendientes"
  | "sin_seguimiento";

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
  estado: "activo" | "pausado" | "completado" | "retirado";
  progreso: number | null;
  diasSinContacto: number | null;
  diasUltimaEvaluacion: number | null;
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
  progresoCritico: 25,
  progresoRiesgo: 40,
  progresoBueno: 60,
  progresoExcelente: 80,
  contactoAlerta: 15,
  contactoCritico: 30,
  evaluacionDias: 60,
} as const;

export const SALUD_CONFIG: Record<
  SaludDiscipulo,
  { etiqueta: string; orden: number; dot: string; badge: string; bar: string; border: string }
> = {
  sin_seguimiento: {
    etiqueta: "Sin seguimiento",
    orden: 0,
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    bar: "bg-slate-400",
    border: "border-l-slate-400",
  },
  critico: {
    etiqueta: "Crítico",
    orden: 1,
    dot: "bg-red-600",
    badge: "bg-red-600 text-white",
    bar: "bg-red-600",
    border: "border-l-red-600",
  },
  necesita_ayuda: {
    etiqueta: "Necesita ayuda",
    orden: 2,
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    bar: "bg-red-500",
    border: "border-l-red-500",
  },
  en_riesgo: {
    etiqueta: "En riesgo",
    orden: 3,
    dot: "bg-yellow-500",
    badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
    bar: "bg-yellow-500",
    border: "border-l-yellow-500",
  },
  bueno: {
    etiqueta: "Bueno",
    orden: 4,
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    bar: "bg-blue-500",
    border: "border-l-blue-500",
  },
  excelente: {
    etiqueta: "Excelente",
    orden: 5,
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
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

export const ORDEN_SALUD: SaludDiscipulo[] = [
  "sin_seguimiento",
  "critico",
  "necesita_ayuda",
  "en_riesgo",
  "bueno",
  "excelente",
];

function subirGravedad(nivel: SaludDiscipulo): SaludDiscipulo {
  switch (nivel) {
    case "excelente":
      return "bueno";
    case "bueno":
      return "en_riesgo";
    case "en_riesgo":
      return "necesita_ayuda";
    case "necesita_ayuda":
      return "critico";
    default:
      return nivel;
  }
}

export function calcularSalud(input: InputSalud): SaludResultado {
  const alertas: AlertaDiscipulo[] = [];
  const retirado = input.estado === "retirado";

  if (retirado || input.progreso === null) {
    alertas.push({
      tipo: "sin_seguimiento",
      mensaje: retirado ? "Discípulo retirado" : "Sin seguimiento iniciado",
      severidad: "alta",
    });
    return { salud: "sin_seguimiento", alertas, accion: "iniciar_seguimiento" };
  }

  const p = input.progreso ?? 0;
  let nivel: SaludDiscipulo =
    p >= UMBRALES_SALUD.progresoExcelente
      ? "excelente"
      : p >= UMBRALES_SALUD.progresoBueno
        ? "bueno"
        : p >= UMBRALES_SALUD.progresoRiesgo
          ? "en_riesgo"
          : p >= UMBRALES_SALUD.progresoCritico
            ? "necesita_ayuda"
            : "critico";

  if (p < UMBRALES_SALUD.progresoRiesgo) {
    alertas.push({
      tipo: "progreso_bajo",
      mensaje: `Progreso: ${p}%`,
      severidad: p < UMBRALES_SALUD.progresoCritico ? "alta" : "media",
    });
  }

  const dias = input.diasSinContacto;
  if (dias === null) {
    alertas.push({ tipo: "sin_contacto", mensaje: "Sin reuniones registradas", severidad: "media" });
  } else if (dias >= UMBRALES_SALUD.contactoCritico) {
    alertas.push({ tipo: "sin_contacto", mensaje: `${dias} días sin reunión`, severidad: "alta" });
    nivel = subirGravedad(nivel);
  } else if (dias >= UMBRALES_SALUD.contactoAlerta) {
    alertas.push({ tipo: "sin_contacto", mensaje: `${dias} días sin reunión`, severidad: "media" });
    nivel = subirGravedad(nivel);
  }

  const dEval = input.diasUltimaEvaluacion;
  if (dEval === null || dEval > UMBRALES_SALUD.evaluacionDias) {
    alertas.push({
      tipo: "sin_evaluacion",
      mensaje: dEval === null ? "Sin evaluación" : `Evaluación hace ${dEval} días`,
      severidad: "media",
    });
    if (nivel === "excelente" || nivel === "bueno") nivel = "en_riesgo";
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

  if (input.estado === "pausado" && (nivel === "excelente" || nivel === "bueno")) nivel = "en_riesgo";

  const accion: AccionSugerida = alertas.some((a) => a.tipo === "sin_contacto" && a.severidad === "alta")
    ? "agendar_encuentro"
    : alertas.some((a) => a.tipo === "sin_evaluacion")
      ? "evaluar"
      : alertas.some((a) => a.tipo === "progreso_bajo")
        ? "revisar_objetivos"
        : alertas.some((a) => a.tipo === "bautismo_pendiente")
          ? "pastorear_bautismo"
          : alertas.some((a) => a.tipo === "membresia_pendiente")
            ? "pastorear_membresia"
            : "celebrar";

  return { salud: nivel, alertas, accion };
}
