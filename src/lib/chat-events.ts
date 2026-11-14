// Logs booking-assistant funnel events (opens, messages, recommendation
// clicks, checkout starts) so admins can see where visitors drop off.
import { supabase } from "@/integrations/supabase/client";

export type ChatEventType = "chat_open" | "chat_message" | "recommendation_click" | "checkout_start";

export function trackChatEvent(eventType: ChatEventType, metadata: Record<string, unknown> = {}) {
  // Fire-and-forget: analytics must never block or break the UI.
  void supabase
    .from("chat_events")
    .insert({ event_type: eventType, metadata: metadata as never })
    .then(({ error }) => {
      if (error) console.warn("chat event log failed:", error.message);
    });
}
