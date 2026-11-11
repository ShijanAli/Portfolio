import type { Booking } from '@prisma/client';
import { DateTime } from 'luxon';
import { env } from '@/config/env';
import type { EmailMessage } from '@/lib/mailer';
import { detailList, paragraph, renderLayout } from './layout';

const formatWhen = (date: Date, zone: string) =>
  DateTime.fromJSDate(date, { zone }).toFormat("cccc, d LLLL yyyy 'at' h:mm a (ZZZZ)");

const manageUrl = (booking: Booking) => `${env.WEB_URL}/book/manage/${booking.manageToken}`;

const clientDetails = (booking: Booking) =>
  detailList([
    ['Reference', booking.code],
    ['When', formatWhen(booking.startAt, booking.clientTimezone)],
    ['Meeting link', booking.meetLink],
  ]);

function toClient(
  booking: Booking,
  subject: string,
  intro: string,
  withManageLink = true,
): EmailMessage {
  return {
    to: { email: booking.email, name: booking.name },
    subject,
    html: renderLayout({
      heading: subject,
      body: paragraph(`Hi ${booking.name},`) + paragraph(intro) + clientDetails(booking),
      cta: withManageLink ? { label: 'Manage booking', url: manageUrl(booking) } : undefined,
    }),
  };
}

export const bookingReceivedEmail = (booking: Booking) =>
  toClient(
    booking,
    'Your booking request was received',
    'Thanks for booking a call. I will confirm the time shortly.',
  );

export const bookingConfirmedEmail = (booking: Booking) =>
  toClient(
    booking,
    'Your call is confirmed',
    'Your call is confirmed. Looking forward to talking with you.',
  );

export const bookingRescheduledEmail = (booking: Booking) =>
  toClient(booking, 'Your booking was rescheduled', 'Your booking has been moved to a new time.');

export const bookingReminderEmail = (booking: Booking) =>
  toClient(
    booking,
    'Reminder: your call is coming up',
    'This is a reminder about our upcoming call.',
  );

export const bookingCancelledEmail = (booking: Booking) =>
  toClient(
    booking,
    'Your booking was cancelled',
    booking.cancelReason
      ? `Your booking was cancelled. Reason: ${booking.cancelReason}`
      : 'Your booking was cancelled. You are welcome to book another time.',
    false,
  );

/** Returns null when no notification address is configured. */
export function bookingAdminNoticeEmail(
  booking: Booking,
  event: string,
  zone: string,
): EmailMessage | null {
  if (!env.ADMIN_NOTIFY_EMAIL) return null;

  return {
    to: { email: env.ADMIN_NOTIFY_EMAIL },
    replyTo: { email: booking.email, name: booking.name },
    subject: `${event}: ${booking.name} (${booking.code})`,
    html: renderLayout({
      heading: event,
      body: detailList([
        ['Reference', booking.code],
        ['Client', `${booking.name} <${booking.email}>`],
        ['Phone', booking.phone],
        ['Company', booking.company],
        ['When', formatWhen(booking.startAt, zone)],
        ['Client time', formatWhen(booking.startAt, booking.clientTimezone)],
        ['Status', booking.status],
        ['Message', booking.message],
      ]),
    }),
  };
}
