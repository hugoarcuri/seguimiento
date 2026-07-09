-- Allow users to insert their own profile during registration
create policy "Usuarios pueden insertar su propio perfil"
  on profiles for insert with check (auth.uid() = id);

-- Allow admins to insert any profile
create policy "Admins pueden insertar perfiles"
  on profiles for insert with check (
    exists (select 1 from profiles where id = auth.uid() and rol = 'admin')
  );
