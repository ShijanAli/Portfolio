/**
 * Type-only entry point for the other apps in the monorepo (`@portfolio/api/types`).
 * Nothing here exists at runtime, so importing it never pulls server code into a browser.
 * It must only import from '@prisma/client': the `@/` alias means something else in the
 * apps that consume this file.
 */
export type {
  AuditLog,
  Availability,
  AvailabilityException,
  BlogCategory,
  Booking,
  BookingSetting,
  Campaign,
  ContactMessage,
  Education,
  Experience,
  Media,
  Post,
  Project,
  ProjectCategory,
  Redirect,
  Seo,
  Service,
  ServiceFaq,
  Subscriber,
  Tag,
  Technology,
  Testimonial,
  User,
} from '@prisma/client';

import type { User } from '@prisma/client';

/** A user as the API returns it: never with the password hash. */
export type PublicUser = Omit<User, 'passwordHash'>;
