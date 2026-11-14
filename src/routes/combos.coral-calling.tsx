import { createFileRoute } from "@tanstack/react-router";
import { ComboDetailPlaceholder, comboHead } from "@/components/site/ComboPlaceholder";

export const Route = createFileRoute("/combos/coral-calling")({
  head: () => comboHead("Coral Calling", "/combos/coral-calling"),
  component: Page,
});

function Page() {
  return <ComboDetailPlaceholder name="Coral Calling" />;
}
