import { DateTime } from 'luxon';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { testOutbox } from '@/lib/mailer';
import { prisma } from '@/lib/prisma';
import { api, createTestAdmin, unique, url } from '@/tests/helpers';

let auth: { Authorization: string };
let adminId: string;
let slots: string[];
const email = `${unique('client')}@example.com`;
const client = { name: 'Jane Client', email, clientTimezone: 'America/New_York' };

const book = (startAt: string, extra: object = {}) =>
  api()
    .post(url('/bookings'))
    .send({ ...client, startAt, ...extra });

const emailsTo = (address: string) => testOutbox.filter((message) => message.to.email === address);

/** The booking rules these tests assume, independent of whatever is stored in the database. */
const TEST_SETTINGS = {
  timezone: 'Asia/Dhaka',
  slotDuration: 30,
  bufferTime: 15,
  minNoticeHours: 12,
  maxDaysAhead: 30,
  maxPerDay: 4,
  autoConfirm: false,
};

// Whatever was stored before the tests, put back afterwards.
let savedAvailability: Awaited<ReturnType<typeof prisma.availability.findMany>>;
let savedExceptions: Awaited<ReturnType<typeof prisma.availabilityException.findMany>>;
let savedSettings: Awaited<ReturnType<typeof prisma.bookingSetting.findUnique>>;

beforeAll(async () => {
  const admin = await createTestAdmin();
  auth = admin.auth;
  adminId = admin.user.id;

  // A fresh database (as in CI) has no working hours, so the tests create their own:
  // every day, 10:00 to 18:00.
  [savedAvailability, savedExceptions, savedSettings] = await Promise.all([
    prisma.availability.findMany(),
    prisma.availabilityException.findMany(),
    prisma.bookingSetting.findUnique({ where: { id: 'default' } }),
  ]);
  await prisma.availability.deleteMany();
  await prisma.availabilityException.deleteMany();
  await prisma.availability.createMany({
    data: Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      startTime: '10:00',
      endTime: '18:00',
    })),
  });
  await prisma.bookingSetting.upsert({
    where: { id: 'default' },
    update: TEST_SETTINGS,
    create: { id: 'default', ...TEST_SETTINGS },
  });

  const zone = TEST_SETTINGS.timezone;
  const from = DateTime.now().setZone(zone).plus({ days: 2 });
  const res = await api()
    .get(url('/bookings/slots'))
    .query({ from: from.toISODate(), to: from.plus({ days: 14 }).toISODate() });
  slots = res.body.data.slots;
});

afterAll(async () => {
  await prisma.booking.deleteMany({ where: { email } });
  await prisma.availability.deleteMany();
  await prisma.availabilityException.deleteMany();
  if (savedAvailability.length > 0)
    await prisma.availability.createMany({ data: savedAvailability });
  if (savedExceptions.length > 0)
    await prisma.availabilityException.createMany({ data: savedExceptions });
  if (savedSettings)
    await prisma.bookingSetting.update({ where: { id: 'default' }, data: savedSettings });
  await prisma.user.delete({ where: { id: adminId } });
  await prisma.$disconnect();
});

describe('booking', () => {
  let manageToken: string;
  let bookingId: string;

  it('offers slots to visitors', () => {
    expect(slots.length).toBeGreaterThan(5);
  });

  it('rejects a time that is not an offered slot', async () => {
    const offGrid = new Date(new Date(slots[0]!).getTime() + 60_000).toISOString();
    expect((await book(offGrid)).status).toBe(409);
    expect((await book('2020-01-01T10:00:00Z')).status).toBe(409);
  });

  it('validates the booking form', async () => {
    const res = await book(slots[0]!, { email: 'nope', clientTimezone: 'Mars/Olympus' });
    expect(res.status).toBe(422);
    expect(Object.keys(res.body.error.fields).sort()).toEqual(['clientTimezone', 'email']);
  });

  it('stores only one booking when two visitors take the same slot at once', async () => {
    const [first, second] = await Promise.all([book(slots[0]!), book(slots[0]!)]);

    expect([first.status, second.status].sort()).toEqual([201, 409]);
    const winner = first.status === 201 ? first : second;
    manageToken = winner.body.data.manageToken;
    expect(winner.body.data.status).toBe('PENDING');
    expect(winner.body.data).not.toHaveProperty('adminNote');

    const stored = await prisma.booking.findUniqueOrThrow({ where: { manageToken } });
    bookingId = stored.id;
    expect(await prisma.booking.count({ where: { email } })).toBe(1);
  });

  it('emails the client a confirmation of receipt with their manage link', () => {
    const [received] = emailsTo(email);
    expect(received?.subject).toBe('Your booking request was received');
    expect(received?.html).toContain(`/book/manage/${manageToken}`);
  });

  it('removes the booked slot from the offer', async () => {
    const date = slots[0]!.slice(0, 10);
    const res = await api().get(url('/bookings/slots')).query({ from: date, to: date });
    expect(res.body.data.slots).not.toContain(slots[0]);
  });

  it('keeps the admin list private and lets an admin confirm with a meeting link', async () => {
    expect((await api().get(url('/bookings'))).status).toBe(401);

    const res = await api()
      .patch(url(`/bookings/${bookingId}/status`))
      .set(auth)
      .send({ status: 'CONFIRMED', meetLink: 'https://meet.example.com/abc' });

    expect(res.body.data.status).toBe('CONFIRMED');
    expect(emailsTo(email).at(-1)?.subject).toBe('Your call is confirmed');
    expect(emailsTo(email).at(-1)?.html).toContain('https://meet.example.com/abc');
  });

  it('refuses status changes that make no sense', async () => {
    const res = await api()
      .patch(url(`/bookings/${bookingId}/status`))
      .set(auth)
      .send({ status: 'CONFIRMED' });
    expect(res.status).toBe(409);
  });

  it('lets the client reschedule through their link, freeing the old slot', async () => {
    const target = slots.at(-1)!;
    const res = await api()
      .post(url(`/bookings/manage/${manageToken}/reschedule`))
      .send({ startAt: target });

    expect(res.status).toBe(200);
    expect(res.body.data.startAt).toBe(target);
    expect(res.body.data.status).toBe('PENDING');

    const date = slots[0]!.slice(0, 10);
    const offer = await api().get(url('/bookings/slots')).query({ from: date, to: date });
    expect(offer.body.data.slots).toContain(slots[0]);
  });

  it('lets the client cancel, after which the booking is locked', async () => {
    const cancel = () =>
      api()
        .post(url(`/bookings/manage/${manageToken}/cancel`))
        .send({ reason: 'Plans changed' });

    expect((await cancel()).body.data.status).toBe('CANCELLED');
    expect((await cancel()).status).toBe(409);
    expect((await api().get(url('/bookings/manage/unknown-token-unknown-token'))).status).toBe(404);
  });

  it('allows the slot of a cancelled booking to be booked again', async () => {
    expect((await book(slots.at(-1)!)).status).toBe(201);
  });
});
