-- Função SQL RPC para calcular a porcentagem de match entre as vagas e o perfil de CV mais recente do usuário
CREATE OR REPLACE FUNCTION get_jobs_with_match()
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  company_id UUID,
  contract_type TEXT,
  modality TEXT,
  location TEXT,
  salary_min NUMERIC,
  salary_max NUMERIC,
  currency TEXT,
  score NUMERIC,
  status TEXT,
  required_stack TEXT[],
  sources JSONB,
  gig_date DATE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  company JSONB,
  match_percentage NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  latest_cv VECTOR(1536);
BEGIN
  -- Qualificar p.created_at para eliminar ambiguidade com o parâmetro de retorno
  SELECT p.cv_embedding INTO latest_cv
  FROM public.user_profiles p
  WHERE p.cv_embedding IS NOT NULL
  ORDER BY p.created_at DESC
  LIMIT 1;

  IF latest_cv IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      j.id,
      j.title,
      j.description,
      j.company_id,
      j.contract_type,
      j.modality,
      j.location,
      j.salary_min,
      j.salary_max,
      j.currency,
      j.score,
      j.status,
      j.required_stack,
      j.sources,
      j.gig_date,
      j.created_at,
      j.updated_at,
      jsonb_build_object('name', COALESCE(c.name, 'Empresa Confidencial'), 'logo_url', c.logo_url) AS company,
      ROUND((CAST(1 - (COALESCE(j.description_embedding, latest_cv) <=> latest_cv) AS NUMERIC) * 100), 1) AS match_percentage
    FROM public.jobs j
    LEFT JOIN public.companies c ON c.id = j.company_id
    ORDER BY match_percentage DESC;
  ELSE
    RETURN QUERY
    SELECT 
      j.id,
      j.title,
      j.description,
      j.company_id,
      j.contract_type,
      j.modality,
      j.location,
      j.salary_min,
      j.salary_max,
      j.currency,
      j.score,
      j.status,
      j.required_stack,
      j.sources,
      j.gig_date,
      j.created_at,
      j.updated_at,
      jsonb_build_object('name', COALESCE(c.name, 'Empresa Confidencial'), 'logo_url', c.logo_url) AS company,
      NULL::NUMERIC AS match_percentage
    FROM public.jobs j
    LEFT JOIN public.companies c ON c.id = j.company_id
    ORDER BY j.created_at DESC;
  END IF;
END;
$$;
