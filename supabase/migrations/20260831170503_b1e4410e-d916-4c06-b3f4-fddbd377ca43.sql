ALTER TABLE public.virtual_models ADD COLUMN IF NOT EXISTS job_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS virtual_models_job_id_key ON public.virtual_models (job_id) WHERE job_id IS NOT NULL;
DELETE FROM public.virtual_models WHERE status = 'failed' AND jsonb_array_length(images) = 0;