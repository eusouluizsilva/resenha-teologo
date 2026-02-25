import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";

const SLIDE_DURATION = 5000;

export default function AnnouncementsCarousel() {
  const announcements = useQuery(api.announcements.list);
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);

  const count = announcements?.length ?? 0;

  useEffect(() => {
    if (count <= 1) return;

    // Reset progress bar instantly, then animate to 100% over SLIDE_DURATION
    setProgress(0);
    const startProgress = setTimeout(() => setProgress(100), 30);

    // Advance to next slide
    const advance = setTimeout(() => {
      setCurrent((i) => (i + 1) % count);
    }, SLIDE_DURATION);

    return () => {
      clearTimeout(startProgress);
      clearTimeout(advance);
    };
  }, [current, count]);

  if (!announcements || count === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-800 h-80 lg:h-full relative">
      {/* Slides */}
      {announcements.map((slide, i) => {
        const isActive = i === current;
        const inner = (
          <>
            <img
              src={slide.imageUrl}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 pb-8">
              <p className="text-white font-bold text-lg leading-snug drop-shadow">
                {slide.title}
              </p>
              {slide.description && (
                <p className="text-slate-300 text-sm mt-1 line-clamp-2 drop-shadow">
                  {slide.description}
                </p>
              )}
            </div>
          </>
        );

        const wrapperClass = `absolute inset-0 transition-opacity duration-700 ${
          isActive ? "opacity-100 z-10" : "opacity-0 z-0"
        }`;

        return slide.linkUrl ? (
          <a
            key={slide._id}
            href={slide.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={wrapperClass + " hover:brightness-105 transition-[filter,opacity] duration-700"}
          >
            {inner}
          </a>
        ) : (
          <div key={slide._id} className={wrapperClass}>
            {inner}
          </div>
        );
      })}

      {/* Dot indicators */}
      {count > 1 && (
        <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
          {announcements.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-5 h-1.5 bg-white"
                  : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {count > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-20 h-[3px] bg-white/10">
          <div
            className="h-full bg-white"
            style={{
              width: `${progress}%`,
              transition:
                progress === 0 ? "none" : `width ${SLIDE_DURATION}ms linear`,
            }}
          />
        </div>
      )}
    </div>
  );
}
