-- Eliminar el indicador "Tiempo devocional" (área 1, Vida Devocional)
update indicadores set activo = false where id = 3;
