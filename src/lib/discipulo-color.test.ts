import { describe, expect, it } from "vitest";
import { getDiscipuloColor } from "./discipulo-color";

describe("getDiscipuloColor", () => {
  it("es determinista: mismo id, mismos colores", () => {
    const a = getDiscipuloColor("abc-123");
    const b = getDiscipuloColor("abc-123");
    expect(a).toEqual(b);
  });

  it("mantiene el matiz dentro de la gama rojo/cálido (0-40)", () => {
    const ids = ["uno", "dos", "tres", "cuatro", "cinco", "sien-siemens-magnet-12121"];
    for (const id of ids) {
      const { fg, bg } = getDiscipuloColor(id);
      const hue = Number(fg.match(/oklch\(0\.50 0\.22 (\d+)\)/)?.[1]);
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThanOrEqual(40);
      expect(bg).toMatch(/^oklch\(0\.88 0\.07 \d+\)$/);
    }
  });

  it("devuelve colores distintos para ids distintos", () => {
    expect(getDiscipuloColor("a")).not.toEqual(getDiscipuloColor("b"));
  });
});
