-- Alta de personal de operaciones: cartas oferta / ofertas de colaboración
CREATE TYPE personnel_offer_status AS ENUM (
  'draft',
  'sent',
  'accepted',
  'declined',
  'withdrawn'
);

CREATE TYPE personnel_work_modality AS ENUM (
  'remote',
  'hybrid',
  'onsite'
);

CREATE TABLE ops_personnel_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  position_title text NOT NULL,
  ops_role staff_role NOT NULL DEFAULT 'pm',
  monthly_compensation numeric(12, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  work_modality personnel_work_modality NOT NULL DEFAULT 'remote',
  start_date date,
  valid_until date,
  responsibilities text NOT NULL DEFAULT '',
  terms text NOT NULL DEFAULT '',
  notes_internal text NOT NULL DEFAULT '',
  status personnel_offer_status NOT NULL DEFAULT 'draft',
  issued_at date NOT NULL DEFAULT (CURRENT_DATE),
  created_by uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ops_personnel_offers_status ON ops_personnel_offers(status);
CREATE INDEX idx_ops_personnel_offers_created_at ON ops_personnel_offers(created_at DESC);

CREATE TRIGGER ops_personnel_offers_updated_at
  BEFORE UPDATE ON ops_personnel_offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_admin_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE id = auth.uid() AND active = true AND role = 'admin'
  );
$$;

ALTER TABLE ops_personnel_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_ops_personnel_offers ON ops_personnel_offers FOR ALL
  USING (public.is_admin_staff())
  WITH CHECK (public.is_admin_staff());
