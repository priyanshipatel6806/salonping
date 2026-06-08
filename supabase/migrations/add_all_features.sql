-- ============================================================
-- SalonPing — all new features migration
-- ============================================================

-- 1. Appointment notes + reschedule token + tip + payment
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS notes           text,
  ADD COLUMN IF NOT EXISTS tip_amount      integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status  text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid')),
  ADD COLUMN IF NOT EXISTS payment_method  text CHECK (payment_method IN ('cash','card','stripe','other')),
  ADD COLUMN IF NOT EXISTS reschedule_token uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS staff_id        uuid,
  ADD COLUMN IF NOT EXISTS recurrence_id   uuid,
  ADD COLUMN IF NOT EXISTS recurrence_rule text;

CREATE UNIQUE INDEX IF NOT EXISTS appointments_reschedule_token_idx ON appointments(reschedule_token);

-- 2. Service categories
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'General';

-- 3. Client profile notes + birthday
-- We derive clients from appointments so we store extras in a separate table
CREATE TABLE IF NOT EXISTS client_profiles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id    uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  phone       text NOT NULL,
  notes       text,
  birthday    date,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(salon_id, phone)
);
CREATE INDEX IF NOT EXISTS client_profiles_salon_phone_idx ON client_profiles(salon_id, phone);

-- 4. Staff members
CREATE TABLE IF NOT EXISTS staff_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id    uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name        text NOT NULL,
  role        text NOT NULL DEFAULT 'Stylist',
  phone       text,
  email       text,
  color       text NOT NULL DEFAULT '#c9a84c',
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS staff_members_salon_id_idx ON staff_members(salon_id);

-- 5. Blocked times (vacation / breaks)
CREATE TABLE IF NOT EXISTS blocked_times (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id     uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  label        text NOT NULL DEFAULT 'Blocked',
  start_date   date NOT NULL,
  end_date     date NOT NULL,
  start_time   time,
  end_time     time,
  repeat_weekly boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS blocked_times_salon_id_idx ON blocked_times(salon_id);

-- 6. Waitlist
CREATE TABLE IF NOT EXISTS waitlist (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id     uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_name  text NOT NULL,
  client_phone text NOT NULL,
  client_email text,
  service      text NOT NULL,
  preferred_date date,
  reminder_channel text NOT NULL DEFAULT 'sms',
  notified     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS waitlist_salon_id_idx ON waitlist(salon_id);
CREATE INDEX IF NOT EXISTS waitlist_created_at_idx ON waitlist(created_at DESC);

-- 7. Loyalty points
CREATE TABLE IF NOT EXISTS loyalty_points (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id        uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_phone    text NOT NULL,
  client_name     text NOT NULL,
  points          integer NOT NULL DEFAULT 0,
  total_earned    integer NOT NULL DEFAULT 0,
  total_redeemed  integer NOT NULL DEFAULT 0,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(salon_id, client_phone)
);
CREATE INDEX IF NOT EXISTS loyalty_points_salon_phone_idx ON loyalty_points(salon_id, client_phone);

-- 8. Loyalty transactions log
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id     uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_phone text NOT NULL,
  appointment_id uuid REFERENCES appointments(id),
  type         text NOT NULL CHECK (type IN ('earn','redeem','adjust')),
  points       integer NOT NULL,
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS loyalty_tx_salon_phone_idx ON loyalty_transactions(salon_id, client_phone);

-- 9. Gallery photos
CREATE TABLE IF NOT EXISTS gallery_photos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id   uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  url        text NOT NULL,
  caption    text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gallery_photos_salon_id_idx ON gallery_photos(salon_id);

-- 10. Intake form questions (per salon)
CREATE TABLE IF NOT EXISTS intake_questions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id   uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  question   text NOT NULL,
  required   boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  active     boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS intake_questions_salon_id_idx ON intake_questions(salon_id);

-- 11. Intake answers (per appointment)
CREATE TABLE IF NOT EXISTS intake_answers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  question       text NOT NULL,
  answer         text,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS intake_answers_appointment_id_idx ON intake_answers(appointment_id);

-- 12. Loyalty settings on booking_settings
ALTER TABLE booking_settings
  ADD COLUMN IF NOT EXISTS loyalty_enabled      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS loyalty_points_per_visit integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS loyalty_redeem_threshold integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS loyalty_redeem_discount  integer NOT NULL DEFAULT 10;

-- 13. Waitlist enabled flag on booking_settings
ALTER TABLE booking_settings
  ADD COLUMN IF NOT EXISTS waitlist_enabled boolean NOT NULL DEFAULT false;

-- 14. Birthday SMS enabled flag
ALTER TABLE booking_settings
  ADD COLUMN IF NOT EXISTS birthday_sms_enabled boolean NOT NULL DEFAULT false;
