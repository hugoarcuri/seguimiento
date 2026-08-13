import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { PaletteProvider } from "@/components/palette-provider";
import { FontSizeProvider } from "@/components/font-size-provider";
import { Toaster } from "@/components/ui/sonner";
import { APP_URL, BASE_PATH } from "@/lib/constants/paths";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Discipulado CRM",
    template: "%s | Discipulado CRM",
  },
  description: "Sistema de gestión de discipulado y acompañamiento espiritual para iglesias.",
  icons: {
    icon: `${BASE_PATH}/logo.png`,
    shortcut: `${BASE_PATH}/logo.png`,
    apple: `${BASE_PATH}/logo.png`,
  },
  openGraph: {
    title: "Discipulado CRM",
    description: "Sistema de gestión de discipulado y acompañamiento espiritual para iglesias.",
    url: APP_URL,
    siteName: "Discipulado CRM",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <FontSizeProvider>
          <ThemeProvider>
            <PaletteProvider>
              {children}
              <Toaster />
            </PaletteProvider>
          </ThemeProvider>
        </FontSizeProvider>
      </body>
    </html>
  );
}
