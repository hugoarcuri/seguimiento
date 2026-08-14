import type { SVGProps } from "react";
import {
  OracionIcon,
  EvangelismoIcon,
  SeguimientoIcon,
  AgendaIcon,
  ConfiguracionIcon,
  DashboardIcon,
  ReportesIcon,
  TareasIcon,
  PerfilIcon,
  ListaIcon,
  DiscipulosIcon,
  DiscipuladoresIcon,
} from "@/components/twemoji-icons";

export type NavIcon = (props: SVGProps<SVGSVGElement>) => React.JSX.Element;

export interface NavLink {
  href: string;
  label: string;
  icon: NavIcon;
}

export interface NavChild {
  href: string;
  label: string;
  icon: NavIcon;
}

export interface NavGroup {
  label: string;
  icon: NavIcon;
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
    icon: DiscipulosIcon,
    children: [
      { href: "/dashboard", label: "Dashboard Discípulos", icon: DashboardIcon },
      { href: "/discipulos", label: "Lista Discípulos", icon: ListaIcon },
    ],
  },
  {
    label: "Discipuladores",
    icon: DiscipuladoresIcon,
    children: [
      { href: "/dashboard/discipuladores", label: "Dashboard Discipuladores", icon: DashboardIcon },
      { href: "/discipuladores", label: "Lista Discipuladores", icon: ListaIcon },
    ],
  },
  { href: "/tareas", label: "Tareas", icon: TareasIcon },
  { href: "/seguimiento", label: "Seguimiento", icon: SeguimientoIcon },
  { href: "/evangelismo", label: "Evangelismo", icon: EvangelismoIcon },
  { href: "/agenda", label: "Agenda", icon: AgendaIcon },
  { href: "/oracion", label: "Oración", icon: OracionIcon },
  { href: "/reportes", label: "Reportes", icon: ReportesIcon },
  { href: "/configuracion", label: "Configuración", icon: ConfiguracionIcon },
];

export const discipuloMenuItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/tareas", label: "Tareas", icon: TareasIcon },
  { href: "/seguimiento", label: "Seguimiento", icon: SeguimientoIcon },
  { href: "/evangelismo", label: "Evangelismo", icon: EvangelismoIcon },
  { href: "/oracion", label: "Oración", icon: OracionIcon },
  { href: "/perfil", label: "Mi Perfil", icon: PerfilIcon },
  { href: "/configuracion", label: "Configuración", icon: ConfiguracionIcon },
];

export const discipuladorMenuItems: NavItem[] = [
  {
    label: "Discípulos",
    icon: DiscipulosIcon,
    children: [
      { href: "/dashboard", label: "Dashboard Discípulos", icon: DashboardIcon },
      { href: "/discipulos", label: "Lista Discípulos", icon: ListaIcon },
    ],
  },
  { href: "/tareas", label: "Tareas", icon: TareasIcon },
  { href: "/seguimiento", label: "Seguimiento", icon: SeguimientoIcon },
  { href: "/evangelismo", label: "Evangelismo", icon: EvangelismoIcon },
  { href: "/agenda", label: "Agenda", icon: AgendaIcon },
  { href: "/oracion", label: "Oración", icon: OracionIcon },
  { href: "/perfil", label: "Mi Perfil", icon: PerfilIcon },
];

export function getMenuItems(rol?: string): NavItem[] {
  if (rol === "admin") return adminMenuItems;
  if (rol === "discipulador") return discipuladorMenuItems;
  return discipuloMenuItems;
}
