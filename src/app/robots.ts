import type { MetadataRoute } from "next";
import { APP_URL, BASE_PATH } from "@/lib/constants/paths";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [BASE_PATH + "/discipulos/ver", BASE_PATH + "/discipulos/editar"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
