-- =====================================================
-- MIGRACIÓN 025: Eliminar módulo Seguimiento
-- Se remueve por completo la sección Seguimiento de la app
-- y sus tablas de datos (catálogo de áreas/indicadores,
-- reuniones, evaluaciones, desafíos, personas de oración...).
-- =====================================================

-- 1. Dropear tablas del módulo (hijas antes que padres)
drop table if exists alertas cascade;
drop table if exists observaciones_pastorales cascade;
drop table if exists desafios cascade;
drop table if exists evaluaciones cascade;
drop table if exists reuniones cascade;
drop table if exists indicador_nivel cascade;
drop table if exists indicadores cascade;
drop table if exists areas cascade;
drop table if exists personas_oracion cascade;

-- 2. Quitar columnas del seguimiento agregadas a discipulos
alter table discipulos drop column if exists meta_actual;
alter table discipulos drop column if exists meta_actual_desde;