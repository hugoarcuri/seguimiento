-- =====================================================
-- MIGRACIÓN 032: Campo "¿Con quién vive?" en discípulos
-- =====================================================

alter table public.discipulos
  add column convive_con text;
