export const DONES_ESPIRITUALES = [
  "Profecía",
  "Enseñanza",
  "Pastoreo",
  "Servicio",
  "Exhortación",
  "Evangelismo",
  "Fe",
  "Discernimiento",
  "Sabiduría",
  "Conocimiento",
  "Sanidad",
  "Milagros",
  "Lenguas",
  "Interpretación de lenguas",
  "Ayuda",
  "Administración",
  "Misericordia",
] as const;

export const OPCION_OTRO_DON = "Otro";

export const OPCIONES_DON_ESPIRITUAL = [...DONES_ESPIRITUALES, OPCION_OTRO_DON] as const;

export function esDonConocido(valor?: string | null): boolean {
  return !!valor && (DONES_ESPIRITUALES as readonly string[]).includes(valor);
}

