import { seo } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Checks, HeroBanner, SectionHeading, SunRule } from "@/components/site/sections";
import { images } from "@/lib/assets";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/semi-submarine")({
  head: () =>
    seo("/semi-submarine", [
      { title: "Semi Submarine in Andaman — Underwater Cruise Without Getting Wet | Canopus Marine" },
      {
        name: "description",
        content:
          "Explore Andaman's coral reefs from a semi submarine in Havelock. Air-conditioned underwater viewing, no swimming needed — perfect for families, elders and non-swimmers.",
      },
      { property: "og:title", content: "Semi Submarine in Andaman | Canopus Marine" },
      {
        property: "og:description",
        content: "See live coral reefs and tropical fish from our semi-submarine's underwater viewing deck — no diving or swimming required.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ]),
  component: Page,
});

function Page() {
  return (
    <>
      <HeroBanner image={images.hero} title="Semi Submarine in the Andamans" eyebrow="Canopus Marine">
        <p>
          Watch the Andaman Sea come alive beneath your feet — coral gardens, tropical fish and crystal-clear water, all from the comfort of our
          semi-submarine's underwater viewing deck.
        </p>
      </HeroBanner>
      <section className="bg-background py-16 md:py-24">
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
          <div>
            <SectionHeading kicker="The Experience" title="The Reef, Without Getting Wet" />
            <div className="mt-6 text-base leading-7 text-muted-foreground">
              <p>
                Our semi-submarine cruises along the reefs of Havelock Island while you sit below the waterline in a comfortable, air-conditioned
                viewing deck. Large panoramic windows put you eye-to-eye with parrotfish, angelfish, corals and — on lucky days — sea turtles gliding
                past.
              </p>
              <p className="mt-4">
                Because you never enter the water, it is the one Andaman reef experience that truly everyone can enjoy: young children, grandparents,
                non-swimmers and anyone who prefers to stay dry.
              </p>
            </div>
            <Checks
              items={[
                "Air-conditioned underwater viewing deck with panoramic windows",
                "No swimming or diving experience needed — ideal for all ages",
                "Live coral reefs and tropical marine life around Havelock",
                "Experienced local crew with decades at sea",
                "Departures from Havelock Jetty",
              ]}
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/cruises">See Our Cruises</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/booking">Book Now</Link>
              </Button>
            </div>
          </div>
          <img
            src={images.heroIsland}
            alt="Semi-submarine cruise over clear turquoise water and coral reefs in the Andaman Islands"
            loading="lazy"
            className="aspect-[4/3] w-full rounded-2xl object-cover"
          />
        </div>
      </section>
      <SunRule />
      <section className="bg-muted py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
          <SectionHeading kicker="Choose Your Cruise" title="Three Ways to Sail With Us" />
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-7 text-muted-foreground">
            Every cruise includes time on the water around Havelock — pick the one that fits your day.
          </p>
          <div className="mt-10 grid gap-6 text-left md:grid-cols-3">
            {[
              { slug: "lunch-cruise", name: "Lunch Cruise", detail: "5 hours on the water with lunch on board, departing 9:30 AM from Havelock Jetty." },
              { slug: "sunset-cruise", name: "Sunset Cruise", detail: "2 golden hours on the Andaman Sea, departing 4:00 PM — decorations and cake available on request." },
              { slug: "dinner-cruise", name: "Dinner Cruise", detail: "A 2.5-hour evening under the stars with dinner on board, departing 7:15 PM." },
            ].map((c) => (
              <Link
                key={c.slug}
                to="/experiences/$slug"
                params={{ slug: c.slug }}
                className="group rounded-2xl bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
              >
                <h3 className="text-2xl font-bold group-hover:text-primary">{c.name}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{c.detail}</p>
                <span className="mt-4 inline-block text-sm font-bold text-primary-hover">Learn More →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
