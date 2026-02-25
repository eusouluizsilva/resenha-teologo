import { getLevelInfo } from "../../lib/levels";

interface LevelBadgeProps {
  xp: number;
  size?: "sm" | "md" | "lg";
}

export default function LevelBadge({ xp, size = "md" }: LevelBadgeProps) {
  const { current } = getLevelInfo(xp);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/30 text-amber-400 font-semibold rounded-full ${sizeClasses[size]}`}>
      <span className="text-amber-300">Nível {current.level}</span>
      <span className="text-slate-300">·</span>
      <span>{current.name}</span>
    </span>
  );
}
