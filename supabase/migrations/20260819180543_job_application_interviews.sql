-- Fases de entrevista por postulación y comentarios append-only del entrevistador.

CREATE TABLE public.ops_job_interview_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.ops_job_applications(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  kind text NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'planned',
  outcome text,
  interviewer_id uuid REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  scheduled_at timestamptz,
  conducted_at timestamptz,
  created_by uuid REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ops_job_interview_rounds_kind_ck
    CHECK (kind = ANY (ARRAY['screening'::text, 'technical'::text, 'culture'::text, 'final'::text, 'other'::text])),
  CONSTRAINT ops_job_interview_rounds_status_ck
    CHECK (status = ANY (ARRAY['planned'::text, 'done'::text, 'skipped'::text])),
  CONSTRAINT ops_job_interview_rounds_outcome_ck
    CHECK (outcome IS NULL OR outcome = ANY (ARRAY['advance'::text, 'hold'::text, 'reject'::text])),
  CONSTRAINT ops_job_interview_rounds_title_len_ck
    CHECK (char_length(trim(title)) BETWEEN 1 AND 120)
);

CREATE TABLE public.ops_job_interview_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES public.ops_job_interview_rounds(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ops_job_interview_comments_body_len_ck
    CHECK (char_length(trim(body)) BETWEEN 1 AND 4000)
);

CREATE INDEX idx_ops_job_interview_rounds_application
  ON public.ops_job_interview_rounds (application_id, sort_order, created_at);
CREATE INDEX idx_ops_job_interview_rounds_interviewer
  ON public.ops_job_interview_rounds (interviewer_id);
CREATE INDEX idx_ops_job_interview_rounds_created_by
  ON public.ops_job_interview_rounds (created_by);
CREATE INDEX idx_ops_job_interview_comments_round
  ON public.ops_job_interview_comments (round_id, created_at);
CREATE INDEX idx_ops_job_interview_comments_author
  ON public.ops_job_interview_comments (author_id);

CREATE TRIGGER ops_job_interview_rounds_updated_at
  BEFORE UPDATE ON public.ops_job_interview_rounds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.ops_job_interview_rounds IS
  'Fases de entrevista de una postulación; el estado de la postulación sigue siendo el semáforo.';
COMMENT ON TABLE public.ops_job_interview_comments IS
  'Notas append-only del entrevistador o de quien gestiona el equipo.';

ALTER TABLE public.ops_job_interview_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_job_interview_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_ops_job_interview_rounds ON public.ops_job_interview_rounds FOR ALL
  USING (public.is_admin_staff())
  WITH CHECK (public.is_admin_staff());

CREATE POLICY careers_review_select_ops_job_interview_rounds ON public.ops_job_interview_rounds FOR SELECT
  USING (public.is_careers_review_staff());

CREATE POLICY careers_review_insert_ops_job_interview_rounds ON public.ops_job_interview_rounds FOR INSERT
  WITH CHECK (public.is_careers_review_staff());

CREATE POLICY careers_review_update_ops_job_interview_rounds ON public.ops_job_interview_rounds FOR UPDATE
  USING (public.is_careers_review_staff())
  WITH CHECK (public.is_careers_review_staff());

CREATE POLICY careers_review_delete_ops_job_interview_rounds ON public.ops_job_interview_rounds FOR DELETE
  USING (public.is_careers_review_staff());

CREATE POLICY admin_select_ops_job_interview_comments ON public.ops_job_interview_comments FOR SELECT
  USING (public.is_admin_staff());

CREATE POLICY admin_insert_ops_job_interview_comments ON public.ops_job_interview_comments FOR INSERT
  WITH CHECK (public.is_admin_staff() AND author_id = (SELECT auth.uid()));

CREATE POLICY careers_review_select_ops_job_interview_comments ON public.ops_job_interview_comments FOR SELECT
  USING (public.is_careers_review_staff());

CREATE POLICY careers_review_insert_ops_job_interview_comments ON public.ops_job_interview_comments FOR INSERT
  WITH CHECK (public.is_careers_review_staff() AND author_id = (SELECT auth.uid()));
