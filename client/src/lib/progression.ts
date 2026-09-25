// Progression locale robuste : XP, niveau, rang, stats
export type Rank = "Bronze" | "Argent" | "Or" | "Platine" | "Diamant";
const RANKS: { rank: Rank; minXp: number; color: string }[] = [
  { rank: "Bronze", minXp: 0, color: "#cd7f32" },
  { rank: "Argent", minXp: 5000, color: "#c0c0c0" },
  { rank: "Or", minXp: 15000, color: "#ffd700" },
  { rank: "Platine", minXp: 35000, color: "#a0b2c6" },
  { rank: "Diamant", minXp: 70000, color: "#b9f2ff" },
];

export interface Stats {
  games: number;
  rounds: number;
  totalScore: number;
  bestScore: number;
  avgDistance: number;
  bestStreak: number;
  xp: number;
  rank: Rank;
}

const KEY = "intelgeo_stats";
const LEADER_KEY = "intelgeo_leaderboard";

export function getStats(): Stats {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    if (s) return s;
  } catch {}
  return { games: 0, rounds: 0, totalScore: 0, bestScore: 0, avgDistance: 0, bestStreak: 0, xp: 0, rank: "Bronze" };
}

export function getRank(xp: number): Rank {
  let r: Rank = "Bronze";
  for (const entry of RANKS) if (xp >= entry.minXp) r = entry.rank;
  return r;
}

export function saveGameResult(totalScore: number, avgDist: number, rounds: number) {
  const s = getStats();
  const xpGain = Math.round(totalScore / 10);
  s.games += 1;
  s.rounds += rounds;
  s.totalScore += totalScore;
  s.bestScore = Math.max(s.bestScore, totalScore);
  s.avgDistance = s.games === 1 ? avgDist : (s.avgDistance * (s.games - 1) + avgDist) / s.games;
  s.xp += xpGain;
  s.rank = getRank(s.xp);
  // streak simple : si avgDist < 200 km considère bonne partie
  if (avgDist < 200) s.bestStreak += 1; else s.bestStreak = 0;
  localStorage.setItem(KEY, JSON.stringify(s));
  // leaderboard local (top 10)
  try {
    const board: any[] = JSON.parse(localStorage.getItem(LEADER_KEY) || "[]");
    const pseudo = localStorage.getItem("intelgeo_name") || "Joueur";
    board.push({ pseudo, score: totalScore, rank: s.rank, xp: s.xp, date: Date.now() });
    board.sort((a,b)=> b.score - a.score);
    localStorage.setItem(LEADER_KEY, JSON.stringify(board.slice(0, 20)));
  } catch {}
  return s;
}

export function getLeaderboard(): { pseudo: string; score: number; rank: Rank; xp: number }[] {
  try { return JSON.parse(localStorage.getItem(LEADER_KEY) || "[]"); } catch { return []; }
}
