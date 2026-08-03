-- =====================================================
-- MIGRACIÓN 034: Bautismo y membresía en discípulos
-- Desde la etapa 2 se alerta si falta la clase de membresía
-- o el bautismo; se ignora si es miembro o está bautizado.
-- =====================================================

alter table discipulos
  add column if not exists bautizado boolean not null default false,
  add column if not exists es_miembro boolean not null default false;
