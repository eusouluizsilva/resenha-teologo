import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function VerseOfDay() {
  const verse = useQuery(api.dailyVerses.getToday);

  if (!verse) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 h-48 lg:h-full">
      {/* Background */}
      {verse.imageUrl ? (
        <img
          src={verse.imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/30" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full p-6">
        <div>
          <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">
            Versículo do Dia
          </p>
          <p className="text-white font-bold text-lg">{verse.reference}</p>
        </div>
        <p className="text-white/90 text-base leading-relaxed line-clamp-4">
          "{verse.text}"
        </p>
      </div>
    </div>
  );
}
