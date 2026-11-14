import { createFileRoute } from "@tanstack/react-router";
import { ComboDetailPlaceholder, comboHead } from "@/components/site/ComboPlaceholder";

export const Route = createFileRoute("/combos/reef-n-ride")({
  head: () => comboHead("Reef n Ride", "/combos/reef-n-ride"),
  component: Page,
});

function Page() {
  return <ComboDetailPlaceholder name="Reef n Ride" />;
}
