import { createFileRoute } from "@tanstack/react-router";
import { ComboDetailPlaceholder, comboHead } from "@/components/site/ComboPlaceholder";

export const Route = createFileRoute("/combos/dive-and-fly")({
  head: () => comboHead("Dive & Fly", "/combos/dive-and-fly"),
  component: Page,
});

function Page() {
  return <ComboDetailPlaceholder name="Dive & Fly" />;
}
