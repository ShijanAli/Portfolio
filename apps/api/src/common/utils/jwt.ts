import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '@/config/env';
import type { AuthUser } from '@/common/types/express';

const payloadSchema = z.object({
  sub: z.string(),
  email: z.string(),
  role: z.enum(['ADMIN', 'EDITOR']),
});

export function signAccessToken(user: AuthUser): string {
  return jwt.sign({ email: user.email, role: user.role }, env.JWT_ACCESS_SECRET, {
    subject: user.id,
    expiresIn: env.ACCESS_TOKEN_TTL_MINUTES * 60,
    algorithm: 'HS256',
  });
}

/** Returns the user encoded in a valid token, or null if it is missing, expired or tampered. */
export function verifyAccessToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
    const payload = payloadSchema.parse(decoded);
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}
