-- =====================================================
-- MIGRACIÓN 029: Rediseña la Evaluación del seguimiento
-- Reemplaza las 8 áreas con escala 0-2 por campos cualitativos
-- (relación con Dios, hábitos, don, servicio, autoridad, estudios, trabajo, convivencia).
-- =====================================================

alter table seguimiento_evaluaciones
  drop column if exists vida_devocional,
  drop column if exists oracion,
  drop column if exists lectura_biblica,
  drop column if exists comunion,
  drop column if exists caracter,
  drop column if exists servicio,
  drop column if exists evangelismo,
  drop column if exists discipulado,
  add column if not exists relacion_dios text,
  add column if not exists habitos_pecaminosos text,
  add column if not exists don_espiritual text,
  add column if not exists ministerio text,
  add column if not exists relacion_autoridad text,
  add column if not exists estudia text,
  add column if not exists trabaja text,
  add column if not exists convive_con text;