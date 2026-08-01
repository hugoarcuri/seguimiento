import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cn, calcularEdad, estadoColors, generarAvatarUrl } from "./utils";

describe("cn", () => {
  it("combina clases y resuelve conflictos de tailwind-merge", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", undefined)).toBe("text-sm");
    expect(cn("", "flex", false, null)).toBe("flex");
  });
});

describe("estadoColors", () => {
  it("define un color para cada estado de discípulo", () => {
    expect(estadoColors).toMatchObject({
      activo: "bg-green-500",
      pausado: "bg-yellow-500",
      completado: "bg-blue-500",
      retirado: "bg-red-500",
    });
  });
});

describe("calcularEdad", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2000, 7, 1));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calcula la edad el día del cumpleaños", () => {
    expect(calcularEdad("1980-08-01")).toBe(20);
  });

  it("resta un año si el cumpleaños aún no llegó", () => {
    expect(calcularEdad("1980-08-02")).toBe(19);
  });

  it("resta un año cuando el mes ya pasó", () => {
    expect(calcularEdad("1981-07-15")).toBe(19);
  });
});

describe("generarAvatarUrl", () => {
  it("genera una URL de dicebear con el nombre como seed", () => {
    expect(generarAvatarUrl("Juan", "Pérez")).toBe(
      "https://api.dicebear.com/9.x/initials/svg?seed=Juan%20P%C3%A9rez"
    );
  });

  it("no deja espacios extra cuando falta el apellido", () => {
    expect(generarAvatarUrl("  María  ", "")).toBe(
      "https://api.dicebear.com/9.x/initials/svg?seed=Mar%C3%ADa"
    );
  });
});
