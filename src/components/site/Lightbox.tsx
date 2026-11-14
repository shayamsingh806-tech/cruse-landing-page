import { useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type LightboxProps = {
  images: { src: string; alt: string }[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export function Lightbox({ images, index, onClose, onNavigate }: LightboxProps) {
  const open = index !== null;
  const prev = useCallback(() => {
    if (index === null) return;
    onNavigate((index - 1 + images.length) % images.length);
  }, [index, images.length, onNavigate]);
  const next = useCallback(() => {
    if (index === null) return;
    onNavigate((index + 1) % images.length);
  }, [index, images.length, onNavigate]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, prev, next]);

  if (!open || index === null || !images[index]) return null;
  const image = images[index]!;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Close photo"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-card/80 p-2 text-foreground shadow-md transition-colors hover:bg-card"
      >
        <X className="h-6 w-6" />
      </button>

      <button
        type="button"
        aria-label="Previous photo"
        onClick={(e) => { e.stopPropagation(); prev(); }}
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-card/80 p-2 text-foreground shadow-md transition-colors hover:bg-card md:left-6"
      >
        <ChevronLeft className="h-7 w-7" />
      </button>

      <div className="flex max-h-full max-w-5xl flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <img
          src={image.src}
          alt={image.alt}
          className="max-h-[80vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
        />
      </div>

      <button
        type="button"
        aria-label="Next photo"
        onClick={(e) => { e.stopPropagation(); next(); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-card/80 p-2 text-foreground shadow-md transition-colors hover:bg-card md:right-6"
      >
        <ChevronRight className="h-7 w-7" />
      </button>
    </div>
  );
}
