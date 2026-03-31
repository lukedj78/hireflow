# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start dev server (http://localhost:3000)
pnpm build            # Production build
pnpm lint             # ESLint
pnpm db:push          # Push schema changes to Turso
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database with test data
pnpm db:studio        # Open Drizzle Studio GUI

# Testing (Playwright)
pnpm exec playwright test                    # Run all E2E tests
pnpm exec playwright test tests/auth.spec.ts # Run single test file
pnpm exec playwright test --ui              # Interactive UI mode
pnpm exec playwright codegen                # Generate tests by recording
```

## Architecture

**HireFlow** is a B2B SaaS AI-driven recruiting platform built with Next.js 16 (App Router), Turso (distributed SQLite), and Drizzle ORM.

### Routing & i18n

All pages are under `app/[locale]/` with next-intl (locales: `en`, `it`). Translations live in `messages/{locale}.json`. Key route segments:
- `auth/` - Sign in/up, onboarding
- `dashboard/[organizationId]/` - Org-scoped HR dashboard (jobs, applications, interviews)
- `dashboard/candidate/` - Candidate-facing dashboard
- `admin/` - System admin
- `room/` - Video interview rooms

API routes: `app/api/auth/[...all]/` (Better Auth), `app/api/webhooks/` (n8n, Polar).

### Server Actions Pattern

All business logic is in `lib/server/*-actions.ts` files using `"use server"`. Pattern:
1. Permission check via `checkOrgPermission(organizationId, permissions)`
2. Database operations via Drizzle
3. Return `{ success: boolean, data?: T, error?: string }`
4. Call `revalidatePath()` for cache invalidation

### Auth & Permissions

Better Auth with plugins: `nextCookies`, `admin`, `organization`, `polar`. RBAC defined in `lib/permissions.ts` using `createAccessControl()`.

System roles: `admin`, `user`, `business`, `candidate`. Organization roles: `owner`, `admin`, `member`, `hr`. See `docs/ROLES_AND_PERMISSIONS.md` for the full matrix.

### Database

Turso (libSQL) with Drizzle ORM. Schema in `lib/db/schema.ts`. Config in `drizzle.config.ts`. Notable: `jobPosting` table uses custom `F32_BLOB` type for vector embeddings (semantic job matching via Mistral).

### AI Integration

Uses Vercel AI SDK (`ai` package) with Mistral (LLM + embeddings + OCR) and OpenAI providers. AI logic in `lib/server/ai-actions.ts`. Server-side only.

### Key Services

- **Email**: Resend + React Email templates in `emails/`
- **Payments**: Polar via `@polar-sh/better-auth` plugin, webhook handling in auth config
- **File Storage**: Supabase Storage with presigned URLs (`lib/supabase-storage.ts`)
- **Video**: Provider factory in `lib/video/` (Daily.co, 100ms, LiveKit, Mock). Selected via `VIDEO_PROVIDER` env var
- **Notifications**: Unified service in `lib/services/notification-service.ts`
- **Workflow Automation**: n8n triggers via `lib/events.ts` with retry logic

### UI

ShadCN UI (base-vega style, phosphor icons). Components in `components/ui/`. Tailwind CSS 4 with OKLCH color variables. Dark mode via next-themes. Config in `components.json`.

## Conventions

- Package manager: **pnpm**
- Path alias: `@/*` maps to project root
- Language: project docs and rules are in Italian (see `.trae/rules/project_rules.md`)
- Server actions return `{ success, data?, error? }` pattern consistently
- Seed accounts for testing: `lucadigerlando@gmail.com`, `luigi@test.it` (see `lib/db/seed.ts`)

## Design Context

### Users
Team HR di aziende tech — recruiter e hiring manager abituati a tool moderni (Linear, Notion, Lever). Si aspettano interfacce veloci, ben organizzate e che rispettino il loro tempo. Usano HireFlow quotidianamente per gestire pipeline di selezione, pubblicare annunci, fare screening con AI e coordinare colloqui.

### Brand Personality
**Professionale, Affidabile, Innovativo.** Tono corporate ma moderno: comunica competenza e fiducia senza essere freddo o burocratico. L'AI e' un punto di forza ma non deve sovrastare l'esperienza umana.

### Aesthetic Direction
- **Riferimento principale**: Linear / Notion — clean, minimal, veloce, con attenzione ai dettagli e micro-interazioni fluide
- **Anti-riferimenti**: ATS vecchio stile (Oracle Taleo, SAP SuccessFactors) — interfacce dense, confuse, da enterprise legacy
- **Tema**: Light e dark mode (system default). Palette indigo/viola (OKLCH hue ~277) gia' definita. Font Geist Sans/Mono
- **Stile ShadCN**: base-vega con icone Phosphor, radius 0.625rem, OKLCH color system

### Design Principles
1. **Chiarezza sopra tutto** — Ogni schermata deve avere una gerarchia visiva chiara. Niente sovraccarico informativo. L'utente deve capire cosa fare in <2 secondi
2. **L'AI e' un copilota, non il pilota** — Le funzionalita' AI (matching, generazione testi, parsing CV) devono integrarsi naturalmente nel workflow senza essere invadenti o "magiche"
3. **Velocita' percepita** — Transizioni rapide, skeleton loading, feedback immediato. Ispirarsi alla reattivita' di Linear
4. **Spazio per respirare** — Padding generosi, whitespace intenzionale, layout ariosi. Mai stipare troppi elementi in una vista
5. **Consistenza prima della creativita'** — Usare i componenti ShadCN esistenti. Nuovi pattern solo se quelli esistenti non funzionano. Mai reinventare la ruota per motivi estetici
