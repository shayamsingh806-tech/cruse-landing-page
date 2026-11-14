import { Link } from "@tanstack/react-router";
import { CardsGrid, Checks, HeroBanner, SectionHeading, SunRule } from "@/components/site/sections";
import { Button } from "@/components/ui/button";
import { useExperiences } from "@/lib/use-experiences";
import type { Experience } from "@/lib/site-data";

export function LocationPage({
  image,
  title,
  eyebrow = "Canopus Marine",
  intro,
  highlights,
  filter,
  ctaTitle,
  ctaText,
}: {
  image: string;
  title: string;
  eyebrow?: string;
  intro: string;
  highlights: string[];
  filter: (x: Experience) => boolean;
  ctaTitle: string;
  ctaText: string;
}) {
  const all = useExperiences();
  const items = all.filter(filter);
  const cruises = items.filter((x) => x.kind === "Cruise");
  const activities = items.filter((x) => x.kind === "Activity");
  return (
    <>
      <HeroBanner image={image} title={title} eyebrow={eyebrow}>
        <p>{intro}</p>
      </HeroBanner>
      <section className="bg-background py-16 md:py-24">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="max-w-3xl">
            <SectionHeading kicker="Why Here" title={`What Awaits You in ${title}`} />
            <Checks items={highlights} />
          </div>
        </div>
      </section>
      <SunRule />
      {cruises.length > 0 && (
        <section className="bg-muted py-16 md:py-24">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
            <SectionHeading kicker="Cruises" title={`Cruises in ${title}`} />
            <div className="mt-10">
              <CardsGrid items={cruises} />
            </div>
          </div>
        </section>
      )}
      {activities.length > 0 && (
        <section className="bg-background py-16 md:py-24">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
            <SectionHeading kicker="Activities" title={`Activities in ${title}`} />
            <div className="mt-10">
              <CardsGrid items={activities} />
            </div>
          </div>
        </section>
      )}
      <section className="bg-primary py-16 text-primary-foreground md:py-20">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
          <h2 className="text-3xl font-bold md:text-4xl">{ctaTitle}</h2>
          <p className="mt-4 text-lg text-primary-foreground/85">{ctaText}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="secondary">
              <Link to="/booking">Book Now</Link>
            </Button>
            <Button asChild variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/contact-us">Ask a Question</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
