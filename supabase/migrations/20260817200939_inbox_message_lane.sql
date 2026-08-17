-- Segment contact-form noise (hunt/QA) from commercial inquiries.

DO $$ BEGIN
  CREATE TYPE inbox_lane AS ENUM ('real', 'test', 'other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE inbox_messages
  ADD COLUMN IF NOT EXISTS lane inbox_lane NOT NULL DEFAULT 'real',
  ADD COLUMN IF NOT EXISTS lane_reason text;

COMMENT ON COLUMN inbox_messages.lane IS
  'real = commercial contact; test = hunt/QA/internal noise; other = candidate or unclear.';
COMMENT ON COLUMN inbox_messages.lane_reason IS
  'Classifier or staff reason: hunt_session, internal, junk_content, junk_identity, candidate, default, manual.';

CREATE INDEX IF NOT EXISTS idx_inbox_lane_status
  ON inbox_messages (lane, status, created_at DESC);

-- Existing junk submissions (punctuation-only, digits-only, or gibberish identity).
UPDATE inbox_messages
SET
  lane = 'test',
  lane_reason = 'junk_content'
WHERE lane = 'real'
  AND (
    length(regexp_replace(trim(message), '[^[:alpha:]]', '', 'g'))::numeric
      / greatest(length(trim(message)), 1) < 0.35
    OR trim(message) ~ '^[[:digit:][:space:][:punct:]]+$'
    OR (
      position(' ' in trim(name)) = 0
      AND length(trim(name)) <= 16
      AND length(regexp_replace(lower(trim(name)), '[^aeiouáéíóúü]', '', 'g'))::numeric
        / greatest(length(trim(name)), 1) < 0.28
    )
  );

UPDATE inbox_messages m
SET
  lane = 'other',
  lane_reason = 'candidate'
WHERE m.lane = 'real'
  AND lower(m.email) IN (
    SELECT lower(email) FROM ops_job_applications
    UNION
    SELECT lower(email) FROM ops_hunt_reports
  );
