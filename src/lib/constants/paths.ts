export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/seguimiento";

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
