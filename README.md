# Seguimiento — CRM de Discipulado

Sistema de gestión de discipulado y acompañamiento espiritual para iglesias. Permite administrar discípulos, encuentros, evaluaciones, tareas, oración y evangelismo.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, `output: export` estático)
- [Supabase](https://supabase.com) (auth + Postgres + RLS)
- [React 19](https://react.dev), [Tailwind CSS 4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com)
- [react-hook-form](https://react-hook-form.com) + [Zod](https://zod.dev)
- [recharts](https://recharts.org), [xlsx](https://sheetjs.com), [date-fns](https://date-fns.org)
- [Vitest](https://vitest.dev) para tests de la capa `src/lib`

## Requisitos

- Node.js 20+
- Un proyecto de Supabase con las migraciones de `supabase/migrations/` aplicadas
- Variables de entorno (ver `.env.example`):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (opcional, login con Google)

## Comandos

```bash
npm run dev        # servidor de desarrollo
npm run build      # build de producción (export estático a /out)
npm run lint       # ESLint
npm test           # Vitest (tests de src/lib)
npx tsc --noEmit   # typecheck
```

## Despliegue

El proyecto se exporta como sitio estático y se publica en GitHub Pages bajo el `basePath` `/seguimiento` (configurable con `NEXT_PUBLIC_BASE_PATH`). El workflow `.github/workflows/deploy.yml` ejecuta lint, tests, typecheck y build, y despliega `out/` con cada push a `main`.

## Estructura

- `src/app/(auth)/` — login, registro, restablecer contraseña
- `src/app/(dashboard)/` — páginas del panel (dashboard, discípulos, seguimiento, encuentros, tareas, oración, evangelismo, perfil, configuración)
- `src/components/` — componentes UI reutilizables y layout
- `src/hooks/` — hooks compartidos (autenticación, tamaño de fuente)
- `src/lib/` — utilidades, validaciones Zod, clientes de Supabase
- `src/types/` — tipos de TypeScript
- `supabase/migrations/` — migraciones SQL

## Base de datos

Las políticas de seguridad (RLS) y los triggers (creación automática de perfil, endurecimiento de `search_path`) se aplican manualmente desde `supabase/migrations/`. Las migraciones aplicadas no deben reescribirse; los cambios nuevos van en archivos numerados siguientes.
