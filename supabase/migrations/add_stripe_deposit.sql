-- Add deposit amount to booking_settings
ALTER TABLE booking_settings
  ADD COLUMN IF NOT EXISTS stripe_deposit_amount integer NOT NULL DEFAULT 0;

-- Add deposit tracking and cancel token to appointments
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS deposit_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancel_token uuid DEFAULT gen_random_uuid();

-- Make cancel_token unique for safe lookups
CREATE UNIQUE INDEX IF NOT EXISTS appointments_cancel_token_idx ON appointments(cancel_token);
