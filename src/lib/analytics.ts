// Google Tag Manager + lead tracking.
// Every lead pushes `event: "generate_lead"` to the dataLayer, so in GTM you only need
// one Custom Event trigger ("generate_lead") for GA4 / Google Ads / Meta conversion tags.
export const GTM_ID = "GTM-TL2XV3S3";
// Google Ads: account tag + "Outbound click" conversion action.
export const ADS_ID = "AW-17388414785";
export const ADS_LEAD_CONVERSION = "AW-17388414785/lClzCKDB5rkdEMHOuONA";

type Params = Record<string, unknown>;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    gtag_report_conversion?: (url?: string) => boolean;
  }
}

export function track(event: string, params: Params = {}) {
  if (typeof window === "undefined") return;
  (window.dataLayer = window.dataLayer || []).push({ event, ...params });
}

/** method: whatsapp | phone | email | form · source: where on the site it happened. */
export function trackLead(method: "whatsapp" | "phone" | "email" | "form", source: string, params: Params = {}) {
  track("generate_lead", {
    lead_method: method,
    lead_source: source,
    currency: "INR",
    page_path: typeof location !== "undefined" ? location.pathname : undefined,
    ...params,
  });
  // Google Ads "Outbound click" conversion for every lead.
  window.gtag_report_conversion?.();
}

/** Google Ads base tag script (loaded async in <head>). */
export const adsTagSrc = `https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`;

/** GTM head snippet + Google Ads config + Google's gtag_report_conversion() event snippet. */
export const gtmHeadScript = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());
gtag('config','${ADS_ID}');
function gtag_report_conversion(url){var callback=function(){if(typeof(url)!='undefined'){window.location=url;}};gtag('event','conversion',{'send_to':'${ADS_LEAD_CONVERSION}','value':1.0,'currency':'INR','event_callback':callback});return false;}
window.gtag_report_conversion=gtag_report_conversion;
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`;

/**
 * Counts clicks on WhatsApp, phone and email links anywhere on the site as leads.
 * Links can add data-lead-source / data-lead-item / data-lead-value for detail,
 * or data-lead-skip to opt out (when the click is already tracked in code).
 */
export function installLinkLeadTracking() {
  const onClick = (e: MouseEvent) => {
    const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!a) return;
    const ds = a.dataset;
    if (ds["leadSkip"] !== undefined) return;
    const href = a.getAttribute("href") ?? "";
    const method = /wa\.me|api\.whatsapp\.com|whatsapp:/i.test(href) ? "whatsapp" : href.startsWith("tel:") ? "phone" : href.startsWith("mailto:") ? "email" : null;
    if (!method) return;
    const value = ds["leadValue"] ? Number(ds["leadValue"]) : undefined;
    trackLead(method, ds["leadSource"] ?? "link", {
      ...(ds["leadItem"] ? { item_name: ds["leadItem"] } : {}),
      ...(value ? { value } : {}),
      link_text: (a.textContent ?? "").trim().slice(0, 80) || a.getAttribute("aria-label") || undefined,
    });
  };
  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
}
