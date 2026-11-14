// Remembers (in this browser) that the visitor used the booking assistant,
// so their later booking can be attributed to the chatbot.
const KEY = "canopus-chat-used";
const SESSION_KEY = "canopus-chat-session";

export function markChatUsed() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* private mode — attribution just won't persist */
  }
}

export function chatAttribution(): "chat" | "direct" {
  if (typeof window === "undefined") return "direct";
  try {
    return localStorage.getItem(KEY) === "1" ? "chat" : "direct";
  } catch {
    return "direct";
  }
}

/** Stable id for this browser's assistant conversation (used to save the transcript). */
export function chatSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

export function resetChatSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}

/** Flags this visitor's saved chat as having led to a booking. */
export function markChatConverted() {
  if (chatAttribution() !== "chat") return;
  try {
    const id = localStorage.getItem(SESSION_KEY);
    if (!id) return;
    void fetch("/api/chat-converted", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: id }),
      keepalive: true,
    }).catch(() => {});
  } catch { /* ignore */ }
}
