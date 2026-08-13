-- =====================================================
-- MIGRACIÓN 041: Las citas quedan pendientes por defecto
-- Una cita solo pasa a "realizada" cuando el discipulador
-- la marca explícitamente, no al pasar la fecha.
-- Revierte el backfill de la migración 040.
-- =====================================================

update agenda
  set realizada = false;
