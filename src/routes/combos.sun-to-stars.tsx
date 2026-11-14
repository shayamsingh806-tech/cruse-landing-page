import { createFileRoute } from "@tanstack/react-router";
import { ComboDetailPlaceholder, comboHead } from "@/components/site/ComboPlaceholder";

export const Route = createFileRoute("/combos/sun-to-stars")({
  head: () => comboHead("Sun to Stars", "/combos/sun-to-stars"),
  component: Page,
});

function Page() {
  return <ComboDetailPlaceholder name="Sun to Stars" />;
}
