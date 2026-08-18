-- ========================================
-- Script: Crear Pedro Suarez (Discípulo)
-- Ejecutar en Supabase SQL Editor
-- ========================================
DO $$
DECLARE
  uid uuid := gen_random_uuid();
  seg_id uuid;
BEGIN
  -- 1. Crear usuario en auth.users (el trigger crea profile + discipulo)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at, confirmation_token, recovery_token
  ) VALUES (
    uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'pedro.suarez@test.com',
    crypt('123456', gen_salt('bf')),
    now(),
    '{"nombre":"Pedro","apellido":"Suarez","sexo":"M","fecha_nacimiento":"1995-03-15","telefono":"+54 11 5555-1234","direccion":"Av. Libertador 1234, Buenos Aires","convive_con":"Con la familia","fecha_conversion":"2026-01-10","bautizado":false,"es_miembro":false,"don_espiritual":"Enseñanza","estudia":"Ingeniería en Sistemas, 3er año","trabaja":"Soporte técnico","registro_discipulo":true}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now(), '', ''
  );

  -- 2. Actualizar el profile con rol discipulo (el trigger ya lo crea)
  UPDATE profiles SET rol = 'discipulo' WHERE id = uid;

  -- 3. Actualizar el discipulo con user_id y etapa 2
  UPDATE discipulos SET
    user_id = uid,
    etapa_id = 2,
    estado = 'activo',
    fecha_conversion = '2026-01-10',
    bautizado = false,
    es_miembro = false,
    dones = 'Enseñanza',
    estudia = 'Ingeniería en Sistemas, 3er año',
    trabaja = 'Soporte técnico',
    convive_con = 'Con la familia',
    sexo = 'M',
    fecha_nacimiento = '1995-03-15',
    telefono = '+54 11 5555-1234',
    direccion = 'Av. Libertador 1234, Buenos Aires'
  WHERE id = uid;

  -- 4. Crear seguimiento
  INSERT INTO seguimientos (id, discipulo_id, discipulador_id, etapa, progreso, estado, fecha_inicio, ultima_actualizacion)
  VALUES (gen_random_uuid(), uid, uid, 2, 60, 'activo', '2026-01-15', now())
  RETURNING id INTO seg_id;

  -- 5. Crear objetivos (3 completados, 2 pendientes)
  INSERT INTO seguimiento_objetivos (seguimiento_id, descripcion, completado, fecha_cumplimiento, created_at) VALUES
    (seg_id, 'Leer la Biblia diariamente', true, '2026-02-20', now()),
    (seg_id, 'Asistir al grupo pequeño', true, '2026-03-05', now()),
    (seg_id, 'Memorizar versículos', true, '2026-04-10', now()),
    (seg_id, 'Bautizarse', false, null, now()),
    (seg_id, 'Servir en un ministerio', false, null, now());

  -- 6. Crear encuentros este mes (3 realizados para salud "al día")
  INSERT INTO agenda (discipulo_id, lider_id, fecha, hora, lugar, tema_tratado, realizada) VALUES
    (uid, uid, (current_date - 20)::text, '19:00', 'Iglesia Central', 'Fundamentos de la salvación', true),
    (uid, uid, (current_date - 10)::text, '19:00', 'Café Norte', 'La oración personal', true),
    (uid, uid, (current_date - 2)::text, '19:00', 'Iglesia Central', 'Lectura bíblica efectiva', true),
    (uid, uid, (current_date + 5)::text, '19:00', 'Iglesia Central', 'Identidad en Cristo', false);

  -- 7. Crear tareas (1 pendiente, 1 completada)
  INSERT INTO tareas (discipulo_id, lider_id, titulo, descripcion, tipo, estado, fecha_limite, completed_at) VALUES
    (uid, uid, 'Leer el Evangelio de Juan', 'Leer el evangelio de Juan completo y anotar 3 versículos que te hablen', 'lectura', 'completada', (current_date - 5)::text, (current_date - 6)::text + ' 14:30:00'),
    (uid, uid, 'Memorizar Romanos 8:28', 'Aprender de memoria Romanos 8:28 y recitarlo en el próximo encuentro', 'memorizacion', 'pendiente', (current_date + 10)::text, null);

  -- 8. Crear pedidos de oración
  INSERT INTO oraciones (discipulo_id, lider_id, fecha, pedido, estado) VALUES
    (uid, uid, (current_date - 15)::text, 'Por la salud de mi madre que está enferma', 'en_oracion'),
    (uid, uid, (current_date - 5)::text, 'Para que Dios me dé sabiduría en mis estudios', 'respondida');

  RAISE NOTICE 'Pedro Suarez creado con uid: %', uid;
END;
$$;

-- Verificar resultado
SELECT p.rol, d.nombre, d.apellido, d.etapa_id, d.user_id
FROM profiles p
JOIN discipulos d ON d.id = p.id
WHERE p.email = 'pedro.suarez@test.com';
