interface StreakCounterProps {
  streak: number;
}

export default function StreakCounter({ streak }: StreakCounterProps) {
  return (
    <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3">
      <span className="text-2xl">🔥</span>
      <div>
        <p className="text-orange-400 font-bold text-xl leading-none">{streak}</p>
        <p className="text-slate-400 text-xs mt-0.5">dias seguidos</p>
      </div>
    </div>
  );
}
