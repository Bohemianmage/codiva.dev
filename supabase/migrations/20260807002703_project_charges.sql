-- Cargos / pagos del proyecto: desarrollo + pass-through (hosting, dominios, etc.).
-- Política: hosting/dominio/pass_through van a cargo del cliente cuando aplican.

CREATE TYPE charge_kind AS ENUM (
  'development',
  'hosting',
  'domain',
  'pass_through',
  'other'
);

CREATE TYPE charge_status AS ENUM (
  'pending',
  'paid',
  'overdue',
  'waived'
);

CREATE TABLE project_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  kind charge_kind NOT NULL DEFAULT 'development',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  amount numeric,
  currency text NOT NULL DEFAULT 'MXN',
  status charge_status NOT NULL DEFAULT 'pending',
  due_date date,
  paid_at timestamptz,
  period_label text,
  sort_order int NOT NULL DEFAULT 0,
  visible_to_client boolean NOT NULL DEFAULT true,
  staff_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_charges_amount_nonneg CHECK (amount IS NULL OR amount >= 0)
);

CREATE INDEX project_charges_project_idx
  ON project_charges (project_id, sort_order, status);

COMMENT ON TABLE project_charges IS
  'Calendario de cobros: honorarios de desarrollo y gastos a cargo del cliente (hosting, dominio, pass-through).';
COMMENT ON COLUMN project_charges.amount IS
  'NULL = monto por confirmar (p. ej. hosting facturado al costo real).';
COMMENT ON COLUMN project_charges.kind IS
  'hosting/domain/pass_through: siempre a cargo del cliente cuando aplican; development = honorarios Codiva.';
COMMENT ON COLUMN project_charges.staff_notes IS
  'Notas internas; no se exponen al portal.';

ALTER TABLE project_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_all_project_charges ON project_charges FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY client_read_project_charges ON project_charges FOR SELECT
  USING (
    visible_to_client = true
    AND project_id IN (SELECT public.client_project_ids())
  );
