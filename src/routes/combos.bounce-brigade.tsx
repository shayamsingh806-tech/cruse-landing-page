import { createFileRoute } from "@tanstack/react-router";
import { ComboDetailPlaceholder, comboHead } from "@/components/site/ComboPlaceholder";

export const Route = createFileRoute("/combos/bounce-brigade")({
  head: () => comboHead("Bounce Brigade", "/combos/bounce-brigade"),
  component: Page,
});

function Page() {
  return <ComboDetailPlaceholder name="Bounce Brigade" />;
}
