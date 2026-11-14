import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { seo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { HeroBanner, SectionHeading } from "@/components/site/sections";
import { Lightbox } from "@/components/site/Lightbox";

import g01 from "@/assets/gallery-01-jetty-aerial.webp.asset.json";
import g02 from "@/assets/gallery-02-semisub-jetty.jpg.asset.json";
import g03 from "@/assets/gallery-03-semisub-dusk.jpg.asset.json";
import g04 from "@/assets/gallery-04-aarya-aerial.jpg.asset.json";
import g05 from "@/assets/gallery-05-aarya-guests.webp.asset.json";
import g06 from "@/assets/gallery-06-parasailing.webp.asset.json";
import g07 from "@/assets/gallery-07-jetski-1.webp.asset.json";
import g08 from "@/assets/gallery-08-jetski-2.webp.asset.json";
import video from "@/assets/sunset-cruise-moments.mp4.asset.json";
import videoPoster from "@/assets/sunset-cruise-moments-poster.jpg.asset.json";
import duskVideo from "@/assets/gallery-cruise-dusk.mp4.asset.json";
import duskPoster from "@/assets/gallery-cruise-dusk-poster.jpg.asset.json";
import aaryaVideo from "@/assets/gallery-aarya-cruise.mp4.asset.json";
import aaryaPoster from "@/assets/gallery-aarya-cruise-poster.jpg.asset.json";
import promoVideo from "@/assets/gallery-watersports-promo.mp4.asset.json";
import promoPoster from "@/assets/gallery-watersports-promo-poster.jpg.asset.json";
import jetskiVideo from "@/assets/gallery-jetski-ride.mp4.asset.json";
import jetskiPoster from "@/assets/gallery-jetski-ride-poster.jpg.asset.json";

export const Route = createFileRoute("/gallery")({
  head: () => seo("/gallery", [
    { title: "Gallery | Canopus Marine Andaman" },
    { name: "description", content: "See Canopus Marine cruises, watersports and island moments across Havelock and Port Blair." },
    { property: "og:title", content: "Canopus Marine Gallery" },
    { property: "og:description", content: "A glimpse of life above and below the Andaman Sea." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]),
  component: Page,
});

const PHOTOS: { src: string; alt: string }[] = [
  { src: g01.url, alt: "Aerial view of the coastline and jetty on Havelock Island" },
  { src: g02.url, alt: "Our semi-submarine docked at the jetty with Canopus Aarya cruising past" },
  { src: g03.url, alt: "Our semi-submarine cruising at dusk" },
  { src: g04.url, alt: "Canopus Aarya seen from above on the open Andaman Sea" },
  { src: g05.url, alt: "Guests in life jackets enjoying a ride on board Canopus Aarya" },
  { src: g06.url, alt: "Parasailing over the sea against the setting sun" },
  { src: g07.url, alt: "Guests splashing through the waves on a jet ski ride" },
  { src: g08.url, alt: "A couple riding a jet ski across turquoise waters" },
];

function Page() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [soundOn, setSoundOn] = useState(false);
  const duskRef = useRef<HTMLVideoElement>(null);
  const [duskSoundOn, setDuskSoundOn] = useState(false);
  const aaryaRef = useRef<HTMLVideoElement>(null);
  const [aaryaSoundOn, setAaryaSoundOn] = useState(false);
  const promoRef = useRef<HTMLVideoElement>(null);
  const [promoSoundOn, setPromoSoundOn] = useState(false);
  const jetskiRef = useRef<HTMLVideoElement>(null);
  const [jetskiSoundOn, setJetskiSoundOn] = useState(false);
  const clipsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = !soundOn;
  }, [soundOn]);

  useEffect(() => {
    if (duskRef.current) duskRef.current.muted = !duskSoundOn;
  }, [duskSoundOn]);

  useEffect(() => {
    if (aaryaRef.current) aaryaRef.current.muted = !aaryaSoundOn;
  }, [aaryaSoundOn]);

  useEffect(() => {
    if (promoRef.current) promoRef.current.muted = !promoSoundOn;
  }, [promoSoundOn]);

  useEffect(() => {
    if (jetskiRef.current) jetskiRef.current.muted = !jetskiSoundOn;
  }, [jetskiSoundOn]);

  // With four clips on one page, keep only the ones on screen playing.
  useEffect(() => {
    const clips = clipsRef.current ? Array.from(clipsRef.current.querySelectorAll("video")) : [];
    if (clips.length === 0 || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const clip = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            if (clip.paused) void clip.play().catch(() => {});
          } else {
            clip.pause();
          }
        });
      },
      { threshold: 0.15 },
    );
    clips.forEach((clip) => observer.observe(clip));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <HeroBanner title="Life on the Andaman Sea" />
      <section ref={clipsRef} className="py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeading kicker="Gallery" title="Moments from the Andamans" />
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            A glimpse of our cruises, watersports and the islands we call home. Click any photo to view it larger.
          </p>
          <figure className="mt-10">
            <div className="relative overflow-hidden rounded-xl shadow-lg">
              <video
                ref={duskRef}
                src={duskVideo.url}
                poster={duskPoster.url}
                aria-label="Video: the Canopus cruise vessel lit up at dusk beside the jetty"
                autoPlay
                muted={!duskSoundOn}
                loop
                playsInline
                preload="metadata"
                controlsList="nodownload"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                className="aspect-[21/9] max-h-[62vh] w-full bg-foreground object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  const next = !duskSoundOn;
                  setDuskSoundOn(next);
                  if (next) void duskRef.current?.play();
                }}
                aria-label={duskSoundOn ? "Turn video sound off" : "Turn video sound on"}
                className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-background/85 text-primary shadow-md transition-colors hover:bg-background"
              >
                {duskSoundOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              </button>
            </div>
          </figure>
          <figure className="mt-10">
            <div className="relative overflow-hidden rounded-xl shadow-lg">
              <video
                ref={promoRef}
                src={promoVideo.url}
                poster={promoPoster.url}
                aria-label="Video: a Canopus Marine watersports reel with parasailing, jet ski rides and an aerial view of the beach"
                autoPlay
                muted={!promoSoundOn}
                loop
                playsInline
                preload="metadata"
                controlsList="nodownload"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                className="aspect-video w-full bg-foreground object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  const next = !promoSoundOn;
                  setPromoSoundOn(next);
                  if (next) void promoRef.current?.play();
                }}
                aria-label={promoSoundOn ? "Turn video sound off" : "Turn video sound on"}
                className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-background/85 text-primary shadow-md transition-colors hover:bg-background"
              >
                {promoSoundOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              </button>
            </div>
          </figure>
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,300px)_1fr] lg:items-stretch">
            <figure className="mx-auto w-full max-w-[300px] lg:mx-0 lg:max-w-none">
              <div className="relative h-full overflow-hidden rounded-xl shadow-lg">
                <video
                  ref={videoRef}
                  src={video.url}
                  poster={videoPoster.url}
                  aria-label="Video: moments from the sunset cruise"
                  autoPlay
                  muted={!soundOn}
                  loop
                  playsInline
                  preload="metadata"
                  controlsList="nodownload"
                  disablePictureInPicture
                  onContextMenu={(e) => e.preventDefault()}
                  className="h-full max-h-[70vh] w-full bg-foreground object-cover"
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
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {PHOTOS.map((photo, i) => {
                const fillRow = i === PHOTOS.length - 1 && PHOTOS.length % 3 !== 0;
                return (
                  <button
                    key={photo.src}
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    aria-label={`View larger: ${photo.alt}`}
                    className={`group overflow-hidden rounded-xl shadow-sm transition-shadow hover:shadow-md ${fillRow ? "md:col-span-2" : ""}`}
                  >
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      loading="lazy"
                      className={`aspect-[4/3] h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${fillRow ? "md:aspect-[8/3]" : ""}`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
          <figure className="mt-8">
            <div className="relative overflow-hidden rounded-xl shadow-lg">
              <video
                ref={aaryaRef}
                src={aaryaVideo.url}
                poster={aaryaPoster.url}
                aria-label="Video: guests waving from the Canopus Aarya as it cruises across the Andaman Sea"
                autoPlay
                muted={!aaryaSoundOn}
                loop
                playsInline
                preload="metadata"
                controlsList="nodownload"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                className="aspect-[2/1] max-h-[58vh] w-full bg-foreground object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  const next = !aaryaSoundOn;
                  setAaryaSoundOn(next);
                  if (next) void aaryaRef.current?.play();
                }}
                aria-label={aaryaSoundOn ? "Turn video sound off" : "Turn video sound on"}
                className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-background/85 text-primary shadow-md transition-colors hover:bg-background"
              >
                {aaryaSoundOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              </button>
            </div>
          </figure>
          <figure className="mt-8">
            <div className="relative overflow-hidden rounded-xl shadow-lg">
              <video
                ref={jetskiRef}
                src={jetskiVideo.url}
                poster={jetskiPoster.url}
                aria-label="Video: guests riding a jet ski across the sea with Canopus Marine"
                autoPlay
                muted={!jetskiSoundOn}
                loop
                playsInline
                preload="metadata"
                controlsList="nodownload"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                className="aspect-video w-full bg-foreground object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  const next = !jetskiSoundOn;
                  setJetskiSoundOn(next);
                  if (next) void jetskiRef.current?.play();
                }}
                aria-label={jetskiSoundOn ? "Turn video sound off" : "Turn video sound on"}
                className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-background/85 text-primary shadow-md transition-colors hover:bg-background"
              >
                {jetskiSoundOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              </button>
            </div>
          </figure>
        </div>
      </section>
      <Lightbox
        images={PHOTOS}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </>
  );
}
