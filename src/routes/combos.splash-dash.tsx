import { createFileRoute } from "@tanstack/react-router";
import { ComboDetailPlaceholder, comboHead } from "@/components/site/ComboPlaceholder";

export const Route = createFileRoute("/combos/splash-dash")({
  head: () => comboHead("Splash Dash", "/combos/splash-dash"),
  component: Page,
});

function Page() {
  return <ComboDetailPlaceholder name="Splash Dash" />;
}
