# Portfolio 2026

A full stack developer portfolio: public website, admin panel and API in one repository.

| App          | What it is                                | Stack                                 |
| ------------ | ----------------------------------------- | ------------------------------------- |
| `apps/web`   | The public website                        | Next.js, Tailwind CSS, GSAP, Three.js |
| `apps/admin` | Admin panel: content, bookings, analytics | Vite, React, TanStack Query           |
| `apps/api`   | REST API                                  | Express 5, Prisma, PostgreSQL, Zod    |

`packages/api-client` is the typed HTTP client shared by the website and the admin.

## Features

- Projects, services, experience, education, tech stack, testimonials
- Blog with categories, tags, scheduling and a rich text editor
- Call booking: working hours, days off, timezones, reschedule and cancel by link
- Newsletter with double opt-in, topics and campaigns
- Contact form, media library, redirects
- SEO: per-page and per-item metadata, sitemap, structured data
- Cookie-free visitor analytics, optional Google Analytics
- Everything on the site is editable from the admin panel

## Getting started

Requirements: Node.js 22, pnpm 10, Docker (for PostgreSQL).

```bash
pnpm install
```

```bash
docker compose up -d
```

```bash
cp apps/api/.env.example apps/api/.env
```

```bash
cp apps/web/.env.example apps/web/.env.local
```

In `apps/api/.env`, set `JWT_ACCESS_SECRET` and the `SEED_ADMIN_*` values. Then:

```bash
pnpm --filter @portfolio/api db:migrate
```

```bash
pnpm --filter @portfolio/api db:seed
```

```bash
pnpm dev
```

| App     | Address                      |
| ------- | ---------------------------- |
| Website | http://localhost:3000        |
| Admin   | http://localhost:5173        |
| API     | http://localhost:4000/api/v1 |

To see the design before writing your own content, add placeholder content
(everything it adds is marked "Sample" and meant to be replaced):

```bash
pnpm --filter @portfolio/api db:seed:demo
```

Without Brevo and Cloudinary keys, emails are written to the API log and uploads are
stored in `apps/api/uploads`.

## Scripts

| Command          | What it does                   |
| ---------------- | ------------------------------ |
| `pnpm dev`       | Run every app in watch mode    |
| `pnpm build`     | Production build               |
| `pnpm typecheck` | TypeScript check               |
| `pnpm lint`      | ESLint                         |
| `pnpm test`      | API unit and integration tests |
| `pnpm format`    | Prettier                       |

## How the code is organised

**API** (`apps/api/src`): one folder per feature under `modules/`, each with
`*.routes.ts`, `*.controller.ts`, `*.service.ts` and `*.schema.ts` (Zod). Shared pieces
live in `common/`: a generic CRUD service, controller and router, so a simple resource is
four short files. Request flow: `routes → validate → controller → service → Prisma`.

**Admin** (`apps/admin/src`): one table, one modal and one form component for the whole
panel. A CRUD screen is a config object passed to `ResourcePage`; see any
`features/*/**.config.tsx`. Validation rules live only in the API, whose field errors are
shown under the matching inputs.

**Website** (`apps/web/src`): server-rendered pages that read from the API and are cached.
Animations are opt-in attributes (`data-reveal`) plus a few scroll-linked components in
`components/motion`. Everything works without JavaScript and respects reduced motion.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md).
