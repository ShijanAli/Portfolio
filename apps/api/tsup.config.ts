import { defineConfig } from 'tsup';

export default defineConfig({
  // `server` is the long-running process (Docker, Railway...). `vercel` is the serverless
  // function. `seed` creates the first admin, where the TypeScript sources are not present.
  entry: { server: 'src/server.ts', vercel: 'src/vercel.ts', seed: 'prisma/seed.ts' },
  format: ['esm'],
  target: 'node22',
  clean: true,
  sourcemap: true,
});
