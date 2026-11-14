import { createFileRoute } from "@tanstack/react-router";
import { LocationPage } from "@/components/site/LocationPage";
import { images } from "@/lib/assets";
import { breadcrumbLd, itemListLd, seo } from "@/lib/seo";
import { experiences } from "@/lib/site-data";

const PATH = "/havelock-island";
const havelock = experiences.filter((x) => x.location.includes("Havelock") || x.location.includes("Andaman Sea"));

export const Route = createFileRoute("/havelock-island")({
  head: () => ({
    ...seo(PATH, [
      { title: "Things to Do in Havelock Island — Cruises & Watersports | Canopus Marine" },
      { name: "description", content: "Semi-submarine cruises, scuba, snorkeling, parasailing, kayaking and more on Havelock Island (Swaraj Dweep). Book direct with Canopus Marine — departures from Havelock Jetty." },
      { property: "og:title", content: "Cruises & Activities in Havelock Island | Canopus Marine" },
      { property: "og:description", content: "Every Canopus Marine experience departs from Havelock — semi-submarine cruises, watersports and underwater adventures." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ]),
    scripts: [
      breadcrumbLd([["Home", "/"], ["Havelock Island", PATH]]),
      itemListLd("Cruises & Activities in Havelock Island", PATH, havelock),
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <LocationPage
      image={images.heroIsland}
      title="Havelock Island"
      intro="Swaraj Dweep — the jewel of the Andamans — is our home waters. Every cruise and nearly every activity we run departs from Havelock Jetty, minutes from the island's famous beaches."
      highlights={[
        "Semi-submarine lunch, sunset and dinner cruises from Havelock Jetty",
        "Scuba, snorkeling, sea walk and underwater scooter on living coral reefs",
        "Parasailing, jet ski, flying board and group rides in calm island waters",
        "Day and glow-lit night kayaking through mangrove creeks",
        "Easy reach from Radhanagar Beach, Elephant Beach and all major resorts",
      ]}
      filter={(x) => x.location.includes("Havelock") || x.location.includes("Andaman Sea")}
      ctaTitle="Plan Your Day on Havelock"
      ctaText="Tell us your dates and group size — our local crew will help you pick the perfect mix of cruises and activities."
    />
  );
}
