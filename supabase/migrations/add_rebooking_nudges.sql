-- Table to track rebooking nudges sent (prevents re-nudging within 30 days)
CREATE TABLE IF NOT EXISTS rebooking_nudges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_phone text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rebooking_nudges_salon_phone_idx ON rebooking_nudges(salon_id, client_phone);
CREATE INDEX IF NOT EXISTS rebooking_nudges_sent_at_idx ON rebooking_nudges(sent_at);
