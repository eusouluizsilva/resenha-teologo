import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getLevelInfo } from "../../lib/levels";
import Navbar from "../../components/ui/Navbar";

function IconTrophy() {
  return (
    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
    </svg>
  );
}

const MEDAL_COLORS = [
  { bg: "bg-amber-400/10", border: "border-amber-400/50", text: "text-amber-400", label: "🥇" },
  { bg: "bg-slate-300/10", border: "border-slate-400/50", text: "text-slate-300", label: "🥈" },
  { bg: "bg-orange-700/10", border: "border-orange-600/50", text: "text-orange-400", label: "🥉" },
];

type LeaderboardUser = {
  _id: string;
  name: string;
  imageUrl?: string;
  xp: number;
  level: number;
  streak: number;
  role: string;
};

function Avatar({ name, imageUrl, size = "md" }: { name: string; imageUrl?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "w-16 h-16 text-2xl" : size === "md" ? "w-10 h-10 text-base" : "w-8 h-8 text-sm";
  if (imageUrl) {
    return <img src={imageUrl} alt={name} className={`${sizeClass} rounded-full object-cover`} />;
  }
  return (
    <span className={`${sizeClass} rounded-full bg-slate-700 flex items-center justify-center font-bold text-white shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function PodiumCard({ user, rank, isMe }: { user: LeaderboardUser; rank: number; isMe: boolean }) {
  const medal = MEDAL_COLORS[rank - 1];
  const levelInfo = getLevelInfo(user.xp);
  return (
    <div
      className={`flex-1 flex flex-col items-center gap-3 p-5 rounded-2xl border ${medal.bg} ${medal.border} ${isMe ? "ring-2 ring-amber-400/60" : ""} transition-all`}
    >
      <span className="text-2xl">{medal.label}</span>
      <Avatar name={user.name} imageUrl={user.imageUrl} size="lg" />
      <div className="text-center">
        <p className={`font-bold text-sm ${isMe ? "text-amber-400" : "text-white"}`}>{user.name}</p>
        <p className="text-slate-400 text-xs mt-0.5">{levelInfo.current.name}</p>
      </div>
      <div className={`font-bold text-lg ${medal.text}`}>{user.xp.toLocaleString()} XP</div>
      {user.streak > 0 && (
        <span className="text-xs text-slate-400">{user.streak} 🔥</span>
      )}
    </div>
  );
}

export default function RankingPage() {
  const { user } = useUser();
  const leaderboard = useQuery(api.users.listLeaderboard);
  const me = useQuery(api.users.getMe, user ? { clerkId: user.id } : "skip");

  if (leaderboard === undefined || me === undefined) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          Carregando ranking...
        </div>
      </>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-950 py-10 px-6">
        <div className="max-w-2xl mx-auto space-y-8">

          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                <IconTrophy />
              </div>
              <h1 className="text-white font-bold text-xl">Ranking</h1>
            </div>
            <p className="text-slate-400 text-sm pl-12">Os membros com mais XP na plataforma</p>
          </div>

          {/* Top 3 podium */}
          {top3.length > 0 && (
            <div className="flex gap-3">
              {top3.map((u, i) => (
                <PodiumCard
                  key={u._id}
                  user={u as LeaderboardUser}
                  rank={i + 1}
                  isMe={me ? u._id === me._id : false}
                />
              ))}
            </div>
          )}

          {/* Full list (rank 4+) */}
          {rest.length > 0 && (
            <div className="space-y-2">
              {rest.map((u, i) => {
                const rank = i + 4;
                const levelInfo = getLevelInfo(u.xp);
                const isMe = me ? u._id === me._id : false;
                return (
                  <div
                    key={u._id}
                    className={`flex items-center gap-4 px-5 py-4 rounded-2xl border border-slate-800 ${
                      isMe
                        ? "bg-amber-400/5 border-l-4 border-l-amber-400"
                        : "bg-slate-900"
                    } transition-all`}
                  >
                    <span className="text-slate-500 font-bold text-sm w-6 text-center shrink-0">
                      {rank}
                    </span>
                    <Avatar name={u.name} imageUrl={u.imageUrl} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${isMe ? "text-amber-400" : "text-white"}`}>
                        {u.name}
                      </p>
                      <p className="text-slate-500 text-xs">{levelInfo.current.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-amber-400 font-bold text-sm">{u.xp.toLocaleString()} XP</p>
                      {u.streak > 0 && (
                        <p className="text-slate-400 text-xs">{u.streak} 🔥</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {leaderboard.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-500 text-sm">
              Nenhum membro encontrado.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
