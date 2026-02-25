import { Link } from "react-router-dom";
import type { Id } from "../../../convex/_generated/dataModel";

interface NetflixCourseCardProps {
  id: Id<"courses">;
  title: string;
  thumbnailUrl?: string;
}

export default function NetflixCourseCard({ id, title, thumbnailUrl }: NetflixCourseCardProps) {
  return (
    <Link
      to={`/cursos/${id}`}
      className="relative flex-shrink-0 w-[280px] h-[400px] rounded-2xl group transition-all duration-300 ease-out hover:scale-[1.03] hover:ring-2 hover:ring-amber-400/50 hover:shadow-2xl hover:shadow-black/60"
    >
      {/* Inner clip — overflow-hidden here so the ring/scale aren't clipped */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        {/* Background */}
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-slate-600">
            <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />

        {/* Bottom strip: title + arrow */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between gap-2">
          <p className="text-white text-base font-semibold line-clamp-2 leading-snug">{title}</p>
          <span className="flex-shrink-0 text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
