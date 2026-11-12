#!/bin/sh
# Build step of the API on Vercel (referenced by vercel.json).
set -eu

pnpm exec prisma generate

# Database migrations are applied here, but only for production deployments: a preview
# deployment of a branch must never change the production database.
if [ "${VERCEL_ENV:-production}" = "production" ]; then
  # Migrations need a direct connection. At runtime the API uses the pooled DATABASE_URL.
  if [ -n "${DIRECT_URL:-}" ]; then
    DATABASE_URL="$DIRECT_URL" pnpm exec prisma migrate deploy
  else
    pnpm exec prisma migrate deploy
  fi
else
  echo "Skipping database migrations (VERCEL_ENV=${VERCEL_ENV})"
fi

pnpm build

# Vercel expects a static output folder with at least one file. For an API host a
# robots.txt that keeps search engines out is a sensible one.
mkdir -p public
printf 'User-agent: *\nDisallow: /\n' > public/robots.txt
