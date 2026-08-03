-- =====================================================
-- MIGRACIÓN 026: Renombrar tabla encuentros -> agenda
-- La sección "Encuentros" pasa a llamarse "Agenda".
-- Las políticas RLS y FK referencian a la tabla por objeto,
-- por lo que se adaptan automáticamente al nuevo nombre.
-- =====================================================

alter table encuentros rename to agenda;