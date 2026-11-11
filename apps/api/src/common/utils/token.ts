import { createHash, randomBytes } from 'node:crypto';

/** Cryptographically random, URL-safe token. */
export const generateToken = (bytes = 48) => randomBytes(bytes).toString('base64url');

/** One-way hash for storing tokens at rest. */
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
