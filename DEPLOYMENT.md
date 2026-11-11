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

## B. Managed services

| Part     | Suggested host                | Settings                                                                                      |
| -------- | ----------------------------- | --------------------------------------------------------------------------------------------- |
| Database | Neon, Supabase or Railway     | Create a PostgreSQL 16 database, copy its connection string                                   |
| API      | Railway, Render or Fly.io     | Docker deploy with `apps/api/Dockerfile`, build context = repository root                     |
| Website  | Vercel                        | Root directory `apps/web`                                                                     |
| Admin    | Vercel, Netlify or Cloudflare | Root directory `apps/admin`, build `pnpm build`, output `dist`, SPA fallback to `/index.html` |

Give each one its custom hostname (`api.`, the bare domain, `admin.`).

**API environment** (see `apps/api/.env.example` for the full list):

| Variable                                                                   | Value                                                |
| -------------------------------------------------------------------------- | ---------------------------------------------------- |
| `NODE_ENV`                                                                 | `production`                                         |
| `DATABASE_URL`                                                             | Connection string from the database host             |
| `JWT_ACCESS_SECRET`                                                        | `openssl rand -hex 48`                               |
| `CORS_ORIGINS`                                                             | `https://example.com,https://admin.example.com`      |
| `WEB_URL`                                                                  | `https://example.com`                                |
| `API_PUBLIC_URL`                                                           | `https://api.example.com`                            |
| `WEB_REVALIDATE_SECRET`                                                    | `openssl rand -hex 24` (same value as the website's) |
| `BREVO_API_KEY`, `MAIL_FROM_NAME`, `MAIL_FROM_EMAIL`, `ADMIN_NOTIFY_EMAIL` | Email                                                |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`     | Uploads                                              |

**Website environment:**

| Variable               | Value                                 |
| ---------------------- | ------------------------------------- |
| `API_URL`              | `https://api.example.com/api/v1`      |
| `NEXT_PUBLIC_API_URL`  | `https://api.example.com/api/v1`      |
| `NEXT_PUBLIC_SITE_URL` | `https://example.com`                 |
| `REVALIDATE_SECRET`    | Same value as `WEB_REVALIDATE_SECRET` |

**Admin environment:** `VITE_API_URL` = `https://api.example.com/api/v1`

Create the first admin once, from the API host's shell or console, with
`SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` set:

```bash
node dist/seed.js
```

Run a single API instance. Booking reminders and newsletter sending run inside the API
process; several instances would send them more than once.

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
