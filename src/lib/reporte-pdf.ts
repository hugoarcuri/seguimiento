import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export interface DiscipuloReporte {
  id: string;
  nombre: string;
  apellido: string;
  etapa: string;
  estado: string;
  salud: string;
  progreso: number | null;
  encuentrosPeriodo: number;
  ultimaReunion: string | null;
  diasSinContacto: number | null;
  tareasPendientes: number;
  bautizado: boolean;
  esMiembro: boolean;
}

export interface EncuentroReporte {
  id: string;
  discipulo: string;
  fecha: string;
  tema: string | null;
  realizada: boolean;
}

export interface TareaReporte {
  id: string;
  discipulo: string;
  titulo: string;
  tipo: string;
  estado: string;
  fechaLimite: string | null;
}

export interface ObjetivoReporte {
  discipulo: string;
  descripcion: string;
  completado: boolean;
}

export interface PersonaEvangelismoReporte {
  id: string;
  nombre: string;
  apellido: string;
  estado: string;
  fechaCreacion: string;
  eventoDescripcion: string | null;
}

export interface ReporteData {
  discipulador: {
    nombre: string;
    apellido: string;
    email: string;
  } | null;
  periodoLabel: string;
  desde: string;
  hasta: string;
  kpis: {
    discipulosTotal: number;
    discipulosActivos: number;
    encuentrosPeriodo: number;
    progresoPromedio: number | null;
    tareasPendientes: number;
    tareasCompletadasPeriodo: number;
    objetivosCompletados: number;
    objetivosPendientes: number;
    personasEvangelismo: number;
  };
  discipulos: DiscipuloReporte[];
  encuentros: EncuentroReporte[];
  tareas: TareaReporte[];
  objetivos: ObjetivoReporte[];
  evangelismo: PersonaEvangelismoReporte[];
}

const COLOR_PRIMARIO: [number, number, number] = [30, 58, 138];
const COLOR_CLARO: [number, number, number] = [239, 246, 255];
const COLOR_TEXTO: [number, number, number] = [51, 65, 85];

const fFecha = (f: string | null | undefined): string =>
  f ? format(new Date(f + "T00:00:00"), "dd/MM/yyyy", { locale: es }) : "—";

export function generarReportePDF(data: ReporteData): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Header
  doc.setFillColor(...COLOR_PRIMARIO);
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Reporte de Discipulador", margin, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(data.discipulador ? `${data.discipulador.nombre} ${data.discipulador.apellido}` : "Sin discipulador", margin, 22);
  doc.setFontSize(9);
  doc.text(`Período: ${data.periodoLabel} · ${fFecha(data.desde)} al ${fFecha(data.hasta)}`, margin, 27);
  doc.setTextColor(...COLOR_TEXTO);

  let y = 38;

  const agregarTitulo = (texto: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...COLOR_PRIMARIO);
    doc.text(texto.toUpperCase(), margin, y);
    y += 6;
  };

  const tabla = (head: string[], body: (string | number)[][]) => {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "grid",
      styles: { fontSize: 8.5, cellPadding: 2, textColor: COLOR_TEXTO },
      headStyles: { fillColor: COLOR_PRIMARIO, textColor: 255, fontStyle: "bold" },
      bodyStyles: { lineColor: [226, 232, 240], lineWidth: 0.1 },
      alternateRowStyles: { fillColor: COLOR_CLARO },
      head: [head],
      body,
    });
    const last = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable;
    y = (last?.finalY ?? y) + 8;
  };

  // KPIs
  tabla(
    ["Métrica", "Valor"],
    [
      ["Discípulos (total / activos)", `${data.kpis.discipulosTotal} / ${data.kpis.discipulosActivos}`],
      ["Encuentros en el período", `${data.kpis.encuentrosPeriodo}`],
      ["Progreso promedio de seguimiento", data.kpis.progresoPromedio !== null ? `${data.kpis.progresoPromedio}%` : "—"],
      ["Tareas pendientes", `${data.kpis.tareasPendientes}`],
      ["Tareas completadas en el período", `${data.kpis.tareasCompletadasPeriodo}`],
      ["Objetivos completados / pendientes", `${data.kpis.objetivosCompletados} / ${data.kpis.objetivosPendientes}`],
      ["Personas de evangelismo vinculadas", `${data.kpis.personasEvangelismo}`],
    ]
  );

  // Discípulos
  agregarTitulo("Discípulos");
  tabla(
    ["Nombre", "Etapa", "Estado", "Salud", "Progreso", "Encuentros", "Última reunión", "Tareas pend."],
    data.discipulos.map((d) => [
      `${d.apellido}, ${d.nombre}`,
      d.etapa,
      d.estado,
      d.salud,
      d.progreso !== null ? `${d.progreso}%` : "—",
      `${d.encuentrosPeriodo}`,
      d.ultimaReunion ? fFecha(d.ultimaReunion) : "—",
      `${d.tareasPendientes}`,
    ])
  );

  // Encuentros
  agregarTitulo("Encuentros del período");
  tabla(
    ["Fecha", "Discípulo", "Tema", "Realizado"],
    data.encuentros.length > 0
      ? data.encuentros.map((e) => [fFecha(e.fecha), e.discipulo, e.tema || "—", e.realizada ? "Sí" : "No"])
      : [["—", "No hay encuentros en el período", "", ""]]
  );

  // Tareas
  agregarTitulo("Tareas");
  tabla(
    ["Título", "Discípulo", "Tipo", "Estado", "Fecha límite"],
    data.tareas.length > 0
      ? data.tareas.map((t) => [t.titulo, t.discipulo, t.tipo, t.estado, fFecha(t.fechaLimite)])
      : [["—", "No hay tareas", "", "", ""]]
  );

  // Objetivos
  agregarTitulo("Objetivos de seguimiento");
  tabla(
    ["Discípulo", "Objetivo", "Estado"],
    data.objetivos.length > 0
      ? data.objetivos.map((o) => [o.discipulo, o.descripcion, o.completado ? "Completado" : "Pendiente"])
      : [["—", "No hay objetivos de seguimiento", ""]]
  );

  // Evangelismo
  agregarTitulo("Evangelismo");
  tabla(
    ["Persona", "Estado", "Agregado", "Último evento"],
    data.evangelismo.length > 0
      ? data.evangelismo.map((p) => [
          `${p.apellido}, ${p.nombre}`,
          p.estado,
          fFecha(p.fechaCreacion),
          p.eventoDescripcion || "—",
        ])
      : [["—", "No hay personas de evangelismo vinculadas", "", ""]]
  );

  // Footer con paginación
  const totalPaginas = doc.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`${i} / ${totalPaginas}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 8, { align: "right" });
    doc.text(`Generado el ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`, margin, doc.internal.pageSize.getHeight() - 8);
  }

  const apellido = data.discipulador?.apellido?.toLowerCase().replace(/\s+/g, "") || "discipulador";
  const nombre = data.discipulador?.nombre?.toLowerCase().replace(/\s+/g, "") || "";
  doc.save(`reporte-${apellido}-${nombre}.pdf`);
}
