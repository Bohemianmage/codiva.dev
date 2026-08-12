-- Time entries for internal delivery tracking
CREATE TABLE time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sprint_item_id uuid REFERENCES sprint_items(id) ON DELETE SET NULL,
  staff_id uuid NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  hours numeric(8, 2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  worked_on date NOT NULL DEFAULT (CURRENT_DATE),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_time_entries_project ON time_entries(project_id, worked_on DESC);
CREATE INDEX idx_time_entries_staff ON time_entries(staff_id, worked_on DESC);
CREATE INDEX idx_time_entries_sprint_item ON time_entries(sprint_item_id);

CREATE TRIGGER time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_all_time_entries ON time_entries FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());
