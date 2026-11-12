# Deployment

Two ways to put the site online. Pick one.

|           | A. One server with Docker                  | B. Managed services                              |
| --------- | ------------------------------------------ | ------------------------------------------------ |
| You need  | A VPS (2 GB RAM or more) and a domain      | Accounts on a few hosting platforms and a domain |
| HTTPS     | Automatic (Caddy)                          | Automatic (each platform)                        |
| Good when | You want everything in one place, low cost | You do not want to maintain a server             |

Either way you need:

- A **domain**, with four hostnames: `example.com`, `www.example.com`, `admin.example.com`
  and `api.example.com`. Keep all of them under the **same domain**: the admin's login
  cookie only works when the admin panel and the API share one.
- A **Brevo** account (email). The "from" address must be a verified sender.
- A **Cloudinary** account (image uploads).

## A. One server with Docker

1. Point the four DNS records at your server and install Docker.

2. Get the code onto the server and create the environment file:

   ```bash
   cp .env.production.example .env.production
   ```

   Fill it in. Generate the three secrets with the `openssl` commands shown in the file.

3. Start the database and the API first. The website reads its content from the API
   while it is being built:

   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build postgres api
   ```

4. Create the first admin account (uses the `SEED_ADMIN_*` values from the env file):

   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.production exec api node dist/seed.js
   ```

5. Build and start everything else:

   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
   ```

6. Open `https://admin.example.com`, sign in, **change the password**, then remove
   `SEED_ADMIN_PASSWORD` from `.env.production`.

Database migrations are applied automatically each time the API container starts.

### Updating

```bash
git pull
```

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### Backups

Everything worth keeping is in PostgreSQL (uploads live on Cloudinary). Back it up on a
schedule, and store the file somewhere other than this server:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production exec -T postgres \
  pg_dump -U portfolio portfolio | gzip > backup-$(date +%F).sql.gz
```

To restore into an empty database:

```bash
gunzip -c backup-2026-01-01.sql.gz | docker compose -f docker-compose.prod.yml \
  --env-file .env.production exec -T postgres psql -U portfolio portfolio
```

## B. Everything on Vercel (three projects) + a database

The website, the admin panel and the API are three separate Vercel projects from this one
repository, plus a PostgreSQL database (Neon, Supabase or Vercel Postgres).

How the API differs on Vercel (all of this is already handled in the code):

| On a normal server                                             | On Vercel                                                                  |
| -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Timers run booking reminders and scheduled newsletters         | **Cron** calls `/api/v1/internal/cron/*` (protected by `CRON_SECRET`)      |
| Emails, audit entries and cache refresh finish after the reply | Kept alive with `waitUntil` until they finish                              |
| Rate limits counted in memory                                  | Counted in the database (logins and public forms), shared by all instances |
| Uploads can go to local disk                                   | **Cloudinary is required**: the file system is read-only                   |
| Upload limit 8 MB                                              | **4 MB**: Vercel rejects larger request bodies                             |
| Migrations run when the container starts                       | Run during the production build                                            |

### 1. Database

Create a PostgreSQL 16 database. You need two connection strings:

- **Pooled** (Neon: the host with `-pooler`; Supabase: the "transaction pooler"). This is
  `DATABASE_URL`, used by the running API. Add `&pgbouncer=true&connection_limit=5` to it.
- **Direct** (not pooled). This is `DIRECT_URL`, used only to apply migrations during the build.

### 2. API project

1. Vercel → **Add New → Project** → import the repository.
2. **Root Directory:** `apps/api`. Keep **"Include source files outside of the Root
   Directory"** on. The build runs `scripts/vercel-build.sh` (from `apps/api/vercel.json`).
3. Environment variables:

   | Variable                                                                   | Value                                                |
   | -------------------------------------------------------------------------- | ---------------------------------------------------- |
   | `NODE_ENV`                                                                 | `production`                                         |
   | `DATABASE_URL`                                                             | The **pooled** connection string                     |
   | `DIRECT_URL`                                                               | The **direct** connection string                     |
   | `JWT_ACCESS_SECRET`                                                        | `openssl rand -hex 48`                               |
   | `CRON_SECRET`                                                              | `openssl rand -hex 24`                               |
   | `CORS_ORIGINS`                                                             | `https://example.com,https://admin.example.com`      |
   | `WEB_URL`                                                                  | `https://example.com`                                |
   | `API_PUBLIC_URL`                                                           | `https://api.example.com`                            |
   | `WEB_REVALIDATE_SECRET`                                                    | `openssl rand -hex 24` (same value as the website's) |
   | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`     | Uploads (required)                                   |
   | `BREVO_API_KEY`, `MAIL_FROM_NAME`, `MAIL_FROM_EMAIL`, `ADMIN_NOTIFY_EMAIL` | Email                                                |

4. Deploy, then add the domain `api.example.com` (**Settings → Domains**).
5. Check `https://api.example.com/api/v1/health` returns `{"success":true,...}`.

Migrations are applied by the **production** build only, so a preview deployment of a branch
can never change your production database.

**Create the first admin.** Vercel has no shell, so run the seed from your own computer
against the database (use the **direct** connection string; the values are only in this
command, not in a file):

```bash
DATABASE_URL="postgresql://...direct..." SEED_ADMIN_NAME="Your Name" SEED_ADMIN_EMAIL="you@example.com" SEED_ADMIN_PASSWORD="A-long-Passw0rd" JWT_ACCESS_SECRET="any-32-or-more-characters-long-string" pnpm --filter @portfolio/api db:seed
```

### 3. Website project

1. Add another project from the same repository. **Root Directory:** `apps/web`
   (keep "Include source files outside of the Root Directory" on).
2. Environment variables:

   | Variable               | Value                                 |
   | ---------------------- | ------------------------------------- |
   | `API_URL`              | `https://api.example.com/api/v1`      |
   | `NEXT_PUBLIC_API_URL`  | `https://api.example.com/api/v1`      |
   | `NEXT_PUBLIC_SITE_URL` | `https://example.com`                 |
   | `REVALIDATE_SECRET`    | Same value as `WEB_REVALIDATE_SECRET` |

3. Deploy, then add `example.com` and `www.example.com` as domains.

Deploy the API **first**: the website reads its content from it while building. If the API
was not reachable, pages are built empty and fill in on the first visit.
`NEXT_PUBLIC_*` values are baked in at build time: after changing one, redeploy.

### 4. Admin project

A third project from the same repository. **Root Directory:** `apps/admin`
(keep "Include source files outside of the Root Directory" on).
Environment variable: `VITE_API_URL` = `https://api.example.com/api/v1`. Domain:
`admin.example.com`.

`apps/admin/vercel.json` sends every path to `index.html` (without it, reloading a page like
`/projects` gives a 404) and adds the security headers.

### Scheduled jobs and your Vercel plan

`apps/api/vercel.json` runs **one cron a day** (03:00 UTC) that does everything: sends
booking reminders for the next 24 hours, starts scheduled newsletters, finishes any
campaign that was cut short, and cleans up old data. That is the only frequency the free
**Hobby** plan allows (a more frequent cron makes the deployment fail).

What that means in practice on Hobby:

- Booking reminders work (they cover the next 24 hours).
- A newsletter you schedule goes out at the next daily run, not at the exact minute. "Send
  now" is not affected: it sends immediately.
- A very large "Send now" (hundreds of subscribers) pauses at the 60-second function limit
  and continues at the next daily run.

On the **Pro** plan, replace the `crons` in `apps/api/vercel.json` with:

```json
"crons": [
  { "path": "/api/v1/internal/cron/reminders", "schedule": "*/10 * * * *" },
  { "path": "/api/v1/internal/cron/campaigns", "schedule": "* * * * *" },
  { "path": "/api/v1/internal/cron/maintenance", "schedule": "0 3 * * *" }
]
```

and you can raise `maxDuration` for `api/index.js` up to 300.

### Use your own domain

The admin keeps you signed in with a cookie from `api.example.com`. Browsers only send it
when the admin and the API are on the **same site**, so they must share one domain, for
example `admin.example.com` and `api.example.com`. The default `*.vercel.app` addresses are
different sites from each other, so login would appear to work and then sign you out on every
reload.

### Other API hosts

An always-on host (Railway, Render, Fly.io) also works and has none of the limits above:
deploy `apps/api/Dockerfile` with the repository root as build context, run a single
instance, and set the same environment variables except `CRON_SECRET` and `DIRECT_URL`.
Its migrations run when the container starts. Only the API changes; the website and admin
stay on Vercel as described.

## After the first deploy

- [ ] Sign in to the admin and change the seeded password.
- [ ] Site settings: name, bio, photo, hero text, social links, SEO defaults (set **Site URL**).
- [ ] Replace or delete any placeholder content.
- [ ] Booking settings and working hours. Add evening hours if your clients are abroad.
- [ ] Send yourself a test: contact form, a booking, a newsletter sign-up. Check the emails arrive.
- [ ] Upload an image in the media library and confirm it shows on the site.
- [ ] Add the site to Google Search Console and submit `https://example.com/sitemap.xml`.

## How the pieces talk to each other

```
Visitor ──► Website (Next.js) ──► API (Express) ──► PostgreSQL
You     ──► Admin (static)    ──►  │
                                   ├──► Brevo (email)
                                   └──► Cloudinary (uploads)
```

Pages are cached. When you save something in the admin, the API tells the website to
refresh the pages that use it (`WEB_REVALIDATE_SECRET` / `REVALIDATE_SECRET`). Without
that secret, changes appear when the cache expires, after about five minutes.

## Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request: formatting, lint,
typecheck, the API tests against a real PostgreSQL, and a build of all three apps.
