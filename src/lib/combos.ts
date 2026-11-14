import splashDashPoster from "@/assets/splash-dash.jpg.asset.json";
import bounceBrigadePoster from "@/assets/bounce-brigade.jpg.asset.json";
import reefNRidePoster from "@/assets/reef-n-ride.jpg.asset.json";
import coralCallingPoster from "@/assets/coral-calling.jpg.asset.json";
import flyAndFuryPoster from "@/assets/fly-and-fury.jpg.asset.json";
import dryHairDeepSeaPoster from "@/assets/dry-hair-deep-sea.jpg.asset.json";
import sunToStarsPoster from "@/assets/sun-to-stars.jpg.asset.json";
import diveAndFlyPoster from "@/assets/dive-and-fly.jpg.asset.json";
import fullHavelockPoster from "@/assets/the-full-havelock.jpg.asset.json";
import adrenalineOverboardPoster from "@/assets/adrenaline-overboard.jpg.asset.json";
import type { Experience } from "./site-data";

export const comboPriceNote = "*Price applicable only on online bookings";
export const comboSafety = "All activities depend on weather and sea conditions. Age, weight and medical limits of each individual activity apply.";
export const comboOffers = [
  { slug: "splash-dash", title: "Splash Dash", amount: 2700, image: splashDashPoster.url, activities: [["Jet Ski", "jet-ski"], ["Banana Ride", "banana-ride"], ["Sofa Ride", "sofa-ride"]] },
  { slug: "bounce-brigade", title: "Bounce Brigade", amount: 3700, image: bounceBrigadePoster.url, activities: [["Banana Ride", "banana-ride"], ["Sofa Ride", "sofa-ride"], ["Dragon Ride", "dragon-ride"], ["Disco Ride", "disco-ride"]] },
  { slug: "reef-n-ride", title: "Reef n Ride", amount: 5200, image: reefNRidePoster.url, activities: [["Premium Semisubmarine Glass Bottom", "glass-bottom"], ["Banana Ride", "banana-ride"], ["Dragon Ride", "dragon-ride"]] },
  { slug: "coral-calling", title: "Coral Calling", amount: 4500, image: coralCallingPoster.url, activities: [["Snorkeling 20 Minutes", "snorkeling-20-minutes"], ["Jet Ski", "jet-ski"], ["Banana Ride", "banana-ride"], ["Sofa Ride", "sofa-ride"]] },
  { slug: "fly-and-fury", title: "Fly & Fury", amount: 4200, image: flyAndFuryPoster.url, activities: [["Parasailing", "parasailing"], ["Jet Ski", "jet-ski"]] },
  { slug: "dry-hair-deep-sea", title: "Dry Hair Deep Sea", amount: 7000, image: dryHairDeepSeaPoster.url, activities: [["Sea Walk", "sea-walk"], ["Jet Ski", "jet-ski"], ["Banana Ride", "banana-ride"], ["Sofa Ride", "sofa-ride"]] },
  { slug: "sun-to-stars", title: "Sun to Stars", amount: 5700, image: sunToStarsPoster.url, activities: [["Kayaking Day", "kayaking-day"], ["Kayaking Night", "kayaking-night"]] },
  { slug: "dive-and-fly", title: "Dive & Fly", amount: 8000, image: diveAndFlyPoster.url, activities: [["Sea Scooter (Underwater Scooter)", "underwater-scooter"], ["Parasailing", "parasailing"]] },
  { slug: "the-full-havelock", title: "The Full Havelock", amount: 7000, image: fullHavelockPoster.url, activities: [["Parasailing", "parasailing"], ["Snorkeling", "snorkelling"], ["Jet Ski", "jet-ski"], ["Banana Ride", "banana-ride"]] },
  { slug: "adrenaline-overboard", title: "Adrenaline Overboard", amount: 9000, image: adrenalineOverboardPoster.url, activities: [["Parasailing", "parasailing"], ["Flying Board", "flying-board"], ["Jet Ski", "jet-ski"]] },
] as const;

export const combos: Experience[] = comboOffers.map((offer) => ({
  slug: offer.slug, title: offer.title, kind: "Combo", category: "Combo", image: offer.image,
  alt: `${offer.activities[0][0]} at Havelock Island`, location: "Elephant Beach, Havelock Island",
  timing: "Daily, weather and sea conditions permitting", duration: "—",
  price: `₹${offer.amount.toLocaleString("en-IN")} per person`, priceNote: comboPriceNote,
  limits: offer.slug === "dry-hair-deep-sea" ? "Ages 10 and above · Basic water confidence advised" : "Basic water confidence advised",
  overview: `${offer.activities.map(([label]) => label).join(", ")} at Elephant Beach.`,
  inclusions: [...offer.activities.map(([label]) => label), "Professional, experienced crew", "Safety briefing and required equipment", "Guided Canopus Marine experience"],
}));

export const comboLinks = [
  ["Splash Dash", "/combos/splash-dash"],
  ["Bounce Brigade", "/combos/bounce-brigade"],
  ["Reef n Ride", "/combos/reef-n-ride"],
  ["Coral Calling", "/combos/coral-calling"],
  ["Fly & Fury", "/combos/fly-and-fury"],
  ["Dry Hair Deep Sea", "/combos/dry-hair-deep-sea"],
  ["Sun to Stars", "/combos/sun-to-stars"],
  ["Dive & Fly", "/combos/dive-and-fly"],
  ["The Full Havelock", "/combos/the-full-havelock"],
  ["Adrenaline Overboard", "/combos/adrenaline-overboard"],
] as const;