CREATE TABLE public.saved_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  item_count integer NOT NULL DEFAULT 0 CHECK (item_count BETWEEN 0 AND 50),
  created_at timestamptz NOT NULL DEFAULT now(),
  open_count integer NOT NULL DEFAULT 0,
  last_opened_at timestamptz,
  converted_at timestamptz,
  order_id text,
  amount_paise integer
);
GRANT SELECT ON public.saved_carts TO authenticated;
GRANT ALL ON public.saved_carts TO service_role;
ALTER TABLE public.saved_carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read saved carts" ON public.saved_carts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));