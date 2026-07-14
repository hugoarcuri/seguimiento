"use client";

import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { Moon, Sun, LogOut, User, Settings } from "lucide-react";
import Link from "next/link";
import { useFontSize } from "@/components/font-size-provider";

export function Navbar() {
  const { user, logout } = useUser();
  const { theme, setTheme } = useTheme();
  const { scale, increase, decrease, reset } = useFontSize();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 lg:px-6">
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 mr-1 border-r pr-2">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-xs font-bold" onClick={decrease} title="Reducir texto">A−</Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-xs text-muted-foreground" onClick={reset} title="Restablecer tamaño">{Math.round(scale * 100)}%</Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-sm font-bold" onClick={increase} title="Aumentar texto">A+</Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user?.nombre?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              }
            />
            <DropdownMenuContent className="w-56" align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="text-sm font-medium">
                    {user?.nombre} {user?.apellido}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/perfil" />}>
                <User className="mr-2 h-4 w-4" />
                Mi Perfil
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/configuracion" />}>
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
