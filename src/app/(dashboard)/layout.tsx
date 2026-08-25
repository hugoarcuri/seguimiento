"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RolePalette } from "@/components/role-palette";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <RolePalette />
      <div className="flex h-dvh overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <div className="flex items-center gap-2 px-4 lg:px-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <MobileSidebar />
            <Navbar />
          </div>
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
