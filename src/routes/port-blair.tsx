import { createFileRoute } from "@tanstack/react-router";
import { LocationPage } from "@/components/site/LocationPage";
import { images } from "@/lib/assets";
import { breadcrumbLd, itemListLd, seo } from "@/lib/seo";
import { experiences } from "@/lib/site-data";

const PATH = "/port-blair";
const portBlair = experiences.filter((x) => x.location.includes("Port Blair") || x.location.includes("North Bay") || x.location.includes("Andaman Sea"));

export const Route = createFileRoute("/port-blair")({
  head: () => ({
    ...seo(PATH, [
      { title: "Things to Do in Port Blair — Watersports & Adventures | Canopus Marine" },
      { name: "description", content: "Parasailing, jet ski, scuba, sea walk at North Bay, glass-bottom boat rides and game fishing from Port Blair. Book direct with Canopus Marine, a local Port Blair crew." },
      { property: "og:title", content: "Watersports & Activities in Port Blair | Canopus Marine" },
      { property: "og:description", content: "Adventure on the water around Port Blair and North Bay — parasailing, scuba, sea walk, glass-bottom rides and game fishing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ]),
    scripts: [
      breadcrumbLd([["Home", "/"], ["Port Blair", PATH]]),
      itemListLd("Activities in Port Blair", PATH, portBlair),
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <LocationPage
      image={images.parasailing}
      title="Port Blair"
      intro="The capital of the Andamans is where our story began — and where some of the islands' best water adventures wait, from North Bay's coral reefs to the open Andaman Sea."
      highlights={[
        "Sea walk on the coral beds of North Bay — no swimming needed",
        "Parasailing and jet ski rides with city-and-sea views",
        "Shore and boat scuba on reefs close to the capital",
        "Glass-bottom boat rides over coral gardens for all ages",
        "Offshore game fishing charters into the Andaman Sea",
      ]}
      filter={(x) => x.location.includes("Port Blair") || x.location.includes("North Bay") || x.location.includes("Andaman Sea")}
      ctaTitle="Plan Your Day in Port Blair"
      ctaText="Based in Port Blair ourselves, we know these waters best — tell us your dates and we'll line up the right adventures."
    />
  );
}
