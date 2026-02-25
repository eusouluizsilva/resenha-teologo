import { useParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Navbar from "../../components/ui/Navbar";
import NetflixCourseCard from "../../components/ui/NetflixCourseCard";

type SocialLinks = {
  instagram?: string;
  youtube?: string;
  facebook?: string;
  twitter?: string;
  website?: string;
};

type PastorUser = {
  _id: Id<"users">;
  name: string;
  imageUrl?: string;
  bio?: string;
  socialLinks?: SocialLinks;
  role: "admin" | "pastor" | "member";
};

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconYouTube() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function IconTwitter() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

type SocialLinkBadgeProps = { href: string; label: string; children: React.ReactNode };
function SocialLinkBadge({ href, label, children }: SocialLinkBadgeProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:border-amber-400 hover:text-amber-400 transition-all"
    >
      {children}
    </a>
  );
}

export default function PastorProfilePage() {
  const { pastorId } = useParams<{ pastorId: string }>();

  const pastors = useQuery(api.users.listPastors);
  const pastor = (pastors?.find((p) => p._id === pastorId) ?? null) as PastorUser | null;

  const courses = useQuery(
    api.courses.listMyCourses,
    pastorId ? { userId: pastorId as Id<"users"> } : "skip"
  );

  const publishedCourses = (courses ?? []).filter((c) => c.status === "published");

  if (pastors === undefined) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <div className="flex items-center justify-center py-32 text-slate-500">Carregando...</div>
      </div>
    );
  }

  if (pastor === null) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <div className="max-w-5xl mx-auto px-6 py-12 space-y-4">
          <p className="text-slate-400">Pastor não encontrado.</p>
          <Link to="/painel" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
            ← Voltar ao painel
          </Link>
        </div>
      </div>
    );
  }

  const sl = pastor.socialLinks;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">

        {/* Header */}
        <div className="flex items-start gap-8">
          <div className="w-28 h-28 rounded-full ring-4 ring-amber-400/40 overflow-hidden bg-slate-800 flex items-center justify-center shrink-0">
            {pastor.imageUrl ? (
              <img src={pastor.imageUrl} alt={pastor.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-amber-400 font-bold text-4xl">{pastor.name[0]}</span>
            )}
          </div>
          <div className="space-y-2 pt-1">
            <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest">Pastor</p>
            <h1 className="text-3xl font-bold text-white leading-tight">{pastor.name}</h1>
            {sl && (sl.instagram || sl.youtube || sl.facebook || sl.twitter || sl.website) && (
              <div className="flex items-center gap-2 pt-1">
                {sl.instagram && (
                  <SocialLinkBadge href={sl.instagram} label="Instagram">
                    <IconInstagram />
                  </SocialLinkBadge>
                )}
                {sl.youtube && (
                  <SocialLinkBadge href={sl.youtube} label="YouTube">
                    <IconYouTube />
                  </SocialLinkBadge>
                )}
                {sl.facebook && (
                  <SocialLinkBadge href={sl.facebook} label="Facebook">
                    <IconFacebook />
                  </SocialLinkBadge>
                )}
                {sl.twitter && (
                  <SocialLinkBadge href={sl.twitter} label="Twitter / X">
                    <IconTwitter />
                  </SocialLinkBadge>
                )}
                {sl.website && (
                  <SocialLinkBadge href={sl.website} label="Site">
                    <IconGlobe />
                  </SocialLinkBadge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {pastor.bio && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-3">Sobre</h2>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{pastor.bio}</p>
          </div>
        )}

        {/* Courses */}
        <div>
          <h2 className="text-base font-semibold text-white mb-1">
            Cursos{publishedCourses.length > 0 && <span className="text-slate-500 font-normal ml-2">({publishedCourses.length})</span>}
          </h2>
          {publishedCourses.length === 0 ? (
            <p className="text-slate-500 text-sm mt-3">Nenhum curso publicado ainda.</p>
          ) : (
            <div className="flex gap-5 overflow-x-auto py-4 px-2 [&::-webkit-scrollbar]:hidden -mx-2">
              {publishedCourses.map((course) => (
                <NetflixCourseCard
                  key={course._id}
                  id={course._id}
                  title={course.title}
                  thumbnailUrl={course.thumbnailUrl}
                />
              ))}
            </div>
          )}
        </div>

        <Link to="/painel" className="block text-sm text-slate-500 hover:text-white transition-colors">
          ← Voltar ao painel
        </Link>
      </div>
    </div>
  );
}
