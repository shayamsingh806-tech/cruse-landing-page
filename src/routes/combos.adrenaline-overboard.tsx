import { createFileRoute } from "@tanstack/react-router";
import { ComboDetailPlaceholder, comboHead } from "@/components/site/ComboPlaceholder";

export const Route = createFileRoute("/combos/adrenaline-overboard")({
  head: () => comboHead("Adrenaline Overboard", "/combos/adrenaline-overboard"),
  component: Page,
});

function Page() {
  return <ComboDetailPlaceholder name="Adrenaline Overboard" />;
}
