import { describe, expect, it } from "vitest";
import { isPathActive } from "./paths";

describe("isPathActive", () => {
  it("activa la ruta exacta sin trailing slash", () => {
    expect(isPathActive("/seguimiento/discipulos/", "/discipulos")).toBe(true);
  });

  it("activa la ruta exacta sin basePath y sin trailing slash", () => {
    expect(isPathActive("/discipulos", "/discipulos")).toBe(true);
  });

  it("activa rutas hijas", () => {
    expect(isPathActive("/seguimiento/discipulos/ver/", "/discipulos")).toBe(true);
  });

  it("no activa rutas no relacionadas", () => {
    expect(isPathActive("/seguimiento/dashboard/", "/discipulos")).toBe(false);
  });

  it("no activa el home para otras rutas", () => {
    expect(isPathActive("/seguimiento/login/", "/")).toBe(false);
  });
});
