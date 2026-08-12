-- Bolsa de trabajo Codiva.dev: vacantes en /empleos, gestión en Ops Equipo, CVs privados.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-application-cvs',
  'job-application-cvs',
  false,
  10485760,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

CREATE TYPE job_posting_status AS ENUM ('draft', 'published', 'closed');
CREATE TYPE job_employment_type AS ENUM ('full_time', 'part_time', 'contract', 'internship');
CREATE TYPE job_application_status AS ENUM ('new', 'reviewed', 'hired', 'rejected');

CREATE TABLE ops_job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  requirements text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  employment_type job_employment_type,
  status job_posting_status NOT NULL DEFAULT 'draft',
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_by uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ops_job_postings_slug_format_ck CHECK (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    AND char_length(trim(slug)) BETWEEN 2 AND 120
  ),
  CONSTRAINT ops_job_postings_title_len_ck CHECK (char_length(trim(title)) BETWEEN 2 AND 300)
);

CREATE UNIQUE INDEX uq_ops_job_postings_slug
  ON ops_job_postings (lower(trim(slug)));

CREATE INDEX idx_ops_job_postings_public
  ON ops_job_postings (status, sort_order, published_at DESC NULLS LAST)
  WHERE status = 'published';

CREATE INDEX idx_ops_job_postings_admin
  ON ops_job_postings (status, updated_at DESC);

CREATE TRIGGER ops_job_postings_updated_at
  BEFORE UPDATE ON ops_job_postings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE ops_job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id uuid NOT NULL REFERENCES ops_job_postings(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  cover_letter text,
  cv_storage_path text NOT NULL,
  original_filename text,
  consent_data_at timestamptz NOT NULL,
  consent_terms_at timestamptz NOT NULL,
  ip_hash text,
  status job_application_status NOT NULL DEFAULT 'new',
  personnel_offer_id uuid REFERENCES ops_personnel_offers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ops_job_applications_email_len_ck CHECK (char_length(trim(email)) BETWEEN 3 AND 320),
  CONSTRAINT ops_job_applications_name_len_ck CHECK (char_length(trim(full_name)) BETWEEN 1 AND 200)
);

CREATE INDEX idx_ops_job_applications_by_job
  ON ops_job_applications (job_posting_id, created_at DESC);

CREATE INDEX idx_ops_job_applications_dedupe
  ON ops_job_applications (job_posting_id, lower(trim(email)), created_at DESC);

CREATE INDEX idx_ops_job_applications_status
  ON ops_job_applications (status, created_at DESC);

COMMENT ON TABLE ops_job_postings IS 'Vacantes de la bolsa pública /empleos; gestión en Ops Equipo.';
COMMENT ON TABLE ops_job_applications IS 'Postulaciones con CV en bucket job-application-cvs.';

ALTER TABLE ops_job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_ops_job_postings ON ops_job_postings FOR ALL
  USING (public.is_admin_staff())
  WITH CHECK (public.is_admin_staff());

CREATE POLICY admin_all_ops_job_applications ON ops_job_applications FOR ALL
  USING (public.is_admin_staff())
  WITH CHECK (public.is_admin_staff());
