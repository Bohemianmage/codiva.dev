-- Correo de la bolsa (pruebas, hallazgos, CV), distinto del @codiva.dev de staff.
ALTER TABLE public.ops_personnel_offers
  ADD COLUMN IF NOT EXISTS career_email text;

CREATE INDEX IF NOT EXISTS idx_ops_personnel_offers_career_email
  ON public.ops_personnel_offers (lower(career_email))
  WHERE career_email IS NOT NULL;

COMMENT ON COLUMN public.ops_personnel_offers.career_email IS
  'Correo con el que la persona hizo la bolsa. Distinto del correo de acceso Ops.';

-- PM ya contratado que hizo la bolsa con otro correo.
UPDATE public.ops_personnel_offers
SET career_email = 'racmart00@gmail.com'
WHERE lower(trim(coalesce(email, ''))) = 'r.castillo@codiva.dev'
  AND career_email IS NULL;
