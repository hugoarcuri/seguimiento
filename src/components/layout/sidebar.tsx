"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, PanelLeft, PanelLeftClose } from "lucide-react";
import { adminMenuItems, discipuloMenuItems, discipuladorMenuItems, isNavGroup, navHrefs, type NavGroup } from "@/lib/constants/navigation";
import { findActiveHref, BASE_PATH } from "@/lib/constants/paths";

const STORAGE_KEY = "sidebar-colapsado";

function SidebarGroup({
  group,
  collapsed,
  activeHref,
}: {
  group: NavGroup;
  collapsed: boolean;
  activeHref: string | null;
}) {
  const isActive = group.children.some((child) => child.href === activeHref);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        openOnHover
        closeDelay={100}
        render={
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              collapsed ? "justify-center px-0" : "justify-start",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <group.icon className="h-6 w-6 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDown
                  className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
                />
              </>
            )}
          </button>
        }
      />
      <PopoverContent side="right" sideOffset={12} className="w-52 gap-1 p-1">
        {group.children.map((child) => {
          const childActive = activeHref === child.href;
          return (
            <Link
              key={child.href}
              href={child.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                childActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <child.icon className="h-5 w-5 shrink-0" />
              {child.label}
            </Link>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

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

  const activeHref = findActiveHref(pathname, navHrefs(menuItems));

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r bg-card transition-[width] duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn("border-b", collapsed ? "p-4" : "p-4 lg:p-6")}>
        <Link
          href="/dashboard"
          className={cn("flex items-center gap-2", collapsed ? "justify-center" : "justify-start")}
        >
          <Image src={`${BASE_PATH}/logo.png`} alt="Logo" width={32} height={32} className="rounded" />
          <span className={cn("font-semibold text-lg", collapsed && "hidden")}>Discipulado</span>
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
            if (isNavGroup(item)) {
              return (
                <SidebarGroup
                  key={item.label}
                  group={item}
                  collapsed={collapsed}
                  activeHref={activeHref}
                />
              );
            }
            const isActive = activeHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  collapsed ? "justify-center" : "justify-start",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-6 w-6 shrink-0" />
                <span className={cn(collapsed && "hidden")}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
