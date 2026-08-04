"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { ScrollArea } from "@/components/ui/scroll-area";
import { adminMenuItems, discipuloMenuItems } from "@/lib/constants/navigation";
import { isPathActive, BASE_PATH } from "@/lib/constants/paths";

export function Sidebar() {
  const pathname = usePathname();
  const { user, loading } = useUser();

  const menuItems = user?.rol === "admin" ? adminMenuItems : discipuloMenuItems;

  if (loading) return null;

  return (
    <aside className="hidden md:flex flex-col w-16 lg:w-64 border-r bg-card">
      <div className="p-4 lg:p-6 border-b">
        <Link href="/dashboard" className="flex items-center justify-center lg:justify-start gap-2">
          <Image src={`${BASE_PATH}/logo.png`} alt="Logo" width={32} height={32} className="rounded" />
          <span className="hidden lg:block font-semibold text-lg">Discipulado</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2 lg:px-3">
          {menuItems.map((item) => {
            const isActive = isPathActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "flex items-center justify-center lg:justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
