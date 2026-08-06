# CLAUDE.md

## Project

**Runtime:** Cloudflare Workers + React Router v8 (SSR)

## Commands

```bash
pnpm dev                  # Dev server (port 3000)
pnpm build                # Production build (content-collections + react-router)
pnpm test                 # Vitest test suite
pnpm typecheck            # TypeScript type check
pnpm check:fix            # Biome auto format
pnpm deploy               # deploy to Cloudflare Workers (uses wrangler)
```

## Architecture

```
app/
  routes/           # React Router routes (map in routes.ts)
    pages/          # Public pages (blog, pricing, playground, signin, etc.)
    pages/user/     # Authenticated user pages (creations, credits)
    pages/admin/    # Admin pages
    api/            # API routes (tRPC, auth, payment webhooks, locales)
  components/
    video-workspace/   # Core product: video generation UI
    landing/           # Landing page sections
    ui/                # shadcn/ui components
  lib/
    ai/             # AI provider clients and shared provider helpers (KIE)
    auth/           # better-auth config (Google OAuth + email OTP)
    database/       # D1/Drizzle schema + connection
    service/        # Business logic: taskService, creditsService
    trpc/           # tRPC routers: paymentRouter, userRouter, ...
    payment/        # Creem payment integration
    r2/             # R2 storage client/server
    model/          # Database query modules
  hooks/            # Shared React hooks
  middlewares/      # auth-guard, i18n
  types/            # Shared TypeScript types
workers/app.ts      # Cloudflare Worker entry point + scheduled task recovery
drizzle/            # D1 migration files
content/            # Content collections (markdown)
```

## Key System Design

**Storage:** D1 (SQLite via Drizzle) for relational data, R2 for generated assets, KV for ephemeral key-value.

**i18n:** i18next with locale prefix routing (`/:locale?`). Locale resources served via `api/locales/:lng/:ns`.

**Routing:** Routes are declared manually in `app/routes.ts`. When adding a new file under `app/routes/api/**`, also register it under the `api` prefix in `app/routes.ts`; file creation alone is not enough.

**Styling:** Tailwind CSS v4 + shadcn/ui. Full design system spec in `DESIGN.md`.

## Conventions

- KISS, DRY, SOLID, YAGNI
- Keep workspace components focused on UI state. Provider calls, DB writes, storage logic go in service/lib modules.
- Environment vars: client-safe in `.env` (and `wrangler.jsonc` vars), secrets in `.dev.vars`.
