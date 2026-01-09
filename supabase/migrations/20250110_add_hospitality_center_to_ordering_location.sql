ALTER TABLE public.ordering_location
ADD COLUMN IF NOT EXISTS hospitality_center_id INTEGER REFERENCES public.hospitality_center(id);

CREATE INDEX IF NOT EXISTS idx_ordering_location_hospitality_center
ON public.ordering_location(hospitality_center_id);
