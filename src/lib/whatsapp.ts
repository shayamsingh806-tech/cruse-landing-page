import { SITE_URL } from "@/lib/seo";

// WhatsApp number that receives every booking / product enquiry on the site
// (country code + number, digits only, no "+"). Change this one line to switch numbers.
export const BOOKING_WHATSAPP_NUMBER = "917087288214";

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

type ProductLike = { title: string; slug: string; kind?: string; price?: string; originalPrice?: string | undefined; location?: string; timing?: string };

// Pre-typed message for "Book on WhatsApp" buttons on cruises, activities and combos.
export function productMessage(p: ProductLike) {
  const path = p.kind === "Combo" ? `/combos/${p.slug}` : `/experiences/${p.slug}`;
  return [
    `Hi Canopus Marine! I'm interested in *${p.title}*${p.kind ? ` (${p.kind})` : ""}.`,
    ...(p.price ? [`Price: ${p.price}${p.originalPrice ? ` (offer — regular ${p.originalPrice})` : ""}`] : []),
    ...(p.location ? [`Location: ${p.location}`] : []),
    ...(p.timing ? [`Timing: ${p.timing}`] : []),
    `Link: ${SITE_URL}${path}`,
    "",
    "Please share availability and booking details.",
  ].join("\n");
}
