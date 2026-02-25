import React from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Link } from "react-router-dom";
import Navbar from "../../components/ui/Navbar";
import PastorCard from "../../components/ui/PastorCard";
import NetflixCourseCard from "../../components/ui/NetflixCourseCard";
import { getLevelInfo } from "../../lib/levels";
import AnnouncementsCarousel from "../../components/ui/AnnouncementsCarousel";
import VerseOfDay from "../../components/ui/VerseOfDay";

type Course = {
  _id: Id<"courses">;
  title: string;
  description: string;
  thumbnailUrl?: string;
  createdBy?: Id<"users">;
  status: "draft" | "published";
  createdAt: number;
};

type Pastor = {
  _id: Id<"users">;
  name: string;
  imageUrl?: string;
  role: "admin" | "pastor" | "member";
  clerkId: string;
  email: string;
  xp: number;
  level: number;
  streak: number;
};

// Silently hides section if Convex function isn't deployed yet
class SectionGuard extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
        {icon}
      </div>
      <h2 className="text-white font-bold text-xl">{label}</h2>
    </div>
  );
}

function IconTrophy() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-400">
      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
    </svg>
  );
}

const MEDAL_LABELS = ["🥇", "🥈", "🥉"];
const MEDAL_TEXT = ["text-amber-400", "text-slate-300", "text-orange-400"];

function LeaderboardPreviewSection({ meId }: { meId: string }) {
  const leaderboard = useQuery(api.users.listLeaderboard);
  if (!leaderboard || leaderboard.length === 0) return null;
  const top3 = leaderboard.slice(0, 3);
  return (
    <section className="space-y-3">
      <SectionHeader icon={<IconTrophy />} label="Ranking" />
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
        {top3.map((u, i) => {
          const levelInfo = getLevelInfo(u.xp);
          const isMe = u._id === meId;
          return (
            <div
              key={u._id}
              className={`flex items-center gap-4 px-5 py-4 ${isMe ? "bg-amber-400/5" : "hover:bg-slate-800/40"} transition-colors`}
            >
              <span className="text-xl w-6 text-center shrink-0">{MEDAL_LABELS[i]}</span>
              {u.imageUrl ? (
                <img src={u.imageUrl} alt={u.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <span className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-base font-bold text-white shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm truncate ${isMe ? "text-amber-400" : "text-white"}`}>{u.name}</p>
                <p className="text-slate-500 text-xs">{levelInfo.current.name}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`font-bold text-sm ${MEDAL_TEXT[i]}`}>{u.xp.toLocaleString()} XP</p>
                {u.streak > 0 && <p className="text-slate-500 text-xs">{u.streak} 🔥</p>}
              </div>
            </div>
          );
        })}
      </div>
      <Link
        to="/ranking"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 text-sm font-medium hover:text-white hover:border-amber-400/40 transition-all"
      >
        Ver ranking completo →
      </Link>
    </section>
  );
}

function IconPeople() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-400">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-400">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function IconBookmark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-400">
      <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
    </svg>
  );
}

function MyCoursesSection({ userId }: { userId: Id<"users"> }) {
  const enrolled = useQuery(api.enrollments.getMyEnrolledCourses, { userId });

  if (!enrolled || enrolled.length === 0) return null;

  return (
    <section className="space-y-4">
      <SectionHeader icon={<IconBookmark />} label="Meus Cursos" />
      <div className="flex gap-5 overflow-x-auto py-4 px-2 [&::-webkit-scrollbar]:hidden">
        {enrolled.map((course) => (
          <NetflixCourseCard
            key={course._id}
            id={course._id}
            title={course.title}
            thumbnailUrl={course.thumbnailUrl}
          />
        ))}
      </div>
    </section>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default function DashboardPage() {
  const { user } = useUser();
  const me = useQuery(api.users.getMe, user ? { clerkId: user.id } : "skip");
  const courses = useQuery(api.courses.listPublished);
  const pastors = useQuery(api.users.listPastors);

  if (!me) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          Carregando perfil...
        </div>
      </>
    );
  }

  const courseList: Course[] = courses ?? [];
  const pastorList: Pastor[] = (pastors ?? []) as Pastor[];

  const pastorIds = new Set(pastorList.map((p) => p._id as string));

  const coursesByPastor: Record<string, Course[]> = {};
  const otherCourses: Course[] = [];

  for (const course of courseList) {
    const createdBy = course.createdBy as string | undefined;
    if (createdBy && pastorIds.has(createdBy)) {
      if (!coursesByPastor[createdBy]) coursesByPastor[createdBy] = [];
      coursesByPastor[createdBy].push(course);
    } else {
      otherCourses.push(course);
    }
  }

  const pastorRows = pastorList.filter(
    (p) => (coursesByPastor[p._id as string]?.length ?? 0) > 0
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-950 py-10 px-6">
        <div className="max-w-6xl mx-auto space-y-12">

          {/* Greeting */}
          <h1 className="text-white font-bold text-2xl md:text-3xl">
            {getGreeting()}, {me.name.split(" ")[0]}
          </h1>

          {/* Avisos + Versículo do Dia — side-by-side on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-[5fr_3fr] lg:h-80 gap-4">
            <SectionGuard>
              <AnnouncementsCarousel />
            </SectionGuard>
            <SectionGuard>
              <VerseOfDay />
            </SectionGuard>
          </div>

          {/* Meus Cursos — hidden if Convex function not yet deployed */}
          <SectionGuard>
            <MyCoursesSection userId={me._id} />
          </SectionGuard>

          {/* Pastores */}
          {pastorList.length > 0 && (
            <section className="space-y-4">
              <SectionHeader icon={<IconPeople />} label="Pastores" />
              <div className="flex gap-4 overflow-x-auto py-2 px-1 [&::-webkit-scrollbar]:hidden">
                {pastorList.map((pastor) => (
                  <PastorCard
                    key={pastor._id}
                    _id={pastor._id as string}
                    name={pastor.name}
                    imageUrl={pastor.imageUrl}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Cursos */}
          <section className="space-y-8">
            <SectionHeader icon={<IconPlay />} label="Cursos" />

            {courses === undefined && (
              <div className="text-slate-500 text-sm">Carregando cursos...</div>
            )}

            {courses !== undefined && courseList.length === 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-sm">
                Nenhum curso disponível ainda. Volte em breve!
              </div>
            )}

            {pastorRows.map((pastor) => {
              const pastorCourses = coursesByPastor[pastor._id as string] ?? [];
              return (
                <div key={pastor._id} className="space-y-3">
                  <h3 className="text-slate-300 font-semibold text-base flex items-center gap-2">
                    {pastor.imageUrl ? (
                      <img
                        src={pastor.imageUrl}
                        alt={pastor.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white font-bold">
                        {pastor.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    {pastor.name}
                  </h3>
                  <div className="flex gap-5 overflow-x-auto py-4 px-2 [&::-webkit-scrollbar]:hidden">
                    {pastorCourses.map((course) => (
                      <NetflixCourseCard
                        key={course._id}
                        id={course._id}
                        title={course.title}
                        thumbnailUrl={course.thumbnailUrl}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>

          {/* Ranking preview */}
          <SectionGuard>
            <LeaderboardPreviewSection meId={me._id} />
          </SectionGuard>

          {/* Comunidade banner */}
          <Link
            to="/comunidade"
            className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-8 py-6 hover:border-amber-400/50 hover:bg-slate-800/60 transition-all group"
          >
            <div>
              <h2 className="text-white font-bold text-xl">Comunidade</h2>
              <p className="text-slate-400 text-sm mt-1">Tire dúvidas e compartilhe reflexões com a turma.</p>
            </div>
            <span className="flex-shrink-0 bg-amber-400 text-slate-950 font-bold text-sm px-5 py-3 rounded-xl group-hover:bg-amber-300 transition-colors">
              Visitar comunidade →
            </span>
          </Link>

        </div>
      </main>
    </>
  );
}
