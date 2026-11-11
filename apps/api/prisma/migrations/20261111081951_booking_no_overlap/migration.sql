-- Two active bookings can never overlap in time. Enforced by the database, so it holds
-- even when two visitors submit the same slot at the same moment.
-- (Exclusion constraints cannot be expressed in the Prisma schema.)
ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_no_overlap"
  EXCLUDE USING gist (tsrange("startAt", "endAt") WITH &&)
  WHERE (status IN ('PENDING', 'CONFIRMED'));
