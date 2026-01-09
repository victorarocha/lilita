-- Enable RLS on order table
ALTER TABLE public.order ENABLE ROW LEVEL SECURITY;

-- Allow public read and insert access to order table
DROP POLICY IF EXISTS "Allow public read access" ON public.order;
CREATE POLICY "Allow public read access"
  ON public.order
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert access" ON public.order;
CREATE POLICY "Allow public insert access"
  ON public.order
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access" ON public.order;
CREATE POLICY "Allow public update access"
  ON public.order
  FOR UPDATE
  USING (true);

-- Enable RLS on order_products table
ALTER TABLE public.order_products ENABLE ROW LEVEL SECURITY;

-- Allow public read and insert access to order_products table
DROP POLICY IF EXISTS "Allow public read access" ON public.order_products;
CREATE POLICY "Allow public read access"
  ON public.order_products
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert access" ON public.order_products;
CREATE POLICY "Allow public insert access"
  ON public.order_products
  FOR INSERT
  WITH CHECK (true);

-- Enable RLS on customer table
ALTER TABLE public.customer ENABLE ROW LEVEL SECURITY;

-- Allow public read and insert access to customer table
DROP POLICY IF EXISTS "Allow public read access" ON public.customer;
CREATE POLICY "Allow public read access"
  ON public.customer
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert access" ON public.customer;
CREATE POLICY "Allow public insert access"
  ON public.customer
  FOR INSERT
  WITH CHECK (true);
