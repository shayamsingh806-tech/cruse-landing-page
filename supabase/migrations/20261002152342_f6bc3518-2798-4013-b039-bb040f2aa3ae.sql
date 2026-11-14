CREATE OR REPLACE FUNCTION public.bookings_guard_payment() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' THEN
    NEW.payment_status := 'unpaid'; NEW.amount_paise := NULL; NEW.razorpay_order_id := NULL; NEW.razorpay_payment_id := NULL;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER bookings_guard_payment BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.bookings_guard_payment();