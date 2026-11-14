// WhatsApp number that receives booking-form details (country code + number, digits only, no "+").
// Change this one line to send bookings to a different WhatsApp number.
export const BOOKING_WHATSAPP_NUMBER = "917827629643";

export function whatsappLink(text: string, number: string = BOOKING_WHATSAPP_NUMBER) {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

// Opens WhatsApp (app on phones, WhatsApp Web on computers) with the message pre-typed.
// Must be called directly inside a click handler so browsers don't block the new tab.
export function openWhatsApp(text: string, number?: string) {
  const url = whatsappLink(text, number);
  const w = window.open(url, "_blank");
  if (w) w.opener = null;
  else window.location.href = url;
}
