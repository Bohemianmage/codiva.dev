-- Terceros que operan fases de entrevista (no staff). Portal interviews.codiva.dev.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'interview-reports',
  'interview-reports',
  false,
  10485760,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE public.ops_recruiting_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ops_recruiting_partners_name_len_ck
    CHECK (char_length(trim(name)) BETWEEN 2 AND 200)
);

CREATE TABLE public.ops_recruiting_partner_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.ops_recruiting_partners(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'interviewer',
  active boolean NOT NULL DEFAULT true,
  terms_accepted_at timestamptz,
  terms_version text,
  privacy_accepted_at timestamptz,
  privacy_version text,
  nda_accepted_at timestamptz,
  nda_version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ops_recruiting_partner_members_role_ck
    CHECK (role IN ('coordinator', 'interviewer')),
  CONSTRAINT ops_recruiting_partner_members_name_len_ck
    CHECK (char_length(trim(full_name)) BETWEEN 1 AND 200),
  CONSTRAINT ops_recruiting_partner_members_user_uniq UNIQUE (user_id)
);

CREATE INDEX idx_ops_recruiting_partner_members_partner
  ON public.ops_recruiting_partner_members (partner_id, active);

CREATE TABLE public.ops_interview_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.ops_recruiting_partner_members(id) ON DELETE CASCADE,
  round_id uuid REFERENCES public.ops_job_interview_rounds(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.ops_job_applications(id) ON DELETE CASCADE,
  job_posting_id uuid REFERENCES public.ops_job_postings(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ops_interview_assignments_one_scope_ck CHECK (
    ((round_id IS NOT NULL)::integer
      + (application_id IS NOT NULL)::integer
      + (job_posting_id IS NOT NULL)::integer) = 1
  )
);

CREATE UNIQUE INDEX uq_ops_interview_assignments_round
  ON public.ops_interview_assignments (member_id, round_id)
  WHERE round_id IS NOT NULL;
CREATE UNIQUE INDEX uq_ops_interview_assignments_application
  ON public.ops_interview_assignments (member_id, application_id)
  WHERE application_id IS NOT NULL;
CREATE UNIQUE INDEX uq_ops_interview_assignments_job
  ON public.ops_interview_assignments (member_id, job_posting_id)
  WHERE job_posting_id IS NOT NULL;

CREATE INDEX idx_ops_interview_assignments_member
  ON public.ops_interview_assignments (member_id);

ALTER TABLE public.ops_job_interview_rounds
  ADD COLUMN IF NOT EXISTS partner_member_id uuid
    REFERENCES public.ops_recruiting_partner_members(id) ON DELETE SET NULL;

ALTER TABLE public.ops_job_interview_rounds
  DROP CONSTRAINT IF EXISTS ops_job_interview_rounds_one_interviewer_ck;
ALTER TABLE public.ops_job_interview_rounds
  ADD CONSTRAINT ops_job_interview_rounds_one_interviewer_ck
  CHECK (interviewer_id IS NULL OR partner_member_id IS NULL);

CREATE INDEX IF NOT EXISTS idx_ops_job_interview_rounds_partner_member
  ON public.ops_job_interview_rounds (partner_member_id);

ALTER TABLE public.ops_job_interview_comments
  DROP CONSTRAINT IF EXISTS ops_job_interview_comments_author_id_fkey;
ALTER TABLE public.ops_job_interview_comments
  ADD CONSTRAINT ops_job_interview_comments_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE TABLE public.ops_interview_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES public.ops_job_interview_rounds(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  original_filename text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ops_interview_reports_notes_len_ck
    CHECK (notes IS NULL OR char_length(notes) <= 4000),
  CONSTRAINT ops_interview_reports_filename_len_ck
    CHECK (original_filename IS NULL OR char_length(original_filename) <= 200)
);

CREATE INDEX idx_ops_interview_reports_round
  ON public.ops_interview_reports (round_id, created_at DESC);

COMMENT ON TABLE public.ops_recruiting_partners IS
  'Organizaciones externas que administran fases de entrevista.';
COMMENT ON TABLE public.ops_recruiting_partner_members IS
  'Personas invitadas desde Ops Equipo; login en interviews.codiva.dev.';
COMMENT ON TABLE public.ops_interview_assignments IS
  'Alcance de acceso: una fase, un candidato o una vacante.';
COMMENT ON TABLE public.ops_interview_reports IS
  'PDF de resultado subido por el tercero o por staff.';

CREATE OR REPLACE FUNCTION public.interview_partner_member_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id
  FROM ops_recruiting_partner_members m
  JOIN ops_recruiting_partners p ON p.id = m.partner_id
  WHERE m.user_id = auth.uid()
    AND m.active = true
    AND p.active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.interview_partner_can_read_application(app_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM ops_recruiting_partner_members m
    JOIN ops_recruiting_partners p ON p.id = m.partner_id
    JOIN ops_interview_assignments a ON a.member_id = m.id
    JOIN ops_job_applications app ON app.id = app_id
    LEFT JOIN ops_job_interview_rounds r ON r.id = a.round_id
    WHERE m.user_id = auth.uid()
      AND m.active = true
      AND p.active = true
      AND (
        a.application_id = app.id
        OR a.job_posting_id = app.job_posting_id
        OR r.application_id = app.id
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.interview_partner_can_write_round(target_round_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.interview_partner_can_read_application(
    (SELECT application_id FROM ops_job_interview_rounds WHERE id = target_round_id)
  );
$$;

REVOKE ALL ON FUNCTION public.interview_partner_member_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.interview_partner_member_id() FROM anon;
GRANT EXECUTE ON FUNCTION public.interview_partner_member_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.interview_partner_member_id() TO service_role;

REVOKE ALL ON FUNCTION public.interview_partner_can_read_application(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.interview_partner_can_read_application(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.interview_partner_can_read_application(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.interview_partner_can_read_application(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.interview_partner_can_write_round(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.interview_partner_can_write_round(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.interview_partner_can_write_round(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.interview_partner_can_write_round(uuid) TO service_role;

ALTER TABLE public.ops_recruiting_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_recruiting_partner_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_interview_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_interview_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_ops_recruiting_partners ON public.ops_recruiting_partners FOR ALL
  USING (public.is_admin_staff())
  WITH CHECK (public.is_admin_staff());

CREATE POLICY careers_select_ops_recruiting_partners ON public.ops_recruiting_partners FOR SELECT
  USING (public.is_careers_review_staff());

CREATE POLICY partner_select_own_ops_recruiting_partners ON public.ops_recruiting_partners FOR SELECT
  USING (
    id IN (
      SELECT partner_id FROM ops_recruiting_partner_members
      WHERE user_id = auth.uid() AND active = true
    )
  );

CREATE POLICY admin_all_ops_recruiting_partner_members ON public.ops_recruiting_partner_members FOR ALL
  USING (public.is_admin_staff())
  WITH CHECK (public.is_admin_staff());

CREATE POLICY careers_select_ops_recruiting_partner_members ON public.ops_recruiting_partner_members FOR SELECT
  USING (public.is_careers_review_staff());

CREATE POLICY partner_select_own_ops_recruiting_partner_members ON public.ops_recruiting_partner_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY partner_update_own_ops_recruiting_partner_members ON public.ops_recruiting_partner_members FOR UPDATE
  USING (user_id = auth.uid() AND active = true)
  WITH CHECK (user_id = auth.uid());

CREATE POLICY admin_all_ops_interview_assignments ON public.ops_interview_assignments FOR ALL
  USING (public.is_admin_staff())
  WITH CHECK (public.is_admin_staff());

CREATE POLICY careers_all_ops_interview_assignments ON public.ops_interview_assignments FOR ALL
  USING (public.is_careers_review_staff())
  WITH CHECK (public.is_careers_review_staff());

CREATE POLICY partner_select_own_ops_interview_assignments ON public.ops_interview_assignments FOR SELECT
  USING (member_id = public.interview_partner_member_id());

CREATE POLICY partner_select_ops_job_applications ON public.ops_job_applications FOR SELECT
  USING (public.interview_partner_can_read_application(id));

CREATE POLICY partner_select_ops_job_postings ON public.ops_job_postings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ops_job_applications app
      WHERE app.job_posting_id = ops_job_postings.id
        AND public.interview_partner_can_read_application(app.id)
    )
    OR EXISTS (
      SELECT 1 FROM ops_interview_assignments a
      WHERE a.job_posting_id = ops_job_postings.id
        AND a.member_id = public.interview_partner_member_id()
    )
  );

CREATE POLICY partner_select_ops_job_interview_rounds ON public.ops_job_interview_rounds FOR SELECT
  USING (public.interview_partner_can_read_application(application_id));

CREATE POLICY partner_update_ops_job_interview_rounds ON public.ops_job_interview_rounds FOR UPDATE
  USING (public.interview_partner_can_write_round(id))
  WITH CHECK (public.interview_partner_can_write_round(id));

CREATE POLICY partner_select_ops_job_interview_comments ON public.ops_job_interview_comments FOR SELECT
  USING (
    public.interview_partner_can_write_round(round_id)
  );

CREATE POLICY partner_insert_ops_job_interview_comments ON public.ops_job_interview_comments FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND public.interview_partner_can_write_round(round_id)
  );

CREATE POLICY admin_all_ops_interview_reports ON public.ops_interview_reports FOR ALL
  USING (public.is_admin_staff())
  WITH CHECK (public.is_admin_staff());

CREATE POLICY careers_select_ops_interview_reports ON public.ops_interview_reports FOR SELECT
  USING (public.is_careers_review_staff());

CREATE POLICY partner_select_ops_interview_reports ON public.ops_interview_reports FOR SELECT
  USING (public.interview_partner_can_write_round(round_id));

CREATE POLICY partner_insert_ops_interview_reports ON public.ops_interview_reports FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND public.interview_partner_can_write_round(round_id)
  );
