import { defineConfig } from 'tsup';

export default defineConfig({
  // `server` is the long-running process (Docker, Railway...). `vercel` is the serverless
  // function. `seed` creates the first admin, where the TypeScript sources are not present.
  entry: { server: 'src/server.ts', vercel: 'src/vercel.ts', seed: 'prisma/seed.ts' },
  format: ['esm'],
  target: 'node22',
  // sanitize-html is CommonJS but depends on htmlparser2, which is ESM only. Node (and the
  // Vercel runtime) refuse to require() it, so bundle both and let esbuild sort out the interop.
  noExternal: ['sanitize-html'],
  // Bundled CommonJS code calls require() for Node built-ins, which ESM does not provide.
  banner: {
    js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
  },
  clean: true,
  sourcemap: true,
});
