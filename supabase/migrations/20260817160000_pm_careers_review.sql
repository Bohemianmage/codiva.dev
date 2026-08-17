-- PMs can review tester applications, assessments, and hunt findings.

CREATE OR REPLACE FUNCTION public.is_careers_review_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE id = auth.uid() AND active = true AND role IN ('admin', 'pm')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_careers_review_staff() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_careers_review_staff() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_careers_review_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_careers_review_staff() TO service_role;

CREATE POLICY careers_review_select_ops_job_postings ON ops_job_postings FOR SELECT
  USING (public.is_careers_review_staff());

CREATE POLICY careers_review_select_ops_job_applications ON ops_job_applications FOR SELECT
  USING (public.is_careers_review_staff());

CREATE POLICY careers_review_update_ops_job_applications ON ops_job_applications FOR UPDATE
  USING (public.is_careers_review_staff())
  WITH CHECK (public.is_careers_review_staff());

CREATE POLICY careers_review_select_ops_job_assessment_attempts ON ops_job_assessment_attempts FOR SELECT
  USING (public.is_careers_review_staff());

CREATE POLICY careers_review_select_ops_job_assessment_events ON ops_job_assessment_events FOR SELECT
  USING (public.is_careers_review_staff());

CREATE POLICY careers_review_select_ops_hunt_reports ON ops_hunt_reports FOR SELECT
  USING (public.is_careers_review_staff());

CREATE POLICY careers_review_update_ops_hunt_reports ON ops_hunt_reports FOR UPDATE
  USING (public.is_careers_review_staff())
  WITH CHECK (public.is_careers_review_staff());

CREATE POLICY careers_review_select_ops_hunt_events ON ops_hunt_events FOR SELECT
  USING (public.is_careers_review_staff());
