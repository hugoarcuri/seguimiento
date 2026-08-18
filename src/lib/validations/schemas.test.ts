import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth";
import { miembroSchema } from "./discipulo";
import { agendaSchema } from "./agenda";
import { oracionSchema } from "./oracion";
describe("auth", () => {
  it("acepta credenciales válidas", () => {
    expect(loginSchema.parse({ email: "a@b.com", password: "123456" })).toBeTruthy();
  });

  it("rechaza un email inválido", () => {
    const res = loginSchema.safeParse({ email: "no-email", password: "123456" });
    expect(res.success).toBe(false);
  });

  it("rechaza una contraseña corta", () => {
    const res = loginSchema.safeParse({ email: "a@b.com", password: "123" });
    expect(res.success).toBe(false);
  });

  it("registro valida que las contraseñas coincidan", () => {
    const base = { email: "a@b.com", password: "123456", confirmPassword: "654321", nombre: "Ana", apellido: "López" };
    expect(registerSchema.safeParse(base).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, confirmPassword: "123456" }).success).toBe(true);
  });
});

describe("miembroSchema", () => {
  it("requiere nombre, apellido, etapa y estado", () => {
    const res = miembroSchema.safeParse({});
    expect(res.success).toBe(false);
  });

  it("acepta un miembro completo", () => {
    const res = miembroSchema.safeParse({
      nombre: "Juan",
      apellido: "Pérez",
      etapa_id: 1,
      estado: "activo",
    });
    expect(res.success).toBe(true);
  });

  it("acepta email vacío como sin email", () => {
    const res = miembroSchema.safeParse({
      nombre: "Juan",
      apellido: "Pérez",
      etapa_id: 2,
      estado: "pausado",
      email: "",
    });
    expect(res.success).toBe(true);
  });

  it("rechaza un email mal formado", () => {
    const res = miembroSchema.safeParse({
      nombre: "Juan",
      apellido: "Pérez",
      etapa_id: 2,
      estado: "pausado",
      email: "malo",
    });
    expect(res.success).toBe(false);
  });

  it("rechaza estados fuera del enum", () => {
    const res = miembroSchema.safeParse({
      nombre: "Juan",
      apellido: "Pérez",
      etapa_id: 2,
      estado: "fantasma",
    });
    expect(res.success).toBe(false);
  });
});

describe("agendaSchema", () => {
  it("requiere fecha y tema", () => {
    const base = { miembro_id: "00000000-0000-0000-0000-000000000000" };
    expect(agendaSchema.safeParse({ ...base, fecha: "", tema_tratado: "X" }).success).toBe(false);
    expect(agendaSchema.safeParse({ ...base, fecha: "2026-08-01", tema_tratado: "X" }).success).toBe(true);
  });
});

describe("oracionSchema", () => {
  it("define estado por defecto pendiente", () => {
    const parsed = oracionSchema.parse({ miembro_id: "00000000-0000-0000-0000-000000000000", pedido: "Salud" });
    expect(parsed.estado).toBe("pendiente");
  });

  it("rechaza un pedido vacío", () => {
    const res = oracionSchema.safeParse({ miembro_id: "00000000-0000-0000-0000-000000000000", pedido: "" });
    expect(res.success).toBe(false);
  });
});
