import { images } from "./assets";

/** Preferred public hostname — HTTPS, no www, no trailing slash. */
export const SITE_URL = "https://canopusmarineserv.com";
export const SITE_NAME = "Canopus Marine";

/**
 * Central redirect map (old URL -> new URL). Paths are compared without a
 * trailing slash. Every target is final, so no redirect chains are created.
 * Edit this list to change redirects — no page code needs to change.
 */
export const REDIRECTS: Record<string, string> = {
  // Renamed to preserve the old site's URLs
  "/about": "/about-us",
  "/contact": "/contact-us",
  "/contact-new": "/contact-us",
  // Policy pages
  "/terms-of-booking": "/policies/terms-of-booking",
  "/terms-and-conditions": "/policies/terms-of-booking",
  "/terms-of-service": "/policies/terms-of-booking",
  "/tour-term-condition": "/policies/terms-of-booking",
  "/privacy-policy-2": "/policies/privacy-policy",
  // Old sections removed from the new site -> closest live page
  "/charter-private": "/contact-us",
  "/tours": "/activities",
  "/destinations": "/activities",
  "/shop": "/activities",
  "/deals": "/booking",
  "/checkout": "/booking",
  "/blogs": "/activities",
  "/blog": "/activities",
  "/travel-tips": "/activities",
  "/faqs": "/contact-us",
  "/careers": "/about-us",
};

/** Old URLs with no equivalent and no SEO value — answered with 410 Gone. */
export const GONE = new Set([
  "/sample-page",
  "/sample-page-2",
  "/month",
  "/how-to-delete-a-user-from-the-website",
  "/my-account",
  "/login-page",
]);

/** Indexable static pages listed in the sitemap. */
export const STATIC_PAGES = ["/", "/cruises", "/activities", "/semi-submarine", "/havelock-island", "/port-blair", "/gallery", "/about-us", "/contact-us", "/booking"];
export const POLICY_SLUGS = ["terms-of-booking", "cancellation-policy", "safety-guidelines", "privacy-policy"];

export const absoluteUrl = (path: string) => `${SITE_URL}${path === "/" ? "/" : path}`;
export const defaultOgImage = () => absoluteUrl(images.heroIsland);

type Meta = Record<string, string>;

/**
 * Adds canonical, og:url, og:image and Twitter tags to an existing meta list,
 * mirroring the page's own og:title / og:description.
 */
export function seo(path: string, meta: Meta[], opts: { noindex?: boolean } = {}) {
  const get = (k: string) => meta.find((m) => m["property"] === k || m["name"] === k)?.["content"];
  const title = get("og:title") ?? meta.find((m) => m["title"])?.["title"] ?? SITE_NAME;
  const description = get("og:description") ?? get("description") ?? "";
  const url = absoluteUrl(path);
  const image = defaultOgImage();
  return {
    meta: [
      ...meta,
      { name: "robots", content: opts.noindex ? "noindex, follow" : "index, follow" },
      { property: "og:url", content: url },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:image", content: image },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export const breadcrumbLd = (items: [string, string][]) => ({
  type: "application/ld+json",
  children: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: absoluteUrl(path) })),
  }),
});

export const organizationLd = {
  type: "application/ld+json",
  children: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: "Canopus Marine Management Services Pvt. Ltd.",
    alternateName: SITE_NAME,
    url: `${SITE_URL}/`,
    image: defaultOgImage(),
    priceRange: "₹₹",
    telephone: ["+91-99332-46262", "+91-99332-22257"],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Ground Floor, MB 2/12 Biggi Line",
      addressLocality: "Port Blair",
      addressRegion: "Andaman and Nicobar Islands",
      postalCode: "744101",
      addressCountry: "IN",
    },
    geo: { "@type": "GeoCoordinates", latitude: 11.6234, longitude: 92.7265 },
    areaServed: ["Havelock Island", "Port Blair"],
    sameAs: [
      "https://www.facebook.com/people/Andaman-Semisubmarine-Cruise/100075996416818/",
      "https://www.instagram.com/semisubmarineandaman/",
      "https://www.youtube.com/channel/UCjqfZLd4oA9XIW57UZ0eTdA",
    ],
  }),
};

/** Parses the first ₹ amount from strings like "₹2,500 per person" or "From ₹1,35,000". */
export const parseInrPrice = (price: string): number | null => {
  const m = price.replace(/,/g, "").match(/₹\s*(\d+)/);
  return m ? Number(m[1]) : null;
};

type ExperienceLdInput = {
  slug: string;
  title: string;
  fullTitle?: string;
  kind: string;
  image: string;
  location: string;
  duration: string;
  price: string;
  overview: string;
};

/** Rich TouristTrip + Offer structured data for a cruise or activity page. */
export const experienceLd = (x: ExperienceLdInput) => {
  const path = `${x.kind === "Combo" ? "/combos" : "/experiences"}/${x.slug}`;
  const price = parseInrPrice(x.price);
  return {
    type: "application/ld+json",
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: x.fullTitle ?? x.title,
      description: x.overview,
      url: absoluteUrl(path),
      image: absoluteUrl(x.image),
      touristType: x.kind === "Cruise" ? "Sightseers, couples, families" : "Adventure travellers",
      itinerary: {
        "@type": "ItemList",
        itemListElement: [
          {
            "@type": "TouristAttraction",
            name: x.location,
            address: { "@type": "PostalAddress", addressRegion: "Andaman and Nicobar Islands", addressCountry: "IN" },
          },
        ],
      },
      provider: { "@type": "TravelAgency", name: SITE_NAME, url: `${SITE_URL}/` },
      ...(price
        ? {
            offers: {
              "@type": "Offer",
              price: price,
              priceCurrency: "INR",
              availability: "https://schema.org/InStock",
              url: absoluteUrl(path),
              seller: { "@type": "TravelAgency", name: SITE_NAME },
            },
          }
        : {}),
    }),
  };
};

/** ItemList of cruises/activities for the listing pages. */
export const itemListLd = (name: string, path: string, items: { slug: string; title: string; kind?: string }[]) => ({
  type: "application/ld+json",
  children: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: absoluteUrl(path),
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.title,
      url: absoluteUrl(`${it.kind === "Combo" ? "/combos" : "/experiences"}/${it.slug}`),
    })),
  }),
});

/** FAQPage structured data from question/answer pairs. */
export const faqLd = (faqs: { q: string; a: string }[]) => ({
  type: "application/ld+json",
  children: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }),
});
