import { bookingReminderEmail } from '@/emails/booking.emails';
import { sendEmail } from '@/lib/mailer';
import { prisma } from '@/lib/prisma';

const REMIND_HOURS_BEFORE = 24;

/** Emails a reminder once for every confirmed booking that starts within the next day. */
export async function sendBookingReminders(): Promise<void> {
  const now = new Date();
  const horizon = new Date(now.getTime() + REMIND_HOURS_BEFORE * 60 * 60 * 1000);

  const due = await prisma.booking.findMany({
    where: { status: 'CONFIRMED', reminderSentAt: null, startAt: { gt: now, lte: horizon } },
  });

  for (const booking of due) {
    await sendEmail(bookingReminderEmail(booking));
    await prisma.booking.update({
      where: { id: booking.id },
      data: { reminderSentAt: new Date() },
    });
  }
}
