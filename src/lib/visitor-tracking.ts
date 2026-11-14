// Pings the server once per browser session so the admin dashboard can see
// where visitors are coming from (IP + approximate city/country).
import { chatSessionId } from "./chat-attribution";

const PINGED_KEY = "canopus-visit-logged";

export function trackVisit() {
  try {
    if (sessionStorage.getItem(PINGED_KEY)) return;
    sessionStorage.setItem(PINGED_KEY, "1");
    const sessionId = chatSessionId();
    if (!sessionId) return;
    void fetch("/api/public/track-visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId, path: window.location.pathname }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Tracking must never break the page.
  }
}
