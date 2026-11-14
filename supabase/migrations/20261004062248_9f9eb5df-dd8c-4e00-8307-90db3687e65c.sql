DROP POLICY IF EXISTS "Public can submit bookings" ON public.bookings;
CREATE POLICY "Public can submit bookings" ON public.bookings FOR INSERT TO anon, authenticated
WITH CHECK (status = 'new' AND payment_status = 'unpaid' AND razorpay_payment_id IS NULL AND guest_count BETWEEN 1 AND 100 AND booking_date >= current_date - 1 AND position('@' in email) > 1);
DROP POLICY IF EXISTS "Public can submit contact messages" ON public.contact_messages;
CREATE POLICY "Public can submit contact messages" ON public.contact_messages FOR INSERT TO anon, authenticated
WITH CHECK (status = 'new' AND position('@' in email) > 1 AND length(message) BETWEEN 1 AND 5000);
DROP POLICY IF EXISTS "Public can submit enquiries" ON public.enquiries;
CREATE POLICY "Public can submit enquiries" ON public.enquiries FOR INSERT TO anon, authenticated
WITH CHECK (status = 'new' AND guest_count BETWEEN 1 AND 500 AND position('@' in email) > 1);