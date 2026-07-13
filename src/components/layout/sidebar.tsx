"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Church,
  BookOpen,
  Settings,
  User,
  ClipboardCheck,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const adminMenuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/discipulos", label: "Discípulos", icon: Users },
  { href: "/tareas", label: "Tareas", icon: ClipboardCheck },
  { href: "/seguimiento", label: "Seguimiento", icon: BookOpen },
  { href: "/encuentros", label: "Encuentros", icon: CalendarCheck },
  { href: "/oracion", label: "Oración", icon: Church },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

const discipuloMenuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tareas", label: "Tareas", icon: ClipboardCheck },
  { href: "/seguimiento", label: "Seguimiento", icon: BookOpen },
  { href: "/oracion", label: "Oración", icon: Church },
  { href: "/perfil", label: "Mi Perfil", icon: User },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, loading } = useUser();

  const menuItems = user?.rol === "admin" ? adminMenuItems : discipuloMenuItems;

  if (loading) return null;

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r bg-card">
      <div className="p-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/seguimiento/logo.png" alt="Logo" width={32} height={32} className="rounded" />
          <span className="font-semibold text-lg">Discipulado</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
