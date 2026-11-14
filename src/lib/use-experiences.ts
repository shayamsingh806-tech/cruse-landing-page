import { useQuery } from "@tanstack/react-query";
import { getExperiences, type ExperienceRow } from "./content.functions";
import { experiences as staticExperiences, type Experience } from "./site-data";

// Map a database row to the shape the site components expect.
export function rowToExperience(r: ExperienceRow): Experience {
  return {
    slug: r.slug,
    title: r.title,
    ...(r.full_title ? { fullTitle: r.full_title } : {}),
    kind: r.kind,
    category: r.category as Experience["category"],
    image: r.image,
    alt: r.alt,
    location: r.location,
    timing: r.timing,
    duration: r.duration,
    price: r.price,
    ...(r.price_note ? { priceNote: r.price_note } : {}),
    limits: r.limits,
    overview: r.overview,
    ...(r.reporting ? { reporting: r.reporting } : {}),
    ...(r.inclusions ? { inclusions: r.inclusions } : {}),
    ...(r.exclusions ? { exclusions: r.exclusions } : {}),
    ...(r.add_ons ? { addOns: r.add_ons } : {}),
  };
}

// DB rows override the code defaults by slug; new DB-only slugs are appended.
export function mergeExperiences(rows: ExperienceRow[] | undefined): Experience[] {
  if (!rows || rows.length === 0) return staticExperiences;
  const visible = rows.filter((r) => !r.hidden);
  const staticBySlug = new Map(staticExperiences.map((s) => [s.slug, s]));
  const withFallback = (r: ExperienceRow): Experience => {
    const x = rowToExperience(r);
    const s = staticBySlug.get(r.slug);
    // Keep the code-bundled photo unless the admin supplied a replacement URL.
    if (!x.image && s) { x.image = s.image; x.alt = x.alt || s.alt; }
    // Offers set in code (discount price, highlights, rating) win over the database copy.
    if (s?.originalPrice) {
      x.price = s.price;
      x.originalPrice = s.originalPrice;
      if (s.priceNote) x.priceNote = s.priceNote;
    }
    if (s?.highlights) {
      x.highlights = s.highlights;
      const inc = x.inclusions ?? [];
      x.inclusions = [...inc, ...s.highlights.filter((h) => !inc.includes(h))];
    }
    if (s?.rating) x.rating = s.rating;
    return x;
  };
  const bySlug = new Map(visible.map((r) => [r.slug, withFallback(r)]));
  const merged = staticExperiences.map((s) => bySlug.get(s.slug) ?? s);
  for (const r of visible) {
    if (!staticExperiences.some((s) => s.slug === r.slug)) merged.push(withFallback(r));
  }
  return merged;
}

export function useExperiences(): Experience[] {
  const { data } = useQuery({
    queryKey: ["experiences"],
    queryFn: () => getExperiences(),
    staleTime: 60_000,
    retry: 1,
  });
  return mergeExperiences(data);
}
