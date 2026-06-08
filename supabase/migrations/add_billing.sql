-- Billing / invoices table
CREATE TABLE IF NOT EXISTS bills (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id        uuid        NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  appointment_id  uuid        REFERENCES appointments(id),
  client_name     text        NOT NULL,
  client_phone    text        NOT NULL,
  services        jsonb       NOT NULL DEFAULT '[]',
  subtotal        integer     NOT NULL DEFAULT 0,
  deposit_paid    integer     NOT NULL DEFAULT 0,
  total_due       integer     NOT NULL DEFAULT 0,
  status          text        NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid')),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bills_salon_id_idx      ON bills(salon_id);
CREATE INDEX IF NOT EXISTS bills_appointment_id_idx ON bills(appointment_id);
CREATE INDEX IF NOT EXISTS bills_created_at_idx     ON bills(created_at DESC);
