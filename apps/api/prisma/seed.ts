import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { emailSchema } from '../src/common/schemas/common.schema';
import { hashPassword } from '../src/common/utils/password';
import { passwordSchema } from '../src/modules/auth/auth.schema';

const prisma = new PrismaClient();

const seedEnv = z
  .object({
    SEED_ADMIN_NAME: z.string().min(1).default('Admin'),
    SEED_ADMIN_EMAIL: emailSchema,
    SEED_ADMIN_PASSWORD: passwordSchema,
  })
  .parse(process.env);

// Monday to Friday, in BookingSetting.timezone.
const WORKING_DAYS = [1, 2, 3, 4, 5];

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: seedEnv.SEED_ADMIN_EMAIL },
    update: {},
    create: {
      name: seedEnv.SEED_ADMIN_NAME,
      email: seedEnv.SEED_ADMIN_EMAIL,
      passwordHash: await hashPassword(seedEnv.SEED_ADMIN_PASSWORD),
      role: 'ADMIN',
    },
  });

  await prisma.bookingSetting.upsert({ where: { id: 'default' }, update: {}, create: {} });

  if ((await prisma.availability.count()) === 0) {
    await prisma.availability.createMany({
      data: WORKING_DAYS.map((dayOfWeek) => ({ dayOfWeek, startTime: '10:00', endTime: '18:00' })),
    });
  }

  console.log(`Seed complete. Admin: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
