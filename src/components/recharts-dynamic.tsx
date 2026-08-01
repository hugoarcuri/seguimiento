"use client";

import dynamic from "next/dynamic";

// recharts pesa ~400KB; cada componente se carga en el cliente y bajo demanda.
const opts = { ssr: false };

export const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), opts);
export const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), opts);
export const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), opts);
export const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), opts);
export const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), opts);
export const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), opts);
export const Bar = dynamic(() => import("recharts").then((m) => m.Bar), opts);
export const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), opts);
export const Pie = dynamic(() => import("recharts").then((m) => m.Pie), opts);
export const Cell = dynamic(() => import("recharts").then((m) => m.Cell), opts);
export const Legend = dynamic(() => import("recharts").then((m) => m.Legend), opts);
export const RadarChart = dynamic(() => import("recharts").then((m) => m.RadarChart), opts);
export const Radar = dynamic(() => import("recharts").then((m) => m.Radar), opts);
export const PolarGrid = dynamic(() => import("recharts").then((m) => m.PolarGrid), opts);
export const PolarAngleAxis = dynamic(() => import("recharts").then((m) => m.PolarAngleAxis), opts);
export const PolarRadiusAxis = dynamic(() => import("recharts").then((m) => m.PolarRadiusAxis), opts);
