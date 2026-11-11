import type { User } from '@prisma/client';
import { env } from '@/config/env';
import { ApiError } from '@/common/utils/api-error';
import { signAccessToken } from '@/common/utils/jwt';
import { hashPassword, verifyPassword } from '@/common/utils/password';
import { generateToken, hashToken } from '@/common/utils/token';
import { prisma } from '@/lib/prisma';
import type { PublicUser } from '@/types';
import type { ChangePasswordInput, LoginInput } from './auth.schema';

export interface ClientContext {
  ip?: string;
  userAgent?: string;
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

const INVALID_CREDENTIALS = 'Invalid email or password';
const INVALID_SESSION = 'Session expired. Please log in again.';

const toPublicUser = ({ passwordHash: _passwordHash, ...user }: User): PublicUser => user;

// Verified against when the email is unknown, so response time does not reveal
// whether an account exists.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword(generateToken(16)));

class AuthService {
  async login(input: LoginInput, context: ClientContext): Promise<AuthResult> {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    const passwordOk = await verifyPassword(
      user?.passwordHash ?? (await getDummyHash()),
      input.password,
    );

    if (!user || !passwordOk || !user.isActive) {
      throw ApiError.unauthorized(INVALID_CREDENTIALS);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokens(updated, context);
  }

  /** Rotates the refresh token: every token is single-use. */
  async refresh(rawToken: string | undefined, context: ClientContext): Promise<AuthResult> {
    if (!rawToken) throw ApiError.unauthorized(INVALID_SESSION);

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
      include: { user: true },
    });
    if (!stored) throw ApiError.unauthorized(INVALID_SESSION);

    if (stored.revokedAt) {
      // A rotated token was replayed: assume theft and end every session of this user.
      await this.revokeAllForUser(stored.userId);
      throw ApiError.unauthorized(INVALID_SESSION);
    }

    if (stored.expiresAt < new Date() || !stored.user.isActive) {
      throw ApiError.unauthorized(INVALID_SESSION);
    }

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.user, context);
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) throw ApiError.unauthorized();
    return toPublicUser(user);
  }

  /** Changing the password signs the user out everywhere. */
  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.unauthorized();

    if (!(await verifyPassword(user.passwordHash, input.currentPassword))) {
      throw ApiError.validation({ currentPassword: 'Current password is incorrect' });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash: await hashPassword(input.newPassword) },
      }),
      prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  private async issueTokens(user: User, context: ClientContext): Promise<AuthResult> {
    const refreshToken = generateToken();
    const refreshExpiresAt = new Date(
      Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: refreshExpiresAt,
        ip: context.ip,
        userAgent: context.userAgent?.slice(0, 255),
      },
    });

    return {
      user: toPublicUser(user),
      accessToken: signAccessToken({ id: user.id, email: user.email, role: user.role }),
      refreshToken,
      refreshExpiresAt,
    };
  }

  private revokeAllForUser(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

export const authService = new AuthService();
