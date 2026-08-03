-- =====================================================
-- MIGRACIÓN 024: Seguimiento por grandes áreas
-- Reemplaza el catálogo detallado (7 áreas / 29 indicadores)
-- por 5 áreas con UNA sola evaluación cada una, usando la
-- misma escala de 3 niveles (0 = En desafío / 1 = Estable /
-- 2 = Creciendo).
-- El catálogo anterior se DESACTIVA (activo = false) sin
-- borrarlo, preservando el historial de evaluaciones.
-- =====================================================

-- 1. Desactivar catálogo viejo (no se borra, se preserva el historial)
update indicadores set activo = false where id <= 29;
update areas set activo = false where id <= 7;

-- 2. NUEVAS ÁREAS (5)
insert into areas (id, nombre, descripcion, icono, orden) values
  (8,  'Vida emocional',  'Bienestar emocional y estado de ánimo', 'Heart', 1),
  (9,  'Vida familiar',   'Relaciones y ambiente en el hogar', 'Home', 2),
  (10, 'Estudios',        'Rendimiento y responsabilidad académica', 'GraduationCap', 3),
  (11, 'Trabajo',         'Desempeño y responsabilidad laboral', 'Briefcase', 4),
  (12, 'Vida espiritual', 'Comunión, crecimiento y servicio', 'Sparkles', 5);

-- 3. NUEVOS INDICADORES (UNA evaluación por área)
insert into indicadores (id, area_id, nombre, descripcion, orden, condicion) values
  (30, 8,  'Vida emocional',  '¿Cómo evoluciona tu vida emocional esta semana?', 1, null),
  (31, 9,  'Vida familiar',   '¿Cómo evolucionan tus relaciones familiares?', 1, null),
  (32, 10, 'Estudios',        '¿Cómo evolucionan tus estudios?', 1, 'estudios'),
  (33, 11, 'Trabajo',         '¿Cómo evoluciona tu trabajo?', 1, 'trabajo'),
  (34, 12, 'Vida espiritual', '¿Cómo evoluciona tu vida espiritual?', 1, null);

-- 4. Resetear secuencias de id
select setval(pg_get_serial_sequence('areas', 'id'), (select coalesce(max(id), 1) from areas));
select setval(pg_get_serial_sequence('indicadores', 'id'), (select coalesce(max(id), 1) from indicadores));