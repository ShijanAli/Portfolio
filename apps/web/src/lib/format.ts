const monthYear = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' });
const longDate = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric' });

export const formatMonthYear = (iso: string) => monthYear.format(new Date(iso));
export const formatLongDate = (iso: string) => longDate.format(new Date(iso));

/** "Jan 2022 – Present" */
export const formatPeriod = (start: string, end: string | null, isCurrent: boolean) =>
  `${formatMonthYear(start)} – ${isCurrent || !end ? 'Present' : formatMonthYear(end)}`;

/** Whole years between a date and now, at least 1. */
export const yearsSince = (iso: string) =>
  Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / (365.25 * 24 * 60 * 60 * 1000)));

export const formatPrice = (amount: string | number, currency: string) =>
  new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
    Number(amount),
  );
