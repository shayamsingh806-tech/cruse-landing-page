import { createFileRoute } from "@tanstack/react-router";
import { ComboDetailPlaceholder, comboHead } from "@/components/site/ComboPlaceholder";

export const Route = createFileRoute("/combos/fly-and-fury")({
  head: () => comboHead("Fly & Fury", "/combos/fly-and-fury"),
  component: Page,
});

function Page() {
  return <ComboDetailPlaceholder name="Fly & Fury" />;
}
