import path from 'node:path';
import type { NextConfig } from 'next';
import type { RemotePattern } from 'next/dist/shared/lib/image-config';

const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1');

/** In local development, uploads are served by the API on this machine. */
const apiIsLocal = ['localhost', '127.0.0.1'].includes(apiUrl.hostname);

/** Uploads the API serves itself (when Cloudinary is not configured) live under /uploads. */
const apiUploads: RemotePattern = {
  protocol: apiUrl.protocol === 'https:' ? 'https' : 'http',
  hostname: apiUrl.hostname,
  port: apiUrl.port,
  pathname: '/uploads/**',
};

const config: NextConfig = {
  // Workspace packages are shipped as TypeScript source.
  transpilePackages: ['@portfolio/api-client'],
  // The Docker image sets NEXT_OUTPUT=standalone to get a minimal, self-contained server.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  // Dependencies are traced from the monorepo root, where pnpm keeps them.
  outputFileTracingRoot: path.join(import.meta.dirname, '../../'),
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }, apiUploads],
    // The image optimizer refuses private addresses by default. That protection stays on
    // in production; it is lifted only when the API runs on this machine.
    dangerouslyAllowLocalIP: apiIsLocal,
  },
  poweredByHeader: false,
};

export default config;
