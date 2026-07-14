-- =====================================================
-- FIX: Reemplazar indicadores de niveles 3 y 4
-- para que las 4 áreas estén presentes en todos los niveles
-- =====================================================

-- Eliminar datos viejos de niveles 3 y 4
delete from seguimiento_evaluaciones
where indicador_def_id in (
  select id from seguimiento_indicadores_def where etapa_id in (3, 4)
);

delete from seguimiento_indicadores_def where etapa_id in (3, 4);

-- Nivel 3: Carácter
insert into seguimiento_indicadores_def (etapa_id, area, indicador, orden) values
  (3, 'comunion_dios', 'Tiene hambre de Dios', 32),
  (3, 'comunion_dios', 'Busca a Dios en oración', 33),
  (3, 'comunion_dios', 'La Palabra transforma su vida', 34),
  (3, 'comunion_dios', 'Ayuna con propósito', 35),
  (3, 'comunion_dios', 'Adora en espíritu y verdad', 36),
  (3, 'comunion_iglesia', 'Se relaciona con madurez', 37),
  (3, 'comunion_iglesia', 'Aporta a la comunidad', 38),
  (3, 'comunion_iglesia', 'Es ejemplo en la congregación', 39),
  (3, 'comunion_iglesia', 'Acepta autoridad espiritual', 40),
  (3, 'caracter', 'Acepta corrección', 41),
  (3, 'caracter', 'Reconoce sus errores', 42),
  (3, 'caracter', 'Pide perdón', 43),
  (3, 'caracter', 'Lucha contra el pecado', 44),
  (3, 'caracter', 'Tiene pureza sexual', 45),
  (3, 'caracter', 'Controla su lengua', 46),
  (3, 'caracter', 'Es íntegro', 47),
  (3, 'caracter', 'Manifiesta amor', 48),
  (3, 'caracter', 'Manifiesta gozo', 49),
  (3, 'caracter', 'Manifiesta paz', 50),
  (3, 'caracter', 'Manifiesta paciencia', 51),
  (3, 'caracter', 'Manifiesta bondad', 52),
  (3, 'caracter', 'Manifiesta fe', 53),
  (3, 'caracter', 'Manifiesta mansedumbre', 54),
  (3, 'caracter', 'Manifiesta dominio propio', 55),
  (3, 'mision', 'Evangeliza regularmente', 56),
  (3, 'mision', 'Sirve en un ministerio', 57),
  (3, 'mision', 'Testifica a otros', 58),
  (3, 'mision', 'Ayuda a nuevos creyentes', 59);

-- Nivel 4: Compromiso
insert into seguimiento_indicadores_def (etapa_id, area, indicador, orden) values
  (4, 'comunion_dios', 'Vive en la presencia de Dios', 60),
  (4, 'comunion_dios', 'Es sensible al Espíritu Santo', 61),
  (4, 'comunion_dios', 'Discierne la voluntad de Dios', 62),
  (4, 'comunion_dios', 'Intercede por otros', 63),
  (4, 'comunion_iglesia', 'Lidera con humildad', 64),
  (4, 'comunion_iglesia', 'Mentorea a otros líderes', 65),
  (4, 'comunion_iglesia', 'Es referente espiritual', 66),
  (4, 'comunion_iglesia', 'Resuelve conflictos bíblicamente', 67),
  (4, 'caracter', 'Da ejemplo', 68),
  (4, 'caracter', 'Es confiable', 69),
  (4, 'caracter', 'Forma otros líderes', 70),
  (4, 'caracter', 'Es íntegro en todo', 71),
  (4, 'mision', 'Tiene un ministerio', 72),
  (4, 'mision', 'Sirve regularmente', 73),
  (4, 'mision', 'Es responsable', 74),
  (4, 'mision', 'Cumple compromisos', 75),
  (4, 'mision', 'Comparte el evangelio', 76),
  (4, 'mision', 'Ora por inconversos', 77),
  (4, 'mision', 'Tiene lista de personas para evangelizar', 78),
  (4, 'mision', 'Invita personas a la iglesia', 79),
  (4, 'mision', 'Discipula a alguien', 80),
  (4, 'mision', 'Da seguimiento', 81),
  (4, 'mision', 'Enseña la Biblia', 82),
  (4, 'mision', 'Forma nuevos discípulos', 83);
