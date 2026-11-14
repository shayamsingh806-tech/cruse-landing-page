ALTER TABLE public.experiences DROP CONSTRAINT experiences_kind_check;
ALTER TABLE public.experiences ADD CONSTRAINT experiences_kind_check CHECK (kind IN ('Cruise', 'Activity', 'Combo'));