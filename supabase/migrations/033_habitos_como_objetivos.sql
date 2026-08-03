-- =====================================================
-- MIGRACIÓN 033: Hábitos pecaminosos como objetivos marcables
-- Cada hábito se guarda como fila en seguimiento_objetivos
-- con es_habito = true, para poder marcarlos como cumplidos.
-- =====================================================

alter table seguimiento_objetivos
  add column if not exists es_habito boolean not null default false;
