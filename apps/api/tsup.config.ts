import { defineConfig } from 'tsup';

export default defineConfig({
  // `seed` is built too, so the first admin can be created inside the production image,
  // where the TypeScript sources and dev tools are not present.
  entry: { server: 'src/server.ts', seed: 'prisma/seed.ts' },
  format: ['esm'],
  target: 'node22',
  clean: true,
  sourcemap: true,
});
