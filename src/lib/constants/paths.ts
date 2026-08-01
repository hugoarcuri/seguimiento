export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/seguimiento";

/** Dominio de producción (GitHub Pages sin dominio propio). */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hugoarcuri.github.io";

/** URL absoluta de la app (dominio + basePath). */
export const APP_URL = `${SITE_URL}${BASE_PATH}`;

/**
 * Detecta si una ruta del menú está activa.
 * El pathname de Next incluye el basePath y, con trailingSlash: true,
 * termina en "/". Normaliza ambos para comparar con item.href.
 */
export function isPathActive(pathname: string, href: string): boolean {
  const ruta = pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) : pathname;
  const limpia = ruta.replace(/\/+$/, "");
  if (limpia === href) return true;
  return limpia.startsWith(href + "/");
}
