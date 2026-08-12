-- Staff assignment to projects + internal sprints

CREATE TABLE project_staff (
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  role_on_project text NOT NULL DEFAULT 'member'
    CHECK (role_on_project IN ('pm', 'dev', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, staff_id)
);

CREATE INDEX idx_project_staff_staff ON project_staff(staff_id);

CREATE TYPE sprint_status AS ENUM ('planned', 'active', 'completed');
CREATE TYPE sprint_item_status AS ENUM ('todo', 'in_progress', 'done', 'blocked');

CREATE TABLE project_sprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  goal text NOT NULL DEFAULT '',
  starts_on date,
  ends_on date,
  status sprint_status NOT NULL DEFAULT 'planned',
  created_by uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_sprints_project ON project_sprints(project_id, status);

CREATE TABLE sprint_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id uuid NOT NULL REFERENCES project_sprints(id) ON DELETE CASCADE,
  title text NOT NULL,
  details text NOT NULL DEFAULT '',
  status sprint_item_status NOT NULL DEFAULT 'todo',
  assignee_id uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sprint_items_sprint ON sprint_items(sprint_id, sort_order);
CREATE INDEX idx_sprint_items_assignee ON sprint_items(assignee_id);

CREATE TRIGGER project_sprints_updated_at
  BEFORE UPDATE ON project_sprints
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER sprint_items_updated_at
  BEFORE UPDATE ON sprint_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE project_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_all_project_staff ON project_staff FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY staff_all_project_sprints ON project_sprints FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY staff_all_sprint_items ON sprint_items FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- Backfill: assign all active staff to all existing projects as members
INSERT INTO project_staff (project_id, staff_id, role_on_project)
SELECT p.id, s.id,
  CASE
    WHEN s.role = 'pm' THEN 'pm'
    WHEN s.role = 'dev' THEN 'dev'
    ELSE 'member'
  END
FROM projects p
CROSS JOIN staff_profiles s
WHERE s.active = true
ON CONFLICT DO NOTHING;
