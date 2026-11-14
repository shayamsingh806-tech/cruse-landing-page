UPDATE public.experiences
SET price_note = 'Children (5–11 yrs): ₹1,499 per child · Infants (below 4 yrs): Free',
    updated_at = now()
WHERE slug IN ('lunch-cruise', 'sunset-cruise', 'dinner-cruise');