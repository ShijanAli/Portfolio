import { describe, expect, it } from 'vitest';
import { generateSlots, type SlotContext } from './booking.slots';

// Monday 2 March 2026, 00:00 in Dhaka (UTC+6).
const now = new Date('2026-03-01T18:00:00Z');

const context = (overrides: Partial<SlotContext> = {}): SlotContext => ({
  settings: {
    timezone: 'Asia/Dhaka',
    slotDuration: 30,
    bufferTime: 15,
    minNoticeHours: 0,
    maxDaysAhead: 30,
    maxPerDay: 4,
  },
  weekly: [{ dayOfWeek: 1, startTime: '10:00', endTime: '12:00', isActive: true }],
  exceptions: [],
  bookings: [],
  now,
  ...overrides,
});

const times = (slots: Date[]) => slots.map((slot) => slot.toISOString().slice(11, 16));
const MONDAY = '2026-03-02';

describe('generateSlots', () => {
  it('converts working hours from the owner timezone to UTC, leaving a buffer between slots', () => {
    // 10:00, 10:45 and 11:30 in Dhaka. A 12:15 slot would end after closing time.
    expect(times(generateSlots(context(), MONDAY, MONDAY))).toEqual(['04:00', '04:45', '05:30']);
  });

  it('offers nothing on days without working hours', () => {
    expect(generateSlots(context(), '2026-03-03', '2026-03-03')).toEqual([]);
  });

  it('skips inactive working hours', () => {
    const weekly = [{ dayOfWeek: 1, startTime: '10:00', endTime: '12:00', isActive: false }];
    expect(generateSlots(context({ weekly }), MONDAY, MONDAY)).toEqual([]);
  });

  it('removes slots that touch an existing booking or its buffer', () => {
    const bookings = [
      { startAt: new Date('2026-03-02T04:45:00Z'), endAt: new Date('2026-03-02T05:15:00Z') },
    ];
    expect(times(generateSlots(context({ bookings }), MONDAY, MONDAY))).toEqual(['04:00', '05:30']);
  });

  it('respects the minimum notice period', () => {
    const settings = { ...context().settings, minNoticeHours: 11 };
    // 11 hours after "now" is 05:00 UTC.
    expect(times(generateSlots(context({ settings }), MONDAY, MONDAY))).toEqual(['05:30']);
  });

  it('does not look further ahead than allowed', () => {
    const settings = { ...context().settings, maxDaysAhead: 5 };
    expect(generateSlots(context({ settings }), '2026-03-09', '2026-03-09')).toEqual([]);
  });

  it('closes a day once it is fully booked', () => {
    const settings = { ...context().settings, maxPerDay: 1 };
    const bookings = [
      { startAt: new Date('2026-03-02T08:00:00Z'), endAt: new Date('2026-03-02T08:30:00Z') },
    ];
    expect(generateSlots(context({ settings, bookings }), MONDAY, MONDAY)).toEqual([]);
  });

  it('blocks a day off and applies custom hours', () => {
    const dayOff = [
      { date: new Date(`${MONDAY}T00:00:00Z`), isOff: true, startTime: null, endTime: null },
    ];
    expect(generateSlots(context({ exceptions: dayOff }), MONDAY, MONDAY)).toEqual([]);

    const custom = [
      {
        date: new Date('2026-03-03T00:00:00Z'),
        isOff: false,
        startTime: '15:00',
        endTime: '15:30',
      },
    ];
    expect(
      times(generateSlots(context({ exceptions: custom }), '2026-03-03', '2026-03-03')),
    ).toEqual(['09:00']);
  });

  it('covers every day in a range, in order', () => {
    const slots = generateSlots(context(), MONDAY, '2026-03-09');
    expect(slots).toHaveLength(6);
    expect(slots[3]?.toISOString()).toBe('2026-03-09T04:00:00.000Z');
  });
});
