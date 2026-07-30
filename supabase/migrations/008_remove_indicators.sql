-- Desactivar indicadores ya no utilizados
update indicadores set activo = false where id in (5, 6, 8, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 25, 26);
