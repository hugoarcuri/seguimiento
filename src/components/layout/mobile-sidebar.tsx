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
import { Menu } from "lucide-react";
import { adminMenuItems, discipuloMenuItems, discipuladorMenuItems } from "@/lib/constants/navigation";
import { findActiveHref, BASE_PATH } from "@/lib/constants/paths";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useUser();

  const menuItems =
    user?.rol === "admin" ? adminMenuItems : user?.rol === "discipulador" ? discipuladorMenuItems : discipuloMenuItems;

  if (loading) return null;

  const activeHref = findActiveHref(pathname, menuItems.map((i) => i.href));

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
