-- Enable RLS on customers table (plural)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Allow public read access to customers table
DROP POLICY IF EXISTS "Allow public read access" ON public.customers;
CREATE POLICY "Allow public read access"
  ON public.customers
  FOR SELECT
  USING (true);

-- Allow public insert access to customers table
DROP POLICY IF EXISTS "Allow public insert access" ON public.customers;
CREATE POLICY "Allow public insert access"
  ON public.customers
  FOR INSERT
  WITH CHECK (true);

-- Allow public update access to customers table (for updating existing customers)
DROP POLICY IF EXISTS "Allow public update access" ON public.customers;
CREATE POLICY "Allow public update access"
  ON public.customers
  FOR UPDATE
  USING (true);
