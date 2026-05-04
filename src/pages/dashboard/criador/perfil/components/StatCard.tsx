export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-white/7 bg-white/[0.025] p-5 text-center">
      <p className="font-display text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/48">{label}</p>
    </div>
  )
}
