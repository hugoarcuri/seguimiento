-- Generar avatares DiceBear con iniciales para discípulos sin foto
update discipulos
set avatar_url = 'https://api.dicebear.com/9.x/initials/svg?seed=' || replace(nombre || ' ' || apellido, ' ', '%20')
where avatar_url is null or avatar_url = '';
