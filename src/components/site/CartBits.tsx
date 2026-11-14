import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import type { Experience } from "@/lib/site-data";
import { ExperienceLink } from "./ExperienceLink";
import { useCart } from "@/lib/cart";

export function CartButton({ className = "" }: { className?: string }) {
  const n = useCart().length;
  return (
    <Link to="/cart" aria-label={`Cart, ${n} item(s)`} className={`relative inline-flex size-11 items-center justify-center rounded-md hover:bg-muted ${className}`}>
      <ShoppingBag className="size-6" />
      {n > 0 && <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{n}</span>}
    </Link>
  );
}

export function MiniSuggestions({ items, onPick }: { items: Experience[]; onPick?: () => void }) {
  if (!items.length) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((x) => (
        <ExperienceLink key={x.slug} slug={x.slug} onClick={onPick} className="group overflow-hidden rounded-lg border bg-card text-left transition hover:shadow-md">
          {x.image && <img src={x.image} alt={x.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />}
          <div className="p-3">
            <p className="text-xs uppercase text-muted-foreground">{x.kind}</p>
            <p className="font-bold leading-tight group-hover:text-primary">{x.title}</p>
            <p className="mt-1 text-sm text-primary">{x.price}</p>
            {x.kind === "Combo" && <p className="mt-1 text-xs text-muted-foreground">{x.priceNote}</p>}
            <p className="mt-2 text-xs font-semibold underline">Add to trip →</p>
          </div>
        </ExperienceLink>
      ))}
    </div>
  );
}
