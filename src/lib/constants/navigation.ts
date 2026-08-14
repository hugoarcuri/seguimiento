import type { LucideIcon } from "lucide-react";
import {
  Gauge,
  Users,
  UserRoundCog,
  CalendarCheck,
  MessagesSquare,
  Settings,
  User,
  ClipboardCheck,
  Flame,
  Map,
  FileBarChart,
  LayoutDashboard,
  List,
} from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavChild {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  icon: LucideIcon;
  children: NavChild[];
}

export type NavItem = NavLink | NavGroup;

export function isNavGroup(item: NavItem): item is NavGroup {
  return "children" in item;
}

export function navHrefs(items: NavItem[]): string[] {
  const hrefs: string[] = [];
  items.forEach((item) => {
    if (isNavGroup(item)) {
      item.children.forEach((child) => hrefs.push(child.href));
    } else {
      hrefs.push(item.href);
    }
  });
  return hrefs;
}

export const ROL_LABELS: Record<string, string> = {
  admin: "Administrador",
  discipulador: "Discipulador",
  discipulo: "Discípulo",
};

export const adminMenuItems: NavItem[] = [
  {
    label: "Discípulos",
    icon: Users,
    children: [
      { href: "/dashboard", label: "Dashboard Discípulos", icon: LayoutDashboard },
      { href: "/discipulos", label: "Lista Discípulos", icon: List },
    ],
  },
  {
    label: "Discipuladores",
    icon: UserRoundCog,
    children: [
      { href: "/dashboard/discipuladores", label: "Dashboard Discipuladores", icon: LayoutDashboard },
      { href: "/discipuladores", label: "Lista Discipuladores", icon: List },
    ],
  },
  { href: "/tareas", label: "Tareas", icon: ClipboardCheck },
  { href: "/seguimiento", label: "Seguimiento", icon: Map },
  { href: "/evangelismo", label: "Evangelismo", icon: Flame },
  { href: "/agenda", label: "Agenda", icon: CalendarCheck },
  { href: "/oracion", label: "Oración", icon: MessagesSquare },
  { href: "/reportes", label: "Reportes", icon: FileBarChart },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export const discipuloMenuItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/tareas", label: "Tareas", icon: ClipboardCheck },
  { href: "/seguimiento", label: "Seguimiento", icon: Map },
  { href: "/evangelismo", label: "Evangelismo", icon: Flame },
  { href: "/oracion", label: "Oración", icon: MessagesSquare },
  { href: "/perfil", label: "Mi Perfil", icon: User },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export const discipuladorMenuItems: NavItem[] = [
  {
    label: "Discípulos",
    icon: Users,
    children: [
      { href: "/dashboard", label: "Dashboard Discípulos", icon: LayoutDashboard },
      { href: "/discipulos", label: "Lista Discípulos", icon: List },
    ],
  },
  { href: "/tareas", label: "Tareas", icon: ClipboardCheck },
  { href: "/seguimiento", label: "Seguimiento", icon: Map },
  { href: "/evangelismo", label: "Evangelismo", icon: Flame },
  { href: "/agenda", label: "Agenda", icon: CalendarCheck },
  { href: "/oracion", label: "Oración", icon: MessagesSquare },
  { href: "/perfil", label: "Mi Perfil", icon: User },
];

export function getMenuItems(rol?: string): NavItem[] {
  if (rol === "admin") return adminMenuItems;
  if (rol === "discipulador") return discipuladorMenuItems;
  return discipuloMenuItems;
}
