-- =====================================================
-- MIGRACIÓN 038: Datos personales del discipulador
-- Fecha de nacimiento, don espiritual, fortalezas y
-- debilidades en la tabla profiles.
-- =====================================================

alter table public.profiles
  add column if not exists fecha_nacimiento date,
  add column if not exists don_espiritual text,
  add column if not exists fortalezas text,
  add column if not exists debilidades text;
