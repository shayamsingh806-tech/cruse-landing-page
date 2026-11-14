import { createFileRoute } from "@tanstack/react-router";
import { ComboPlaceholder, comboHead } from "@/components/site/ComboPlaceholder";

export const Route = createFileRoute("/combos/")({
  head: () => comboHead("Combos", "/combos"),
  component: Page,
});

function Page() {
  return <ComboPlaceholder name="Combos" />;
}
