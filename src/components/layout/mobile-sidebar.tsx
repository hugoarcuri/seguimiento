"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BookOpen,
  Church,
  Calendar,
  BarChart3,
  Settings,
  User,
  ClipboardCheck,
  Menu,
} from "lucide-react";

const adminMenuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/discipulos", label: "Discípulos", icon: Users },
  { href: "/tareas", label: "Tareas", icon: ClipboardCheck },
  { href: "/encuentros", label: "Encuentros", icon: CalendarCheck },
  { href: "/materiales", label: "Materiales", icon: BookOpen },
  { href: "/oracion", label: "Oración", icon: Church },
  { href: "/calendario", label: "Calendario", icon: Calendar },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

const discipuloMenuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tareas", label: "Tareas", icon: ClipboardCheck },
  { href: "/materiales", label: "Materiales", icon: BookOpen },
  { href: "/oracion", label: "Oración", icon: Church },
  { href: "/perfil", label: "Mi Perfil", icon: User },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useUser();

  const menuItems = user?.rol === "admin" ? adminMenuItems : discipuloMenuItems;

  if (loading) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        }
      />
      <SheetContent side="left" className="w-64 p-0">
        <div className="p-6 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/seguimiento/logo.png" alt="Logo" width={32} height={32} className="rounded" />
            <span className="font-semibold text-lg">Discipulado</span>
          </Link>
        </div>
        <nav className="space-y-1 p-3">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
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
      </SheetContent>
    </Sheet>
  );
}
