import { useSyncExternalStore } from "react";
import type { Experience } from "./site-data";

// Guest's multi-experience cart, kept in the browser until checkout.
export type CartItem = {
  id: string;
  slug: string;
  title: string;
  date: string;
  guests: number;
  adults?: number;
  children?: number;
  infants?: number;
};

const KEY = "canopus-cart-v1";
const EMPTY: CartItem[] = [];
let cache: CartItem[] | null = null;
const listeners = new Set<() => void>();

function read(): CartItem[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(v) ? v : [];
  } catch {
    cache = [];
  }
  return cache;
}
function write(items: CartItem[]) {
  cache = items;
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

export const cart = {
  add(item: Omit<CartItem, "id">) {
    write([...read(), { ...item, id: Math.random().toString(36).slice(2, 10) }]);
  },
  remove(id: string) {
    write(read().filter((x) => x.id !== id));
  },
  update(id: string, patch: Partial<Omit<CartItem, "id" | "slug" | "title">>) {
    write(read().map((x) => (x.id === id ? { ...x, ...patch } : x)));
  },
  merge(items: Omit<CartItem, "id">[]) {
    const existing = read();
    const fresh = items
      .filter((i) => i.slug && i.title && i.date && i.guests > 0)
      .filter((i) => !existing.some((e) => e.slug === i.slug && e.date === i.date))
      .map((i) => ({ ...i, id: Math.random().toString(36).slice(2, 10) }));
    if (fresh.length) write([...existing, ...fresh]);
    return fresh.length;
  },
  clear() {
    write([]);
  },
};

// Encode a cart into a URL-safe string so guests can save it and return later,
// from any device. decodeSavedCart validates and drops anything malformed.
export function encodeCart(items: CartItem[]): string {
  const slim = items.map(({ slug, title, date, guests, adults, children, infants }) => ({ slug, title, date, guests, adults, children, infants }));
  return btoa(unescape(encodeURIComponent(JSON.stringify(slim)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function decodeSavedCart(param: string | undefined): Omit<CartItem, "id">[] {
  if (!param) return [];
  try {
    const b64 = param.replace(/-/g, "+").replace(/_/g, "/");
    const v = JSON.parse(decodeURIComponent(escape(atob(b64))));
    if (!Array.isArray(v)) return [];
    return v.filter(
      (i): i is Omit<CartItem, "id"> =>
        i && typeof i.slug === "string" && typeof i.title === "string" && typeof i.date === "string" && typeof i.guests === "number" && i.guests > 0,
    );
  } catch {
    return [];
  }
}

export function useCart(): CartItem[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => EMPTY,
  );
}

export function rupees(price: string | undefined) {
  const m = (price ?? "").replace(/,/g, "").match(/₹\s*(\d+)/);
  return m ? Number(m[1]) : null;
}
export function hasAgePricing(x: { priceNote?: string | undefined } | undefined) {
  return guestPricingMode(x) !== "standard";
}
export function guestPricingMode(x: { priceNote?: string | undefined } | undefined): "standard" | "child-rate" | "infant-free" {
  if (x?.priceNote?.includes("Children (4–12 yrs)")) return "child-rate";
  if (x?.priceNote?.includes("Infants (below 3 yrs): Free")) return "infant-free";
  return "standard";
}
export function itemTotal(x: { price: string; priceNote?: string | undefined } | undefined, it: Pick<CartItem, "guests" | "adults" | "children">) {
  const unit = rupees(x?.price);
  if (!unit) return null;
  const mode = guestPricingMode(x);
  if (mode === "child-rate") return unit * (it.adults ?? it.guests) + (rupees(x?.priceNote) ?? 0) * (it.children ?? 0);
  if (mode === "infant-free") return unit * ((it.adults ?? it.guests) + (it.children ?? 0));
  return unit * it.guests;
}

// Cross-sell: favour the other kind (cruise ↔ activity), then fill with same kind.
export function suggestFor(all: Experience[], exclude: string[], kind?: string, n = 3) {
  const pool = all.filter((x) => !exclude.includes(x.title) && rupees(x.price));
  const other = pool.filter((x) => x.kind !== kind);
  const same = pool.filter((x) => x.kind === kind);
  return [...other.slice(0, 2), ...same, ...other.slice(2)].slice(0, n);
}
