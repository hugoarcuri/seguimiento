-- =====================================================
-- MIGRACIÓN 023: Seguimiento como tracker de crecimiento
-- Reemplaza la evaluación por puntajes (0-5) por una
-- escala de 3 niveles (Necesita atención / En desarrollo / Bien)
-- y reorganiza las áreas en 7 con vida real del discípulo.
-- ATENCIÓN: borra el historial de evaluaciones/indicadores
-- anteriores (escala y áreas incompatibles con el nuevo modelo).
-- =====================================================

-- 1. Escala de evaluación 0-2
alter table evaluaciones drop constraint if exists evaluaciones_valor_check;
alter table evaluaciones add constraint evaluaciones_valor_check check (valor is null or valor >= 0 and valor <= 2);

-- 2. Columna condicion en indicadores ('estudios' | 'trabajo' | null)
alter table indicadores add column if not exists condicion text;

-- 3. Meta actual del discípulo (persistente hasta cumplirse)
alter table discipulos add column if not exists meta_actual text;
alter table discipulos add column if not exists meta_actual_desde date;

-- 4. Limpiar datos viejos (evaluaciones -> indicadores -> áreas)
delete from evaluaciones;
delete from indicador_nivel;
delete from indicadores;
delete from areas;

-- 5. NUEVAS ÁREAS
insert into areas (id, nombre, descripcion, icono, orden) values
  (1, 'Vida Personal', 'Bienestar emocional, salud, tiempo y hábitos', 'Smile', 1),
  (2, 'Vida Familiar', 'Relaciones y ambiente en el hogar', 'Home', 2),
  (3, 'Estudios', 'Rendimiento académico y actitud', 'GraduationCap', 3),
  (4, 'Trabajo', 'Desempeño laboral y responsabilidad', 'Briefcase', 4),
  (5, 'Relación con Dios', 'Comunión e intimidad con Dios', 'Heart', 5),
  (6, 'Carácter Cristiano', 'Fruto del Espíritu y virtudes', 'Sparkles', 6),
  (7, 'Servicio Cristiano', 'Participación y ministerio en la iglesia', 'Hand', 7);

-- 6. NUEVOS INDICADORES (escala 0-2 en todos)
insert into indicadores (id, area_id, nombre, descripcion, orden, condicion) values
  -- Vida Personal (1)
  (1, 1, 'Estado emocional', '¿Cómo está emocionalmente esta semana?', 1, null),
  (2, 1, 'Salud', 'Estado de salud general', 2, null),
  (3, 1, 'Administración del tiempo', 'Uso y organización del tiempo', 3, null),
  (4, 1, 'Hábitos personales', 'Rutinas y hábitos diarios', 4, null),
  -- Vida Familiar (2)
  (5, 2, 'Relación con padres', 'Calidad de la relación con sus padres', 1, null),
  (6, 2, 'Relación con hermanos', 'Vínculo con sus hermanos', 2, null),
  (7, 2, 'Ambiente familiar', 'Clima general del hogar', 3, null),
  (8, 2, 'Conflictos importantes', 'Situaciones o conflictos en la familia', 4, null),
  -- Estudios (3) - condicional
  (9, 3, 'Rendimiento', 'Desempeño en los estudios', 1, 'estudios'),
  (10, 3, 'Responsabilidad', 'Cumplimiento y constancia', 2, 'estudios'),
  (11, 3, 'Motivación', 'Interés y entusiasmo', 3, 'estudios'),
  (12, 3, 'Situaciones relevantes', 'Situaciones importantes en los estudios', 4, 'estudios'),
  -- Trabajo (4) - condicional
  (13, 4, 'Rendimiento', 'Desempeño en el trabajo', 1, 'trabajo'),
  (14, 4, 'Responsabilidad', 'Cumplimiento y compromiso', 2, 'trabajo'),
  (15, 4, 'Motivación', 'Interés y entusiasmo', 3, 'trabajo'),
  (16, 4, 'Situaciones relevantes', 'Situaciones importantes en el trabajo', 4, 'trabajo'),
  -- Relación con Dios (5)
  (17, 5, 'Devocional', 'Tiempo devocional con Dios', 1, null),
  (18, 5, 'Oración', 'Vida de oración', 2, null),
  (19, 5, 'Lectura bíblica', 'Lectura de la Palabra', 3, null),
  -- Carácter Cristiano (6)
  (20, 6, 'Humildad', 'Sencillez y humildad de corazón', 1, null),
  (21, 6, 'Amor', 'Amar a Dios y al prójimo', 2, null),
  (22, 6, 'Dominio propio', 'Autocontrol y disciplina', 3, null),
  (23, 6, 'Responsabilidad', 'Ser fiel en sus compromisos', 4, null),
  (24, 6, 'Obediencia', 'Obediencia a Dios y a las autoridades', 5, null),
  (25, 6, 'Testimonio', 'Vida que refleja a Cristo', 6, null),
  -- Servicio Cristiano (7)
  (26, 7, 'Participación', 'Participación en cultos y reuniones', 1, null),
  (27, 7, 'Ministerio', 'Servicio en un ministerio', 2, null),
  (28, 7, 'Evangelismo', 'Compartir el evangelio', 3, null),
  (29, 7, 'Disposición para servir', 'Actitud de servicio', 4, null);

-- 7. Resetear secuencias de id
select setval(pg_get_serial_sequence('areas', 'id'), (select coalesce(max(id), 1) from areas));
select setval(pg_get_serial_sequence('indicadores', 'id'), (select coalesce(max(id), 1) from indicadores));
