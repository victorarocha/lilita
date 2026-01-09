-- Allow public read access to hospitality_center table
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow public read access" ON public.hospitality_center;

-- Create policy to allow all users to read hospitality centers
CREATE POLICY "Allow public read access"
  ON public.hospitality_center
  FOR SELECT
  USING (true);
