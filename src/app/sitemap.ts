import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/constants/paths";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const rutas = [
    "/",
    "/login",
    "/register",
    "/dashboard",
    "/discipulos",
    "/discipulos/nuevo",
    "/evangelismo",
    "/tareas",
    "/seguimiento",
    "/oracion",
    "/agenda",
    "/perfil",
    "/configuracion",
  ];

  return rutas.map((ruta) => ({
    url: `${APP_URL}${ruta === "/" ? "" : ruta}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: ruta === "/" ? 1 : 0.8,
  }));
}
