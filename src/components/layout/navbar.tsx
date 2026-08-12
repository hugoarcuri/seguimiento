"use client";

import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { Moon, Sun, LogOut, User, Settings, Crown, Shield, UserCog } from "lucide-react";
import Link from "next/link";
import { FontControls } from "@/components/font-controls";
import { ROL_LABELS } from "@/lib/constants/navigation";

const rolIcon = { admin: Crown, discipulador: UserCog, discipulo: Shield } as const;

export function Navbar() {
  const { user, logout } = useUser();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-1.5 px-3 lg:px-6">
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <FontControls className="hidden md:flex mr-1 border-r pr-2" />
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 md:h-9 md:w-9 lg:h-8 lg:w-8"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" className="relative h-11 w-11 rounded-full md:h-9 md:w-9 lg:h-8 lg:w-8">
                  <Avatar className="h-8 w-8">
                    {user?.avatar_url && <AvatarImage src={user.avatar_url} alt="Foto de perfil" />}
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
              {user?.rol && (
                <div className="px-2 pb-2">
                  <Badge variant="secondary" className="capitalize gap-1">
                    {(() => {
                      const Icon = rolIcon[user.rol as keyof typeof rolIcon] || Shield;
                      return <Icon className="h-3 w-3" />;
                    })()}
                    {ROL_LABELS[user.rol] || user.rol}
                  </Badge>
                </div>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/perfil" />}>
                <User className="mr-2 h-4 w-4" />
                Mi Perfil
              </DropdownMenuItem>
              {user?.rol !== "discipulador" && (
                <DropdownMenuItem render={<Link href="/configuracion" />}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </DropdownMenuItem>
              )}
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
