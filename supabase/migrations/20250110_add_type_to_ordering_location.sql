ALTER TABLE public.ordering_location
ADD COLUMN IF NOT EXISTS type TEXT;

CREATE INDEX IF NOT EXISTS idx_ordering_location_type
ON public.ordering_location(type);
