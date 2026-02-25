import { getLevelInfo } from "../../lib/levels";

interface XPBarProps {
  xp: number;
}

export default function XPBar({ xp }: XPBarProps) {
  const { current, next, xpIntoLevel, xpNeededForNext, progress } = getLevelInfo(xp);

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-amber-400 font-semibold">{current.name}</span>
        {next && (
          <span className="text-slate-400">
            {xpIntoLevel} / {xpNeededForNext} XP → {next.name}
          </span>
        )}
        {!next && <span className="text-amber-400 font-semibold">Nível máximo!</span>}
      </div>
      <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
        <div
          className="bg-amber-400 h-3 rounded-full transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <p className="text-slate-500 text-xs mt-1">{xp} XP total</p>
    </div>
  );
}
