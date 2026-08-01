"use client";

import dynamic from "next/dynamic";

// recharts pesa ~400KB; cada componente se carga en el cliente y bajo demanda.
export const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
export const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
export const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
export const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
export const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false });
export const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
export const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
export const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), { ssr: false });
export const Pie = dynamic(() => import("recharts").then((m) => m.Pie), { ssr: false });
export const Cell = dynamic(() => import("recharts").then((m) => m.Cell), { ssr: false });
export const Legend = dynamic(() => import("recharts").then((m) => m.Legend), { ssr: false });
export const RadarChart = dynamic(() => import("recharts").then((m) => m.RadarChart), { ssr: false });
export const Radar = dynamic(() => import("recharts").then((m) => m.Radar), { ssr: false });
export const PolarGrid = dynamic(() => import("recharts").then((m) => m.PolarGrid), { ssr: false });
export const PolarAngleAxis = dynamic(() => import("recharts").then((m) => m.PolarAngleAxis), { ssr: false });
export const PolarRadiusAxis = dynamic(() => import("recharts").then((m) => m.PolarRadiusAxis), { ssr: false });
