import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CalendarDays, Clock, MapPin, Users, Volume2, VolumeX } from "lucide-react";
import { CardsGrid, HeroBanner, SectionHeading } from "@/components/site/sections";
import { BookingForm } from "@/components/site/BookingForm";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { Highlights, OfferPrice, RatingBadge } from "@/components/site/OfferBits";
import { Lightbox } from "@/components/site/Lightbox";
import { seo, breadcrumbLd, experienceLd, faqLd } from "@/lib/seo";
import { experienceBySlug } from "@/lib/site-data";
import { useExperiences } from "@/lib/use-experiences";
import { suggestFor } from "@/lib/cart";
import lc1 from "@/assets/lunch-cruise-1.jpg.asset.json";
import lc2 from "@/assets/lunch-cruise-2.jpg.asset.json";
import lc3 from "@/assets/lunch-cruise-3.jpg.asset.json";
import lc4 from "@/assets/lunch-cruise-4.jpg.asset.json";
import lc5 from "@/assets/lunch-cruise-5.jpg.asset.json";
import lc6 from "@/assets/lunch-cruise-6.jpg.asset.json";
import lc7 from "@/assets/lunch-cruise-7.jpg.asset.json";
import sc1 from "@/assets/sc-ABS06864.JPG.asset.json";
import sc2 from "@/assets/sc-tmp5w5cvdll.jpg.asset.json";
import sc3 from "@/assets/sc-tmpnxr4g0d5.jpg.asset.json";
import sc4 from "@/assets/sc-DSC_9406.JPG.asset.json";
import sc5 from "@/assets/sc-DSC_9413.JPG.asset.json";
import dc1 from "@/assets/dinner-cruise-1.jpg.asset.json";
import dc2 from "@/assets/dinner-cruise-2.jpg.asset.json";
import dc3 from "@/assets/dinner-cruise-3.jpg.asset.json";
import dc4 from "@/assets/dinner-cruise-4.jpg.asset.json";
import dc5 from "@/assets/dinner-cruise-5.jpg.asset.json";
import scVideo from "@/assets/sunset-cruise-moments.mp4.asset.json";
import scVideoPoster from "@/assets/sunset-cruise-moments-poster.jpg.asset.json";

// Photo galleries shown below the text on specific experience pages.
const GALLERIES: Record<string, { src: string; alt: string }[]> = {
  "lunch-cruise": [
    { src: lc1.url, alt: "Guests watching the reef through the semi-submarine's underwater windows" },
    { src: lc2.url, alt: "A family enjoying lunch on board during the cruise" },
    { src: lc3.url, alt: "A father and child enjoying the underwater viewing deck" },
    { src: lc4.url, alt: "A guest smiling in the semi-submarine cabin" },
    { src: lc5.url, alt: "Lunch served on board the cruise" },
    { src: lc6.url, alt: "A family seated together for lunch on the cruise" },
    { src: lc7.url, alt: "A full cabin of guests enjoying the lunch cruise" },
  ],
  "dinner-cruise": [
    { src: dc1.url, alt: "A couple posing inside the illuminated dinner cruise cabin" },
    { src: dc2.url, alt: "A celebration cake served on board during the dinner cruise" },
    { src: dc3.url, alt: "A guest smiling while being photographed on board during the dinner cruise" },
    { src: dc4.url, alt: "A couple enjoying a candle-lit dinner on the open deck at night" },
    { src: dc5.url, alt: "Guests enjoying drinks and dinner on board at night" },
  ],
  "sunset-cruise": [
    { src: sc1.url, alt: "Guests raising a toast with welcome drinks on deck at golden hour" },
    { src: sc2.url, alt: "Guests silhouetted against the sunset sky from the cruise deck" },
    { src: sc3.url, alt: "A family posing on the open deck of the sunset cruise" },
    { src: sc4.url, alt: "A couple enjoying the evening on board with the semi-submarine behind" },
    { src: sc5.url, alt: "A couple silhouetted against the setting sun on the sunset cruise" },
  ],
};

// Featured video shown in the "Moments from the Cruise" gallery section.
const FEATURED_VIDEO: Record<string, { src: string; poster: string }> = {
  "sunset-cruise": {
    src: scVideo.url,
    poster: scVideoPoster.url,
  },
};

export const Route = createFileRoute("/experiences/$slug")({
  loader: ({ params }) => {
    const item = experienceBySlug[params.slug];
    if (!item) throw notFound();
    return item;
  },
  head: ({ loaderData, params }) => {
    const title = loaderData?.seoTitle ?? `${loaderData?.fullTitle ?? loaderData?.title ?? "Experience"} | Canopus Marine`;
    const desc = loaderData?.seoDescription ?? loaderData?.overview ?? "Explore the Andaman Sea with Canopus Marine.";
    const path = `/experiences/${params.slug}`;
    const parent: [string, string] = loaderData?.kind === "Cruise" ? ["Cruises", "/cruises"] : ["Activities", "/activities"];
    return {
      ...seo(path, [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ]),
      scripts: [
        breadcrumbLd([["Home", "/"], parent, [loaderData?.title ?? "Experience", path]]),
        ...(loaderData ? [experienceLd(loaderData)] : []),
        ...(loaderData?.faqs?.length ? [faqLd(loaderData.faqs)] : []),
      ],
    };
  },
  component: Page,
});

function Page() {
  const staticItem = Route.useLoaderData();
  const all = useExperiences();
  // Live DB content wins over the static loader data once loaded.
  const x = all.find((y) => y.slug === staticItem.slug) ?? staticItem;
  const related = suggestFor(all, [x.title], x.kind);
  const displayTitle = x.fullTitle ?? x.title;
  const gallery = GALLERIES[x.slug];
  const featuredVideo = FEATURED_VIDEO[x.slug];
  const videoRef = useRef<HTMLVideoElement>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = !soundOn;
  }, [soundOn]);
  return (
    <>
      <HeroBanner {...(x.kind === "Cruise" ? {} : { image: x.image })} title={displayTitle} eyebrow={`${x.kind} · Canopus Marine`}>
        <Link to={x.kind === "Cruise" ? "/cruises" : "/activities"}>Home / {x.kind}s / {x.title}</Link>
      </HeroBanner>

      <section className="py-20">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-6 lg:grid-cols-[1fr_360px]">
          <article>
            <SectionHeading kicker="The Experience" title={`Discover ${x.title}`} />
            {x.rating && <div className="mt-4"><RatingBadge rating={x.rating} /></div>}
            {x.highlights && <Highlights items={x.highlights} className="mt-4" />}
            <p className="mt-6 text-lg leading-8 text-muted-foreground">{x.overview}</p>

            <div className="mt-10 grid grid-cols-2 gap-4 bg-muted p-6">
              <Fact icon={<MapPin />} label="Location" value={x.location} />
              <Fact icon={<Clock />} label="Duration" value={x.duration} />
              <Fact icon={<CalendarDays />} label="Timing" value={x.timing} />
              {x.reporting ? <Fact icon={<CalendarDays />} label="Reporting Time" value={x.reporting} /> : <Fact icon={<Users />} label="Guest notes" value={x.limits} />}
              {x.reporting && <Fact icon={<Users />} label="Guest notes" value={x.limits} />}
            </div>

            {x.sections?.map((sec) => (
              <section key={sec.heading} className="mt-12">
                <h2 className="text-2xl font-bold">{sec.heading}</h2>
                {sec.body.map((p) => <p key={p.slice(0, 40)} className="mt-4 leading-7 text-muted-foreground">{p}</p>)}
              </section>
            ))}

            <div className="mt-12 grid gap-10 md:grid-cols-2">
              <div>
                <h2 className="text-2xl font-bold">What's included</h2>
                <ul className="mt-4 grid gap-2 text-muted-foreground">
                  {(x.inclusions ?? ["Professional, experienced crew", "Safety briefing and required equipment", "Guided Canopus Marine experience"]).map((item) => (
                    <li key={item} className="flex gap-2"><span className="text-primary">•</span>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Good to know / Safety</h2>
                <p className="mt-4 leading-7 text-muted-foreground">Activities depend on weather and sea conditions. Please follow the crew's safety instructions and share any relevant medical needs before departure.</p>
              </div>
            </div>

            {x.exclusions && x.exclusions.length > 0 && (
              <div className="mt-10">
                <h2 className="text-2xl font-bold">What's not included</h2>
                <ul className="mt-4 grid gap-2 text-muted-foreground">
                  {x.exclusions.map((item) => (
                    <li key={item} className="flex gap-2"><span className="text-muted-foreground/70">–</span>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {x.addOns && x.addOns.length > 0 && (
              <div className="mt-10">
                <h2 className="text-2xl font-bold">Add-ons</h2>
                <ul className="mt-4 grid gap-2 text-muted-foreground">
                  {x.addOns.map((item) => (
                    <li key={item} className="flex gap-2"><span className="text-primary">+</span>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {x.faqs && x.faqs.length > 0 && (
              <section className="mt-14">
                <h2 className="text-2xl font-bold">{x.fullTitle ?? x.title} — FAQs</h2>
                <div className="mt-6 divide-y divide-border rounded-xl border border-border bg-card">
                  {x.faqs.map((f, i) => (
                    <details key={f.q} className="group p-5" open={i === 0}>
                      <summary className="cursor-pointer list-none font-semibold text-foreground marker:hidden">
                        <h3 className="inline text-base">{f.q}</h3>
                        <span className="float-right text-primary transition-transform group-open:rotate-45">+</span>
                      </summary>
                      <p className="mt-3 leading-7 text-muted-foreground">{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {gallery && (
              <div className="mt-14">
                <SectionHeading kicker="On Board" title="Moments from the Cruise" />
                <div className={`mt-8 grid gap-5 ${featuredVideo ? "lg:grid-cols-[minmax(0,290px)_1fr] lg:items-start lg:gap-8" : ""}`}>
                  {featuredVideo && (
                    <figure className="mx-auto w-full max-w-[290px] lg:mx-0">
                      <div className="relative overflow-hidden rounded-xl shadow-lg">
                        <video
                          ref={videoRef}
                          src={featuredVideo.src}
                          poster={featuredVideo.poster}
                          aria-label="Video: moments from the sunset cruise"
                          autoPlay
                          muted={!soundOn}
                          loop
                          playsInline
                          preload="metadata"
                          controlsList="nodownload"
                          disablePictureInPicture
                          onContextMenu={(e) => e.preventDefault()}
                          className="aspect-[9/16] w-full bg-foreground object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = !soundOn;
                            setSoundOn(next);
                            if (next) void videoRef.current?.play();
                          }}
                          aria-label={soundOn ? "Turn video sound off" : "Turn video sound on"}
                          className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-background/85 text-primary shadow-md transition-colors hover:bg-background"
                        >
                          {soundOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                        </button>
                      </div>
                    </figure>
                  )}
                  <div className={`grid grid-cols-2 gap-4 ${featuredVideo ? "" : "md:grid-cols-3"}`}>
                    {gallery.map((g, i) => {
                      const fillRow = Boolean(featuredVideo) && i === gallery.length - 1 && gallery.length % 2 === 1;
                      return (
                        <button
                          key={g.src}
                          type="button"
                          onClick={() => setLightboxIndex(i)}
                          aria-label={`View larger: ${g.alt}`}
                          className={`group cursor-zoom-in overflow-hidden rounded-xl shadow-sm ${fillRow ? "col-span-2" : ""}`}
                        >
                          <img
                            src={g.src}
                            alt={g.alt}
                            loading="lazy"
                            className={`${fillRow ? "aspect-[11/4]" : "aspect-[4/3]"} w-full object-cover transition-transform duration-500 group-hover:scale-105`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </article>

          <aside className="h-fit bg-card p-7 shadow-lg lg:sticky lg:top-28">
            <p className="text-sm font-bold uppercase text-primary">Book this experience</p>
            <div className="mt-2"><OfferPrice x={x} /></div>
            {x.priceNote && <p className="mt-2 text-sm text-muted-foreground">{x.priceNote}</p>}
            {x.highlights && <Highlights items={x.highlights} className="mt-4" />}
            {x.rating && <div className="mt-4 rounded-md bg-muted px-3 py-2"><RatingBadge rating={x.rating} /></div>}
            <WhatsAppButton product={x} size="lg" className="mt-5 w-full" />
            <p className="mt-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">or fill in your details</p>
            <div className="mt-4">
              <BookingForm lockedTitle={x.title} compact />
            </div>
          </aside>
        </div>
      </section>

      {gallery && (
        <Lightbox
          images={gallery}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}

      <section className="bg-muted py-20">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <SectionHeading kicker="Complete Your Trip" title="You May Also Like" />
          <div className="mt-10">
            <CardsGrid items={related} />
          </div>
        </div>
      </section>
    </>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <span className="text-primary">{icon}</span>
      <p className="mt-2 text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}
