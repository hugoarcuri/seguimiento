-- ========================================
-- Paso 2: Crear datos de Pedro Suarez
-- PRIMERO crear el usuario desde el Dashboard de Supabase:
--   Authentication > Users > Add user
--   Email: pedro.suarez@test.com
--   Password: 123456
--   User Metadata: {"nombre":"Pedro","apellido":"Suarez"}
-- Luego ejecutar este script en SQL Editor
-- ========================================
DO $$
DECLARE
  uid uuid;
  seg_id uuid;
BEGIN
  -- Buscar el usuario por email
  SELECT id INTO uid FROM auth.users WHERE email = 'pedro.suarez@test.com';
  IF uid IS NULL THEN
    RAISE EXCEPTION 'No se encontró el usuario pedro.suarez@test.com. Crealo primero desde el Dashboard de Supabase.';
  END IF;

  -- Crear discipulo (el trigger ya lo creó, lo actualizamos)
  INSERT INTO discipulos (id, user_id, nombre, apellido, email, sexo, fecha_nacimiento, telefono, direccion, convive_con, fecha_conversion, bautizado, es_miembro, dones, estudia, trabaja, etapa_id, estado)
  VALUES (
    uid, uid, 'Pedro', 'Suarez', 'pedro.suarez@test.com', 'M',
    '1995-03-15', '+54 11 5555-1234', 'Av. Libertador 1234, Buenos Aires',
    'Con la familia', '2026-01-10', false, false, 'Enseñanza',
    'Ingeniería en Sistemas, 3er año', 'Soporte técnico', 2, 'activo'
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id, etapa_id = 2, estado = 'activo',
    sexo = 'M', fecha_nacimiento = '1995-03-15', telefono = '+54 11 5555-1234',
    direccion = 'Av. Libertador 1234, Buenos Aires', convive_con = 'Con la familia',
    fecha_conversion = '2026-01-10', dones = 'Enseñanza',
    estudia = 'Ingeniería en Sistemas, 3er año', trabaja = 'Soporte técnico';

  -- Crear seguimiento
  INSERT INTO seguimientos (id, discipulo_id, discipulador_id, etapa, progreso, estado, fecha_inicio, ultima_actualizacion)
  VALUES (gen_random_uuid(), uid, uid, 2, 60, 'activo', '2026-01-15', now())
  ON CONFLICT DO NOTHING
  RETURNING id INTO seg_id;

  -- Si no se creó (ya existía), buscarlo
  IF seg_id IS NULL THEN
    SELECT id INTO seg_id FROM seguimientos WHERE discipulo_id = uid AND estado = 'activo' LIMIT 1;
  END IF;

  -- Crear objetivos (3 completados, 2 pendientes)
  INSERT INTO seguimiento_objetivos (seguimiento_id, descripcion, completado, fecha_cumplimiento, created_at) VALUES
    (seg_id, 'Leer la Biblia diariamente', true, '2026-02-20', now()),
    (seg_id, 'Asistir al grupo pequeño', true, '2026-03-05', now()),
    (seg_id, 'Memorizar versículos', true, '2026-04-10', now()),
    (seg_id, 'Bautizarse', false, null, now()),
    (seg_id, 'Servir en un ministerio', false, null, now());

  -- Crear encuentros este mes (3 realizados para salud "al día")
  INSERT INTO agenda (discipulo_id, lider_id, fecha, hora, lugar, tema_tratado, realizada) VALUES
    (uid, uid, (current_date - 20)::text, '19:00', 'Iglesia Central', 'Fundamentos de la salvación', true),
    (uid, uid, (current_date - 10)::text, '19:00', 'Café Norte', 'La oración personal', true),
    (uid, uid, (current_date - 2)::text, '19:00', 'Iglesia Central', 'Lectura bíblica efectiva', true),
    (uid, uid, (current_date + 5)::text, '19:00', 'Iglesia Central', 'Identidad en Cristo', false);

  -- Crear tareas
  INSERT INTO tareas (discipulo_id, lider_id, titulo, descripcion, tipo, estado, fecha_limite, completed_at) VALUES
    (uid, uid, 'Leer el Evangelio de Juan', 'Leer el evangelio completo y anotar 3 versículos', 'lectura', 'completada', (current_date - 5)::text, (current_date - 6)::text + ' 14:30:00'),
    (uid, uid, 'Memorizar Romanos 8:28', 'Aprender de memoria Romanos 8:28', 'memorizacion', 'pendiente', (current_date + 10)::text, null);

  -- Crear pedidos de oración
  INSERT INTO oraciones (discipulo_id, lider_id, fecha, pedido, estado) VALUES
    (uid, uid, (current_date - 15)::text, 'Por la salud de mi madre', 'en_oracion'),
    (uid, uid, (current_date - 5)::text, 'Para sabiduría en mis estudios', 'respondida');

  RAISE NOTICE 'Datos de Pedro Suarez creados correctamente. UID: %', uid;
END;
$$;

-- Verificar
SELECT p.email, p.rol, d.nombre, d.apellido, d.etapa_id, d.user_id
FROM profiles p
JOIN discipulos d ON d.id = p.id
WHERE p.email = 'pedro.suarez@test.com';
