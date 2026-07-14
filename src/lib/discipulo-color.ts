// Deterministic color per discípulo within the site's red/warm gamut (hue 0-40)
export function getDiscipuloColor(id: string): { fg: string; bg: string } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 41; // 0-40 range (pure red to orange-red)
  return {
    fg: `oklch(0.50 0.22 ${hue})`,
    bg: `oklch(0.88 0.07 ${hue})`,
  };
}
