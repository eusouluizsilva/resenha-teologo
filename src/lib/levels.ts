export const LEVELS = [
  { level: 1, name: "Cordeiro", minXP: 0 },
  { level: 2, name: "Buscador", minXP: 100 },
  { level: 3, name: "Discípulo", minXP: 250 },
  { level: 4, name: "Escriba", minXP: 500 },
  { level: 5, name: "Apóstolo", minXP: 850 },
  { level: 6, name: "Ancião", minXP: 1300 },
  { level: 7, name: "Levita", minXP: 1850 },
  { level: 8, name: "Sacerdote", minXP: 2500 },
  { level: 9, name: "Patriarca", minXP: 3300 },
  { level: 10, name: "Ungido", minXP: 4200 },
];

export function getLevelInfo(xp: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) {
      const current = LEVELS[i];
      const next = LEVELS[i + 1] ?? null;
      const xpIntoLevel = xp - current.minXP;
      const xpNeededForNext = next ? next.minXP - current.minXP : 0;
      const progress = next ? Math.min(xpIntoLevel / xpNeededForNext, 1) : 1;
      return { current, next, xpIntoLevel, xpNeededForNext, progress };
    }
  }
  return { current: LEVELS[0], next: LEVELS[1], xpIntoLevel: 0, xpNeededForNext: 100, progress: 0 };
}

export function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}
