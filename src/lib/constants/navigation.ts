import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Church,
  BookOpen,
  Settings,
  User,
  ClipboardCheck,
  Heart,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const adminMenuItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/discipulos", label: "Discípulos", icon: Users },
  { href: "/tareas", label: "Tareas", icon: ClipboardCheck },
  { href: "/seguimiento", label: "Seguimiento", icon: BookOpen },
  { href: "/evangelismo", label: "Evangelismo", icon: Heart },
  { href: "/encuentros", label: "Encuentros", icon: CalendarCheck },
  { href: "/oracion", label: "Oración", icon: Church },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export const discipuloMenuItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tareas", label: "Tareas", icon: ClipboardCheck },
  { href: "/seguimiento", label: "Seguimiento", icon: BookOpen },
  { href: "/evangelismo", label: "Evangelismo", icon: Heart },
  { href: "/oracion", label: "Oración", icon: Church },
  { href: "/perfil", label: "Mi Perfil", icon: User },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];
