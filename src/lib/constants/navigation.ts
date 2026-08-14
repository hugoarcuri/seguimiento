import type { LucideIcon } from "lucide-react";
import {
  Gauge,
  Users,
  UserRoundCog,
  CalendarCheck,
  Church,
  Settings,
  User,
  ClipboardCheck,
  Heart,
  BookOpen,
  FileBarChart,
  ChartColumn,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const ROL_LABELS: Record<string, string> = {
  admin: "Administrador",
  discipulador: "Discipulador",
  discipulo: "Discípulo",
};

export const adminMenuItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard Discípulos", icon: Gauge },
  { href: "/dashboard/discipuladores", label: "Dashboard Discipuladores", icon: ChartColumn },
  { href: "/discipulos", label: "Discípulos", icon: Users },
  { href: "/discipuladores", label: "Discipuladores", icon: UserRoundCog },
  { href: "/tareas", label: "Tareas", icon: ClipboardCheck },
  { href: "/seguimiento", label: "Seguimiento", icon: BookOpen },
  { href: "/evangelismo", label: "Evangelismo", icon: Heart },
  { href: "/agenda", label: "Agenda", icon: CalendarCheck },
  { href: "/oracion", label: "Oración", icon: Church },
  { href: "/reportes", label: "Reportes", icon: FileBarChart },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export const discipuloMenuItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/tareas", label: "Tareas", icon: ClipboardCheck },
  { href: "/seguimiento", label: "Seguimiento", icon: BookOpen },
  { href: "/evangelismo", label: "Evangelismo", icon: Heart },
  { href: "/oracion", label: "Oración", icon: Church },
  { href: "/perfil", label: "Mi Perfil", icon: User },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export const discipuladorMenuItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/discipulos", label: "Discípulos", icon: Users },
  { href: "/tareas", label: "Tareas", icon: ClipboardCheck },
  { href: "/seguimiento", label: "Seguimiento", icon: BookOpen },
  { href: "/evangelismo", label: "Evangelismo", icon: Heart },
  { href: "/agenda", label: "Agenda", icon: CalendarCheck },
  { href: "/oracion", label: "Oración", icon: Church },
  { href: "/perfil", label: "Mi Perfil", icon: User },
];

export function getMenuItems(rol?: string): NavItem[] {
  if (rol === "admin") return adminMenuItems;
  if (rol === "discipulador") return discipuladorMenuItems;
  return discipuloMenuItems;
}
