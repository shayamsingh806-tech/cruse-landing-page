import { Crown, Star } from "lucide-react";
import type { Experience } from "@/lib/site-data";

const num = (p?: string) => {
  const m = p?.replace(/,/g, "").match(/₹\s*(\d+)/);
  return m ? Number(m[1]) : null;
};

/** "5.0 ★★★★★ · 3,000+ reviews" badge. */
export function RatingBadge({ rating, light = false }: { rating: NonNullable<Experience["rating"]>; light?: boolean }) {
  return (
    <div className={`inline-flex flex-wrap items-center gap-2 text-sm font-semibold ${light ? "text-background" : "text-foreground"}`}>
      <span className="flex" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={`size-4 ${i < Math.round(rating.score) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
        ))}
      </span>
      <span>
        {rating.score.toFixed(1)} rating · {rating.count} happy customers
      </span>
    </div>
  );
}

/** Gold chips for selling points such as VIP access. */
export function Highlights({ items, className = "" }: { items: string[]; className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((h) => (
        <li key={h} className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-900">
          <Crown className="size-4" />
          {h}
        </li>
      ))}
    </ul>
  );
}

/** Price with the regular price struck through and a "Save ₹X" tag when an offer is running. */
export function OfferPrice({ x }: { x: Pick<Experience, "price" | "originalPrice"> }) {
  const now = num(x.price);
  const was = num(x.originalPrice);
  const save = now && was && was > now ? was - now : null;
  const pct = save && was ? Math.round((save / was) * 100) : null;
  return (
    <div>
      {save && (
        <p className="mb-2 inline-block rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
          Special offer · {pct}% off
        </p>
      )}
      {x.originalPrice && (
        <p className="text-lg text-muted-foreground">
          <s>{x.originalPrice}</s>
        </p>
      )}
      <h2 className="text-3xl font-bold">
        {x.price}
        {save && <span className="ml-1 align-middle text-base font-semibold text-primary"> only</span>}
      </h2>
      {save && <p className="mt-1 text-sm font-bold text-green-700">You save ₹{save.toLocaleString("en-IN")} per person</p>}
    </div>
  );
}
