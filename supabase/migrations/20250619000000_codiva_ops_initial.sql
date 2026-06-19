-- Codiva Ops — schema inicial (public + RLS)
-- Aplicar con: supabase db push  o  Supabase Dashboard SQL Editor
-- Luego ejecutar: 20250619000001_codiva_ops_storage.sql (requiere schema storage de Supabase)

-- Enums
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'converted', 'discarded');
CREATE TYPE lead_source AS ENUM ('web_cotiza', 'referral', 'manual', 'contact_form');
CREATE TYPE inbox_status AS ENUM ('unread', 'read', 'replied', 'archived');
CREATE TYPE project_status AS ENUM ('draft', 'quoting', 'active', 'paused', 'delivered', 'archived');
CREATE TYPE member_role AS ENUM ('viewer', 'approver');
CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired');
CREATE TYPE milestone_status AS ENUM ('pending', 'in_progress', 'completed', 'blocked');
CREATE TYPE document_type AS ENUM ('contract', 'nda', 'proposal_pdf', 'other');
CREATE TYPE ticket_status AS ENUM ('new', 'in_progress', 'waiting_client', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('alta', 'media', 'baja');
CREATE TYPE staff_role AS ENUM ('admin', 'pm', 'dev');

-- Staff profiles (linked to auth.users)
CREATE TABLE staff_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role staff_role NOT NULL DEFAULT 'admin',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Organizations (client companies)
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  contact_email text,
  contact_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Leads
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status lead_status NOT NULL DEFAULT 'new',
  source lead_source NOT NULL DEFAULT 'web_cotiza',
  name text NOT NULL,
  company text NOT NULL DEFAULT '',
  email text NOT NULL,
  phone text DEFAULT '',
  need text DEFAULT '',
  sections jsonb DEFAULT '[]'::jsonb,
  functionalities jsonb DEFAULT '[]'::jsonb,
  has_content text,
  has_domain text,
  has_hosting text,
  delivery_date date,
  budget numeric,
  reference_site text,
  assigned_to uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  converted_project_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Inbox messages
CREATE TABLE inbox_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  status inbox_status NOT NULL DEFAULT 'unread',
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Projects
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  status project_status NOT NULL DEFAULT 'draft',
  description text DEFAULT '',
  start_date date,
  target_delivery_date date,
  delivered_at timestamptz,
  progress_percent int NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  client_visible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE leads
  ADD CONSTRAINT leads_converted_project_id_fkey
  FOREIGN KEY (converted_project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- Project members (client access)
CREATE TABLE project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'viewer',
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE (project_id, user_id)
);

-- Quotes
CREATE TABLE quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version int NOT NULL DEFAULT 1,
  status quote_status NOT NULL DEFAULT 'draft',
  title text NOT NULL DEFAULT 'Propuesta comercial',
  scope text DEFAULT '',
  phases jsonb DEFAULT '[]'::jsonb,
  total_amount numeric,
  currency text NOT NULL DEFAULT 'USD',
  valid_until date,
  sent_at timestamptz,
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, version)
);

-- Milestones
CREATE TABLE milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  status milestone_status NOT NULL DEFAULT 'pending',
  sort_order int NOT NULL DEFAULT 0,
  due_date date,
  completed_at timestamptz,
  visible_to_client boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE milestone_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id uuid NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Documents
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type document_type NOT NULL DEFAULT 'other',
  title text NOT NULL,
  file_path text NOT NULL,
  file_url text,
  signed boolean NOT NULL DEFAULT false,
  visible_to_client boolean NOT NULL DEFAULT false,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

-- Deliverables
CREATE TABLE deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  url text,
  file_path text,
  file_url text,
  visible_to_client boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tickets
CREATE TABLE tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status ticket_status NOT NULL DEFAULT 'new',
  priority ticket_priority NOT NULL DEFAULT 'media',
  reporter_name text NOT NULL,
  reporter_email text NOT NULL,
  incident_time time,
  assigned_to uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ticket_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL DEFAULT 'attachment',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Activity log
CREATE TABLE activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_milestones_project ON milestones(project_id, sort_order);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_inbox_status ON inbox_messages(status);
CREATE INDEX idx_activity_entity ON activity_log(entity_type, entity_id);

-- Helper functions (security definer in private schema pattern — use public with care)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE id = auth.uid() AND active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.client_project_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT project_id FROM project_members WHERE user_id = auth.uid();
$$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER milestones_updated_at BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Staff policies
CREATE POLICY staff_all_staff_profiles ON staff_profiles FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY staff_all_organizations ON organizations FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY staff_all_leads ON leads FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY staff_all_inbox ON inbox_messages FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY staff_all_projects ON projects FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY staff_all_members ON project_members FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY staff_all_quotes ON quotes FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY staff_all_milestones ON milestones FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY staff_all_milestone_updates ON milestone_updates FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY staff_all_documents ON documents FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY staff_all_deliverables ON deliverables FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY staff_all_tickets ON tickets FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY staff_all_ticket_attachments ON ticket_attachments FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY staff_all_activity ON activity_log FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- Client read policies
CREATE POLICY client_read_projects ON projects FOR SELECT
  USING (
    client_visible = true
    AND id IN (SELECT public.client_project_ids())
  );

CREATE POLICY client_read_members ON project_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY client_read_quotes ON quotes FOR SELECT
  USING (
    status IN ('sent', 'accepted', 'rejected', 'expired')
    AND project_id IN (SELECT public.client_project_ids())
  );

CREATE POLICY client_update_quotes ON quotes FOR UPDATE
  USING (
    status = 'sent'
    AND project_id IN (SELECT public.client_project_ids())
  )
  WITH CHECK (
    status IN ('accepted', 'rejected')
    AND project_id IN (SELECT public.client_project_ids())
  );

CREATE POLICY client_read_milestones ON milestones FOR SELECT
  USING (
    visible_to_client = true
    AND project_id IN (SELECT public.client_project_ids())
  );

CREATE POLICY client_read_milestone_updates ON milestone_updates FOR SELECT
  USING (
    milestone_id IN (
      SELECT id FROM milestones
      WHERE visible_to_client = true
        AND project_id IN (SELECT public.client_project_ids())
    )
  );

CREATE POLICY client_read_documents ON documents FOR SELECT
  USING (
    visible_to_client = true
    AND project_id IN (SELECT public.client_project_ids())
  );

CREATE POLICY client_read_deliverables ON deliverables FOR SELECT
  USING (
    visible_to_client = true
    AND project_id IN (SELECT public.client_project_ids())
  );

CREATE POLICY client_read_tickets ON tickets FOR SELECT
  USING (project_id IN (SELECT public.client_project_ids()));

CREATE POLICY client_insert_tickets ON tickets FOR INSERT
  WITH CHECK (project_id IN (SELECT public.client_project_ids()));

CREATE POLICY client_read_ticket_attachments ON ticket_attachments FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE project_id IN (SELECT public.client_project_ids())
    )
  );

-- Storage: ver migración 20250619000001_codiva_ops_storage.sql
