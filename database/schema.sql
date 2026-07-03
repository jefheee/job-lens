-- Enable the pgvector extension to work with embedding vectors for semantic deduplication
CREATE EXTENSION IF NOT EXISTS vector;

-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    glassdoor_rating NUMERIC(3, 2),
    logo_url TEXT,
    website TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    description_embedding VECTOR(1536), -- Assuming standard OpenAI ada-002 model dimensions
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    contract_type TEXT NOT NULL,
    modality TEXT NOT NULL,
    location TEXT NOT NULL,
    salary_min NUMERIC(10, 2),
    salary_max NUMERIC(10, 2),
    currency TEXT DEFAULT 'BRL',
    score NUMERIC(4, 2) NOT NULL DEFAULT 0.0,
    status TEXT NOT NULL DEFAULT 'ATIVA',
    required_stack TEXT[] DEFAULT '{}',
    sources JSONB DEFAULT '[]'::jsonb, -- Store array of JobSource for deduplication URLs
    gig_date DATE,
    match_score FLOAT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for similarity search on description_embedding using HNSW for fast nearest neighbor search
CREATE INDEX ON public.jobs USING hnsw (description_embedding vector_cosine_ops);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Allow public read access on companies" 
ON public.companies FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access on jobs" 
ON public.jobs FOR SELECT 
USING (true);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    cv_text TEXT,
    cv_embedding VECTOR(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for similarity search on cv_embedding
CREATE INDEX ON public.user_profiles USING hnsw (cv_embedding vector_cosine_ops);

-- Enable RLS for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on user_profiles" 
ON public.user_profiles FOR SELECT USING (true);

-- RPC for matching jobs to CV
CREATE OR REPLACE FUNCTION match_jobs_to_cv(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
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
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.id, j.title, j.description, j.company_id, j.contract_type, j.modality,
    j.location, j.salary_min, j.salary_max, j.currency, j.score, j.status,
    j.required_stack, j.sources, j.gig_date,
    1 - (j.description_embedding <=> query_embedding) AS similarity
  FROM public.jobs j
  WHERE 1 - (j.description_embedding <=> query_embedding) > match_threshold
  ORDER BY j.description_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
