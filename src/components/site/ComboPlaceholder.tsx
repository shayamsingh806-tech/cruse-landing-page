import { seo, breadcrumbLd, experienceLd, itemListLd } from "@/lib/seo";
import { Link } from "@tanstack/react-router";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { HeroBanner, SectionHeading, CardsGrid, Kicker } from "@/components/site/sections";
import { BookingForm } from "./BookingForm";
import { combos, comboOffers, comboSafety, comboPriceNote } from "@/lib/combos";
import { useExperiences } from "@/lib/use-experiences";

export function comboHead(name: string, path: string) {
  const item = combos.find(x => x.title === name);
  const title = `${name} | Canopus Marine`;
  const description = item ? `${name}: ${item.overview} ${item.price}. Online bookings only.` : "Explore ten Canopus Marine watersports combos at Elephant Beach, Havelock Island, with online-only per-person prices.";
  return {
    ...seo(path, [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
      ...(item?.image.startsWith("https://") ? [{ property: "og:image", content: item.image }, { name: "twitter:image", content: item.image }] : []),
    ]),
    scripts: [breadcrumbLd(item ? [["Home", "/"], ["Combos", "/combos"], [name, path]] : [["Home", "/"], ["Combos", "/combos"]]), item ? experienceLd(item) : itemListLd("Elephant Beach Combos", "/combos", combos)],
  };
}

export function ComboDetailPlaceholder({ name }: { name: string }) {
  const all = useExperiences();
  const offer = comboOffers.find(x => x.title === name);
  const x = all.find(x => x.kind === "Combo" && x.title === name) ?? combos.find(x => x.title === name);
  if (!x || !offer) return null;
  return <>
    <HeroBanner image={x.image} title={name} eyebrow="Combo · Canopus Marine">
      <Link to="/">Home</Link> / <Link to="/combos">Combos</Link> / {name}
    </HeroBanner>
    <section className="py-20">
      <div className="mx-auto grid max-w-[1200px] gap-12 px-6 lg:grid-cols-[1fr_360px]">
        <article>
          <SectionHeading kicker="The Experience" title={`Discover ${name}`} />
          <p className="mt-6 text-lg leading-8 text-muted-foreground">{x.overview}</p>
          <div className="mt-10 grid grid-cols-2 gap-4 bg-muted p-6">
            {[
              { Icon: MapPin, label: "Location", value: x.location },
              { Icon: Clock, label: "Duration", value: x.duration },
              { Icon: CalendarDays, label: "Timing", value: x.timing },
              { Icon: Users, label: "Guest notes", value: x.limits },
            ].map(({ Icon, label, value }) => <div key={label}><Icon className="text-primary" /><p className="mt-2 text-xs uppercase text-muted-foreground">{label}</p><p className="mt-1 font-bold">{value}</p></div>)}
          </div>
          <div className="mt-12 grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold">What's included</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 leading-7 text-muted-foreground">
                {offer.activities.map(([label, slug]) => <li key={slug}><Link to="/experiences/$slug" params={{ slug }} className="text-primary underline underline-offset-4">{label}</Link></li>)}
                <li>Professional, experienced crew</li><li>Safety briefing and required equipment</li><li>Guided Canopus Marine experience</li>
              </ul>
            </div>
            <div><h2 className="text-2xl font-bold">Good to know / Safety</h2><p className="mt-4 leading-7 text-muted-foreground">Activities depend on weather and sea conditions. Please follow the crew's safety instructions and share any relevant medical needs before departure.</p><p className="mt-4 leading-7 text-muted-foreground">{comboSafety}</p></div>
          </div>
        </article>
        <aside className="h-fit bg-card p-7 shadow-lg lg:sticky lg:top-28">
          <p className="text-sm font-bold uppercase text-primary">Book this experience</p>
          <h2 className="mt-2 text-3xl font-bold">{x.price}</h2><p className="mt-2 text-sm text-muted-foreground">{comboPriceNote}</p>
          <div className="mt-6"><BookingForm lockedTitle={x.title} compact /></div>
        </aside>
      </div>
    </section>
  </>;
}

export function ComboPlaceholder({ name }: { name: string }) {
  const items = useExperiences().filter(x => x.kind === "Combo");
  return <section className="mx-auto max-w-[1400px] px-6 py-20 lg:px-8"><Kicker>Elephant Beach · Havelock Island</Kicker><h1 className="text-4xl font-bold leading-tight md:text-5xl">{name}</h1><div className="mt-10"><CardsGrid items={items} /></div></section>;
}
