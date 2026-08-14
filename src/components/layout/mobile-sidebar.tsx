"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { FontControls } from "@/components/font-controls";
import { ChevronDown, Menu } from "lucide-react";
import { adminMenuItems, discipuloMenuItems, discipuladorMenuItems, isNavGroup, navHrefs, type NavGroup } from "@/lib/constants/navigation";
import { findActiveHref, BASE_PATH } from "@/lib/constants/paths";

function MobileGroup({
  group,
  activeHref,
  onNavigate,
}: {
  group: NavGroup;
  activeHref: string | null;
  onNavigate: () => void;
}) {
  const isActive = group.children.some((child) => child.href === activeHref);
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const open = userOpen ?? isActive;

  const toggle = () => setUserOpen((o) => (o === null ? !isActive : !o));

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
          isActive ? "text-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <group.icon className="h-5 w-5 shrink-0" />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-1">
          {group.children.map((child) => {
            const childActive = activeHref === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg py-2.5 pl-11 pr-3 text-sm font-medium transition-colors",
                  childActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", childActive ? "bg-current" : "bg-muted-foreground/50")} />
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useUser();

  const menuItems =
    user?.rol === "admin" ? adminMenuItems : user?.rol === "discipulador" ? discipuladorMenuItems : discipuloMenuItems;

  if (loading) return null;

  const activeHref = findActiveHref(pathname, navHrefs(menuItems));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="h-11 w-11 md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        }
      />
      <SheetContent side="left" className="w-64 p-0">
        <div className="p-6 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src={`${BASE_PATH}/logo.png`} alt="Logo" width={32} height={32} className="rounded" />
            <span className="font-semibold text-lg">Discipulado</span>
          </Link>
        </div>
        <nav className="space-y-1 p-3 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            if (isNavGroup(item)) {
              return (
                <MobileGroup
                  key={item.label}
                  group={item}
                  activeHref={activeHref}
                  onNavigate={() => setOpen(false)}
                />
              );
            }
            const isActive = activeHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t">
          <FontControls className="justify-center" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
