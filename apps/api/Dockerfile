# syntax=docker/dockerfile:1
# Build from the repository root:  docker build -f apps/api/Dockerfile -t portfolio-api .

# Alpine already ships the OpenSSL 3 libraries that Prisma's query engine needs, so no
# system packages have to be installed.
FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

# ---- Build: install everything, compile, then keep only what production needs
FROM base AS build
WORKDIR /repo
# The lockfile alone decides what is downloaded, so this layer is reused until it changes.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --offline --frozen-lockfile --filter @portfolio/api...
RUN pnpm --filter @portfolio/api exec prisma generate \
  && pnpm --filter @portfolio/api build
# A self-contained copy of the app with production dependencies only.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm --filter @portfolio/api deploy --prod --legacy /out \
  && cd /out && node_modules/.bin/prisma generate

# ---- Runtime
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out/node_modules ./node_modules
COPY --from=build --chown=node:node /out/package.json ./
COPY --from=build --chown=node:node /out/prisma ./prisma
COPY --from=build --chown=node:node /repo/apps/api/dist ./dist
# Only used when Cloudinary is not configured; mount a volume here to keep the files.
RUN mkdir -p uploads && chown node:node uploads
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Pending database migrations are applied before the server starts.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/server.js"]
