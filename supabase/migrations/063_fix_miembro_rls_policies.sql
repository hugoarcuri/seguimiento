-- =====================================================
-- MIGRACIÓN 063: Corrección de políticas RLS para rol miembro
-- Resuelve problemas de permisos en seguimientos, agenda,
-- personas_oracion y tablas relacionadas.
-- =====================================================

-- =====================================================
-- 1. SEGUIMIENTOS: agregar SELECT y UPDATE para miembros
-- =====================================================

-- SELECT: miembros pueden ver su propio seguimiento
CREATE POLICY "Miembros pueden ver su propio seguimiento"
  ON public.seguimientos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.miembros
      WHERE miembros.id = seguimientos.miembro_id
        AND miembros.user_id = auth.uid()
    )
  );

-- UPDATE: miembros pueden actualizar progreso de su seguimiento
CREATE POLICY "Miembros pueden actualizar progreso de su seguimiento"
  ON public.seguimientos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.miembros
      WHERE miembros.id = seguimientos.miembro_id
        AND miembros.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.miembros
      WHERE miembros.id = seguimientos.miembro_id
        AND miembros.user_id = auth.uid()
    )
  );

-- =====================================================
-- 2. SEGUIMIENTO_OBJETIVOS: SELECT + UPDATE para miembros
-- =====================================================

CREATE POLICY "Miembros pueden ver objetivos de su seguimiento"
  ON public.seguimiento_objetivos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.seguimientos s
      JOIN public.miembros m ON m.id = s.miembro_id
      WHERE s.id = seguimiento_objetivos.seguimiento_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Miembros pueden actualizar objetivos de su seguimiento"
  ON public.seguimiento_objetivos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.seguimientos s
      JOIN public.miembros m ON m.id = s.miembro_id
      WHERE s.id = seguimiento_objetivos.seguimiento_id
        AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.seguimientos s
      JOIN public.miembros m ON m.id = s.miembro_id
      WHERE s.id = seguimiento_objetivos.seguimiento_id
        AND m.user_id = auth.uid()
    )
  );

-- =====================================================
-- 3. SEGUIMIENTO_EVALUACIONES: SELECT para miembros
-- =====================================================

CREATE POLICY "Miembros pueden ver evaluaciones de su seguimiento"
  ON public.seguimiento_evaluaciones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.seguimientos s
      JOIN public.miembros m ON m.id = s.miembro_id
      WHERE s.id = seguimiento_evaluaciones.seguimiento_id
        AND m.user_id = auth.uid()
    )
  );

-- =====================================================
-- 4. SEGUIMIENTO_OBSERVACIONES: SELECT para miembros
-- =====================================================

CREATE POLICY "Miembros pueden ver observaciones de su seguimiento"
  ON public.seguimiento_observaciones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.seguimientos s
      JOIN public.miembros m ON m.id = s.miembro_id
      WHERE s.id = seguimiento_observaciones.seguimiento_id
        AND m.user_id = auth.uid()
    )
  );

-- =====================================================
-- 5. SEGUIMIENTO_HISTORIAL: SELECT para miembros
-- =====================================================

CREATE POLICY "Miembros pueden ver historial de su seguimiento"
  ON public.seguimiento_historial FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.seguimientos s
      JOIN public.miembros m ON m.id = s.miembro_id
      WHERE s.id = seguimiento_historial.seguimiento_id
        AND m.user_id = auth.uid()
    )
  );

-- =====================================================
-- 6. AGENDA: reemplazar política rota de la migración 053
--    (referenciaba tabla inexistente "encuentros")
-- =====================================================

DROP POLICY IF EXISTS "Discípulos pueden ver sus encuentros" ON public.agenda;
CREATE POLICY "Miembros pueden ver sus encuentros"
  ON public.agenda FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.miembros
      WHERE miembros.id = agenda.miembro_id
        AND miembros.user_id = auth.uid()
    )
  );

-- =====================================================
-- 7. PERSONAS_ORACION: corregir políticas con user_id -> miembro_id
-- =====================================================

DROP POLICY IF EXISTS "Discípulos leen sus personas_oracion" ON public.personas_oracion;
DROP POLICY IF EXISTS "Discípulos insertan sus personas_oracion" ON public.personas_oracion;
DROP POLICY IF EXISTS "Discípulos eliminan sus personas_oracion" ON public.personas_oracion;
DROP POLICY IF EXISTS "Miembros pueden leer sus personas_oracion" ON public.personas_oracion;
DROP POLICY IF EXISTS "Miembros pueden insertar sus personas_oracion" ON public.personas_oracion;
DROP POLICY IF EXISTS "Miembros pueden eliminar sus personas_oracion" ON public.personas_oracion;

CREATE POLICY "Miembros pueden leer sus personas_oracion"
  ON public.personas_oracion FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.miembros
      WHERE miembros.id = personas_oracion.miembro_id
        AND miembros.user_id = auth.uid()
    )
  );

CREATE POLICY "Miembros pueden insertar sus personas_oracion"
  ON public.personas_oracion FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.miembros
      WHERE miembros.id = personas_oracion.miembro_id
        AND miembros.user_id = auth.uid()
    )
  );

CREATE POLICY "Miembros pueden eliminar sus personas_oracion"
  ON public.personas_oracion FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.miembros
      WHERE miembros.id = personas_oracion.miembro_id
        AND miembros.user_id = auth.uid()
    )
  );
