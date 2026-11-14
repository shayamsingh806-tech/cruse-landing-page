import { createFileRoute } from "@tanstack/react-router";
import { markTranscriptConverted } from "@/lib/chat-learning.server";

export const Route = createFileRoute("/api/chat-converted")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { sessionId } = (await request.json()) as { sessionId?: string };
          if (typeof sessionId === "string") await markTranscriptConverted(sessionId);
        } catch { /* ignore */ }
        return new Response(null, { status: 204 });
      },
    },
  },
});
