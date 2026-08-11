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

/**
 * Devuelve el href del item de menú activo priorizando el match más
 * específico (ej. /dashboard/discipuladores en vez de /dashboard).
 */
export function findActiveHref(pathname: string, hrefs: string[]): string | null {
  const matching = hrefs.filter((href) => isPathActive(pathname, href));
  if (matching.length === 0) return null;
  return matching.reduce((a, b) => (b.length > a.length ? b : a));
}
