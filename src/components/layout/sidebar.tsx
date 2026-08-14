"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { adminMenuItems, discipuloMenuItems, discipuladorMenuItems } from "@/lib/constants/navigation";
import { findActiveHref, BASE_PATH } from "@/lib/constants/paths";

const STORAGE_KEY = "sidebar-colapsado";

export function Sidebar() {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return saved === "true";
    return window.innerWidth < 1024;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  const menuItems =
    user?.rol === "admin" ? adminMenuItems : user?.rol === "discipulador" ? discipuladorMenuItems : discipuloMenuItems;

  if (loading) return null;

  const activeHref = findActiveHref(pathname, menuItems.map((i) => i.href));

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn("border-b", collapsed ? "p-4" : "p-4 lg:p-6")}>
        <Link
          href="/dashboard"
          className={cn("flex items-center gap-2.5", collapsed ? "justify-center" : "justify-start")}
        >
          <span className="relative inline-flex shrink-0">
            <Image src={`${BASE_PATH}/logo.png`} alt="Logo" width={32} height={32} className="rounded-xl" />
            <span aria-hidden className="absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-br from-primary/30 to-transparent blur-sm" />
          </span>
          <span className={cn("font-heading text-lg tracking-tight", collapsed && "hidden")}>Discipulado</span>
        </Link>
      </div>
      <div className="border-b p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Mostrar opciones" : "Ocultar opciones"}
          className={cn("w-full gap-3", collapsed ? "justify-center px-0" : "justify-start px-3")}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4 shrink-0" />
              <span className="text-sm">Ocultar opciones</span>
            </>
          )}
        </Button>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className={cn("space-y-1", collapsed ? "px-2" : "px-2 lg:px-3")}>
          {menuItems.map((item) => {
            const isActive = activeHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "group/nav flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  collapsed ? "justify-center" : "justify-start",
                  isActive
                    ? "bg-primary/10 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] font-semibold"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-transform duration-150 group-hover/nav:scale-110",
                    isActive && "text-primary"
                  )}
                />
                <span className={cn(collapsed && "hidden")}>{item.label}</span>
                {isActive && (
                  <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full bg-primary transition-opacity", collapsed ? "absolute" : "ml-auto")} />
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
