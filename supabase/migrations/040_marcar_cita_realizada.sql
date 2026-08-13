-- =====================================================
-- MIGRACIÓN 040: Marcar cita como realizada
-- Agrega la columna `realizada` a la tabla agenda para
-- distinguir citas programadas de encuentros realizados.
-- Backfill: las citas con fecha pasada se consideran
-- realizadas (conserva el comportamiento anterior).
-- =====================================================

alter table agenda add column if not exists realizada boolean not null default false;

update agenda
  set realizada = true
  where fecha <= current_date;
