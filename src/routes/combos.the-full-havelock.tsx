import { createFileRoute } from "@tanstack/react-router";
import { ComboDetailPlaceholder, comboHead } from "@/components/site/ComboPlaceholder";

export const Route = createFileRoute("/combos/the-full-havelock")({
  head: () => comboHead("The Full Havelock", "/combos/the-full-havelock"),
  component: Page,
});

function Page() {
  return <ComboDetailPlaceholder name="The Full Havelock" />;
}
