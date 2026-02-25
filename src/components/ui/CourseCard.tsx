import { Link } from "react-router-dom";
import type { Id } from "../../../convex/_generated/dataModel";

interface CourseCardProps {
  id: Id<"courses">;
  title: string;
  description: string;
  thumbnailUrl?: string;
}

export default function CourseCard({ id, title, description, thumbnailUrl }: CourseCardProps) {
  return (
    <Link
      to={`/cursos/${id}`}
      className="block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-amber-400/50 transition-colors group"
    >
      <div className="aspect-video bg-slate-800 overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-white font-semibold text-lg group-hover:text-amber-400 transition-colors">
          {title}
        </h3>
        <p className="text-slate-400 text-sm mt-1 line-clamp-2">{description}</p>
      </div>
    </Link>
  );
}
