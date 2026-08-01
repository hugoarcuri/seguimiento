-- Renombrar indicador "Sujeción pastoral" a "Relación con la autoridad" (área 4, Comunión)
update indicadores set nombre = 'Relación con la autoridad' where id = 27;
update indicador_nivel set objetivo = 'Enseñar una sana relación con la autoridad.' where indicador_id = 27;
