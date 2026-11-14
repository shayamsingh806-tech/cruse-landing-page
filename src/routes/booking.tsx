import { seo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { HeroBanner } from "@/components/site/sections";
import { images } from "@/lib/assets";
import { BookingForm } from "@/components/site/BookingForm";
import { useExperiences } from "@/lib/use-experiences";

type Search = { experience?: string };

export const Route = createFileRoute("/booking")({
  validateSearch: (s: Record<string, unknown>): Search => (typeof s["experience"] === "string" ? { experience: s["experience"] } : {}),
  head: () =>
    seo("/booking", [
      { title: "Book a Canopus Marine Experience" },
      { name: "description", content: "Request your preferred Canopus Marine cruise or watersports experience in the Andaman Islands." },
      { property: "og:title", content: "Book with Canopus Marine" },
      { property: "og:description", content: "Choose your experience, date and guest count to begin your booking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ]),
  component: Page,
});

function Page() {
  const { experience } = Route.useSearch();
  const experiences = useExperiences();
  const locked = experiences.find((x) => x.slug === experience)?.title;
  return (
    <>
      <HeroBanner image={images.cruiseDeck} title="Book Your Andaman Experience" />
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-6">
          <BookingForm lockedTitle={locked} />
        </div>
      </section>
    </>
  );
}
