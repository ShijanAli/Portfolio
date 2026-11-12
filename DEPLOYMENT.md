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

## B. Managed services (Vercel + an API host)

**The website and the admin panel go on Vercel. The API goes on a host that runs a normal,
always-on server (Railway, Render or Fly.io), with a PostgreSQL database (Neon or the
host's own).**

Why not the API on Vercel too? Vercel runs code as short-lived serverless functions that
are frozen as soon as the response is sent. This API relies on things that do not survive
that:

| The API does this                                             | On Vercel                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------- |
| Booking reminders and scheduled newsletters (a timer)         | The timer never runs                                                |
| Sends emails, audit logs and cache refreshes _after_ replying | Cut off when the function freezes                                   |
| Sends a campaign to many subscribers in the background        | Stopped halfway                                                     |
| Rate limiting kept in memory                                  | Every request may hit a new instance, so it does not limit anything |

It can be made to work (Vercel Cron for the timers, `waitUntil` for work after the reply, a
shared store for rate limits), but that is a rewrite of those parts, so the guide below
does not do it.

### 1. Database

Create a PostgreSQL 16 database (Neon, Railway or Supabase). Copy its connection string.
Use the **direct** one, not a "pooled" / pgbouncer one: the API is a long-running server
with its own connection pool, and migrations do not work through a pooler.

### 2. API (Railway, Render or Fly.io)

Deploy from this GitHub repository using the Dockerfile:

- Dockerfile path: `apps/api/Dockerfile`
- Build context: the **repository root** (not `apps/api`)
- Health check path: `/api/v1/health`
- Run **one** instance only (reminders and campaigns run inside the process)

Add a custom domain `api.example.com`, then set the environment variables below. The
container applies database migrations itself every time it starts.

| Variable                                                                   | Value                                                |
| -------------------------------------------------------------------------- | ---------------------------------------------------- |
| `NODE_ENV`                                                                 | `production`                                         |
| `DATABASE_URL`                                                             | The direct connection string from step 1             |
| `JWT_ACCESS_SECRET`                                                        | `openssl rand -hex 48`                               |
| `CORS_ORIGINS`                                                             | `https://example.com,https://admin.example.com`      |
| `WEB_URL`                                                                  | `https://example.com`                                |
| `API_PUBLIC_URL`                                                           | `https://api.example.com`                            |
| `WEB_REVALIDATE_SECRET`                                                    | `openssl rand -hex 24` (same value as the website's) |
| `BREVO_API_KEY`, `MAIL_FROM_NAME`, `MAIL_FROM_EMAIL`, `ADMIN_NOTIFY_EMAIL` | Email                                                |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`     | Uploads                                              |

Create the first admin once, from the host's shell or "run command" feature, with
`SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` set:

```bash
node dist/seed.js
```

Check `https://api.example.com/api/v1/health` returns `{"success":true,...}` before going on.

### 3. Website (Vercel)

1. Vercel → **Add New → Project** → import the GitHub repository.
2. **Root Directory:** `apps/web`. Keep **"Include source files outside of the Root
   Directory"** switched on: the website uses the packages in `packages/`.
3. Framework: Next.js (detected). The build command comes from `apps/web/vercel.json`.
4. Environment variables:

   | Variable               | Value                                 |
   | ---------------------- | ------------------------------------- |
   | `API_URL`              | `https://api.example.com/api/v1`      |
   | `NEXT_PUBLIC_API_URL`  | `https://api.example.com/api/v1`      |
   | `NEXT_PUBLIC_SITE_URL` | `https://example.com`                 |
   | `REVALIDATE_SECRET`    | Same value as `WEB_REVALIDATE_SECRET` |

5. Deploy, then add the domains `example.com` and `www.example.com` under
   **Settings → Domains**.

Deploy the API **first**: the website reads its content from it while building. If the API
was not reachable, the pages are built empty and fill in on the first visit; restarting the
API also tells the website to refresh everything.

`NEXT_PUBLIC_*` values are baked in at build time. After changing one, redeploy.

### 4. Admin panel (Vercel)

Same steps, as a second Vercel project from the same repository:

- **Root Directory:** `apps/admin` (keep "Include source files outside of the Root Directory" on)
- Environment variable: `VITE_API_URL` = `https://api.example.com/api/v1`
- Domain: `admin.example.com`

`apps/admin/vercel.json` already sends every path to `index.html` (without it, reloading a
page like `/projects` gives a 404) and adds the security headers.

### Use your own domain

The admin keeps you signed in with a cookie from `api.example.com`. Browsers only send it
when the admin and the API are on the **same site**, so they must share one domain, for
example `admin.example.com` and `api.example.com`. The default `*.vercel.app` and
`*.up.railway.app` addresses are different sites, so login would appear to work and then
sign you out on every reload.

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
