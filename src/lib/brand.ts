export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export const brandEyebrowClass =
  'text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]'

export const brandPanelClass =
  'rounded-[1.9rem] border border-white/8 bg-[linear-gradient(180deg,rgba(27,36,48,0.98)_0%,rgba(18,24,33,0.98)_100%)] shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl'

export const brandPanelSoftClass =
  'rounded-[1.55rem] border border-white/7 bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.02)_100%)] shadow-[0_16px_55px_rgba(0,0,0,0.16)]'

export const brandPanelLightClass =
  'rounded-[1.8rem] border border-[#E6DBCF] bg-[linear-gradient(180deg,#FEFEFE_0%,#F8F3ED_100%)] shadow-[0_20px_60px_rgba(17,24,39,0.08)]'

export const brandInputClass =
  'w-full rounded-2xl border border-white/10 bg-[#10161E] px-4 py-3 text-base sm:text-sm text-white placeholder-white/28 transition-all duration-200 focus:border-[#F37E20]/55 focus:bg-[#121B25] focus:outline-none focus:ring-4 focus:ring-[#F37E20]/10'

export const brandInputLightClass =
  'w-full rounded-2xl border border-[#DED4C7] bg-white px-4 py-3 text-base sm:text-sm text-[#111827] placeholder-[#7A8390] transition-all duration-200 focus:border-[#F37E20]/55 focus:outline-none focus:ring-4 focus:ring-[#F37E20]/10'

export const brandPrimaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F37E20] px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#e06e10] disabled:cursor-not-allowed disabled:opacity-50'

export const brandSecondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/4 px-5 py-3 text-sm font-semibold text-white/86 transition-all duration-200 hover:border-white/20 hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50'

export const brandGhostButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-[#2A313B] bg-transparent px-5 py-3 text-sm font-semibold text-white/62 transition-all duration-200 hover:border-[#F37E20]/24 hover:text-white disabled:cursor-not-allowed disabled:opacity-50'

export const brandIconBadgeClass =
  'flex h-11 w-11 items-center justify-center rounded-2xl border border-[#F37E20]/18 bg-[#F37E20]/10 text-[#F37E20]'

export function brandStatusPillClass(tone: 'success' | 'accent' | 'neutral' | 'info' = 'neutral') {
  if (tone === 'success') {
    return 'inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300'
  }

  if (tone === 'accent') {
    return 'inline-flex items-center gap-1.5 rounded-full border border-[#F37E20]/20 bg-[#F37E20]/10 px-3 py-1 text-xs font-semibold text-[#F2BD8A]'
  }

  if (tone === 'info') {
    return 'inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-200'
  }

  return 'inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs font-semibold text-white/55'
}
