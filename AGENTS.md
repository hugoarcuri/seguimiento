# Agents

## Always commit and push after changes

Después de cada cambio en el código, hacer commit automáticamente con un mensaje descriptivo en español y hacer `git push` al remoto.

## Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## Project Structure

- `src/app/(auth)/` - Authentication pages (login, register)
- `src/app/(dashboard)/` - Dashboard pages
- `src/components/` - Reusable UI components
- `src/lib/` - Utilities, validations, Supabase clients
- `src/types/` - TypeScript type definitions
- `migrations/` - SQL migration files
