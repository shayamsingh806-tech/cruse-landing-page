import { createFileRoute } from "@tanstack/react-router";
import { ComboDetailPlaceholder, comboHead } from "@/components/site/ComboPlaceholder";

export const Route = createFileRoute("/combos/dry-hair-deep-sea")({
  head: () => comboHead("Dry Hair Deep Sea", "/combos/dry-hair-deep-sea"),
  component: Page,
});

function Page() {
  return <ComboDetailPlaceholder name="Dry Hair Deep Sea" />;
}
