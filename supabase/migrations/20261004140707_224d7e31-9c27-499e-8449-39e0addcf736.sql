UPDATE public.experiences
SET price_note = 'Ages 3 years and above: ₹2,500 per person · Infants (below 3 yrs): Free',
    updated_at = now()
WHERE slug IN ('lunch-cruise', 'sunset-cruise');