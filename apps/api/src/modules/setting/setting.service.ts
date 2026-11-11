import type { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import {
  SETTING_KEYS,
  settingSchemas,
  type AllSettings,
  type SettingKey,
  type SettingValue,
} from './setting.schema';

/** Stored JSON is parsed on the way out so missing fields are filled with defaults. */
function resolve<K extends SettingKey>(key: K, stored: unknown): SettingValue<K> {
  const schema = settingSchemas[key];
  const parsed = schema.safeParse(stored ?? {});
  if (parsed.success) return parsed.data as SettingValue<K>;

  // Stored data no longer matches the schema: serve defaults instead of failing the site.
  logger.warn({ key, issues: parsed.error.issues }, 'Invalid stored setting, using defaults');
  return schema.parse({}) as SettingValue<K>;
}

class SettingService {
  async getAll(): Promise<AllSettings> {
    const rows = await prisma.siteSetting.findMany();
    const stored = new Map(rows.map((row) => [row.key, row.value]));
    return Object.fromEntries(
      SETTING_KEYS.map((key) => [key, resolve(key, stored.get(key))]),
    ) as AllSettings;
  }

  async get<K extends SettingKey>(key: K): Promise<SettingValue<K>> {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    return resolve(key, row?.value);
  }

  /** Replaces the whole document for a key. Throws a ZodError (422) on invalid input. */
  async update<K extends SettingKey>(key: K, input: unknown): Promise<SettingValue<K>> {
    const value = settingSchemas[key].parse(input) as Prisma.InputJsonObject;
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    return resolve(key, value);
  }
}

export const settingService = new SettingService();
