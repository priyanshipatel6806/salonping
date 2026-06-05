-- Add Stripe Connect account ID to booking_settings
ALTER TABLE booking_settings
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_connected boolean NOT NULL DEFAULT false;
