-- Enable RLS on product_variation table if not already enabled
ALTER TABLE public.product_variation ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for public read access to product_variation table
DROP POLICY IF EXISTS "Allow public read access" ON public.product_variation;
CREATE POLICY "Allow public read access"
  ON public.product_variation
  FOR SELECT
  USING (true);
