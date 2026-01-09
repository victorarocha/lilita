-- Add RLS policies for all tables to allow public read access

-- Merchant table
DROP POLICY IF EXISTS "Allow public read access" ON public.merchant;
CREATE POLICY "Allow public read access"
  ON public.merchant
  FOR SELECT
  USING (true);

-- Product table
DROP POLICY IF EXISTS "Allow public read access" ON public.product;
CREATE POLICY "Allow public read access"
  ON public.product
  FOR SELECT
  USING (true);

-- Product Category table
DROP POLICY IF EXISTS "Allow public read access" ON public.product_category;
CREATE POLICY "Allow public read access"
  ON public.product_category
  FOR SELECT
  USING (true);

-- Currency table
DROP POLICY IF EXISTS "Allow public read access" ON public.currency;
CREATE POLICY "Allow public read access"
  ON public.currency
  FOR SELECT
  USING (true);

-- Ordering Location table
DROP POLICY IF EXISTS "Allow public read access" ON public.ordering_location;
CREATE POLICY "Allow public read access"
  ON public.ordering_location
  FOR SELECT
  USING (true);
