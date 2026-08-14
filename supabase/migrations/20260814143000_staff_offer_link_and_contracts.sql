-- Vincular carta oferta al integrante y contratos firmados de staff.
-- El integrante puede leer su propia oferta y su contrato; el alta sigue siendo admin.

ALTER TABLE ops_personnel_offers
  ADD COLUMN IF NOT EXISTS staff_id uuid REFERENCES staff_profiles(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ops_personnel_offers_staff_id_uidx
  ON ops_personnel_offers (staff_id)
  WHERE staff_id IS NOT NULL;

COMMENT ON COLUMN ops_personnel_offers.staff_id IS
  'Integrante de Ops al que pertenece esta carta oferta, cuando ya fue dado de alta.';

CREATE TABLE IF NOT EXISTS ops_staff_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  offer_id uuid REFERENCES ops_personnel_offers(id) ON DELETE SET NULL,
  file_path text NOT NULL,
  original_filename text NOT NULL DEFAULT '',
  signed_at date NOT NULL DEFAULT CURRENT_DATE,
  uploaded_by uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ops_staff_contracts_staff
  ON ops_staff_contracts (staff_id, created_at DESC);

COMMENT ON TABLE ops_staff_contracts IS
  'Contrato laboral/colaboración firmado. Visible al integrante dueño y a admin.';

ALTER TABLE ops_staff_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all_ops_staff_contracts ON ops_staff_contracts;
CREATE POLICY admin_all_ops_staff_contracts ON ops_staff_contracts FOR ALL
  USING (public.is_admin_staff())
  WITH CHECK (public.is_admin_staff());

DROP POLICY IF EXISTS staff_read_own_ops_staff_contracts ON ops_staff_contracts;
CREATE POLICY staff_read_own_ops_staff_contracts ON ops_staff_contracts FOR SELECT
  USING (staff_id = auth.uid());

DROP POLICY IF EXISTS staff_read_own_personnel_offer ON ops_personnel_offers;
CREATE POLICY staff_read_own_personnel_offer ON ops_personnel_offers FOR SELECT
  USING (staff_id = auth.uid());

-- Cotizaciones y cargos: staff puede leer (p. ej. vista previa del portal);
-- solo admin escribe. El PM no tiene capability quotes/charges en Ops.
DROP POLICY IF EXISTS staff_all_quotes ON quotes;
DROP POLICY IF EXISTS staff_read_quotes ON quotes;
CREATE POLICY staff_read_quotes ON quotes FOR SELECT
  USING (public.is_staff());

DROP POLICY IF EXISTS admin_write_quotes ON quotes;
CREATE POLICY admin_write_quotes ON quotes FOR ALL
  USING (public.is_admin_staff())
  WITH CHECK (public.is_admin_staff());

DROP POLICY IF EXISTS staff_all_project_charges ON project_charges;
DROP POLICY IF EXISTS staff_read_project_charges ON project_charges;
CREATE POLICY staff_read_project_charges ON project_charges FOR SELECT
  USING (public.is_staff());

DROP POLICY IF EXISTS admin_write_project_charges ON project_charges;
CREATE POLICY admin_write_project_charges ON project_charges FOR ALL
  USING (public.is_admin_staff())
  WITH CHECK (public.is_admin_staff());
