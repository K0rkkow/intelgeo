import { createHash, randomUUID } from "crypto";

export type Rank = "Bronze" | "Argent" | "Or" | "Platine" | "Diamant";
export type Continent = "Europe" | "Asie" | "Afrique" | "Amérique du Nord" | "Amérique du Sud" | "Océanie" | "Monde";

const RANKS: { rank: Rank; minXp: number }[] = [
  { rank: "Bronze", minXp: 0 },
  { rank: "Argent", minXp: 5000 },
  { rank: "Or", minXp: 15000 },
  { rank: "Platine", minXp: 35000 },
  { rank: "Diamant", minXp: 70000 },
];

export function rankForXp(xp: number): Rank {
  let r: Rank = "Bronze";
  for (const e of RANKS) if (xp >= e.minXp) r = e.rank;
  return r;
}

export interface User {
  id: string;
  pseudo: string;
  passwordHash: string;
  continent: Continent;
  createdAt: number;
  xp: number;
  rank: Rank;
  games: number;
  rounds: number;
  totalScore: number;
  bestScore: number;
  avgDistance: number;
  bestStreak: number;
}

export interface TokenEntry { userId: string; createdAt: number; }

const usersById = new Map<string, User>();
const usersByPseudo = new Map<string, User>();
const tokens = new Map<string, TokenEntry>();

function hash(pw: string) {
  return createHash("sha256").update(pw).digest("hex");
}

export function createUser(pseudo: string, password: string, continent: Continent): { user: User; token: string } {
  const clean = pseudo.trim().slice(0, 16);
  if (clean.length < 2) throw new Error("Pseudo trop court (2-16)");
  if (usersByPseudo.has(clean.toLowerCase())) throw new Error("Pseudo déjà pris");
  if (password.length < 4) throw new Error("Mot de passe trop court (4+)");
  const id = randomUUID();
  const user: User = {
    id, pseudo: clean, passwordHash: hash(password), continent,
    createdAt: Date.now(), xp: 0, rank: "Bronze", games: 0, rounds: 0, totalScore: 0, bestScore: 0, avgDistance: 0, bestStreak: 0,
  };
  usersById.set(id, user);
  usersByPseudo.set(clean.toLowerCase(), user);
  const token = randomUUID();
  tokens.set(token, { userId: id, createdAt: Date.now() });
  return { user, token };
}

export function login(pseudo: string, password: string): { user: User; token: string } {
  const u = usersByPseudo.get(pseudo.trim().toLowerCase());
  if (!u || u.passwordHash !== hash(password)) throw new Error("Identifiants invalides");
  const token = randomUUID();
  tokens.set(token, { userId: u.id, createdAt: Date.now() });
  return { user: u, token };
}

export function getUserByToken(token: string): User | null {
  const e = tokens.get(token);
  if (!e) return null;
  return usersById.get(e.userId) || null;
}

export function getUserById(id: string) { return usersById.get(id) || null; }

export function submitResult(userId: string, totalScore: number, avgDist: number, rounds: number) {
  const u = usersById.get(userId);
  if (!u) return null;
  const xpGain = Math.round(totalScore / 10);
  u.games += 1; u.rounds += rounds; u.totalScore += totalScore;
  u.bestScore = Math.max(u.bestScore, totalScore);
  u.avgDistance = u.games === 1 ? avgDist : (u.avgDistance * (u.games - 1) + avgDist) / u.games;
  u.xp += xpGain; u.rank = rankForXp(u.xp);
  if (avgDist < 200) u.bestStreak += 1; else u.bestStreak = 0;
  return u;
}

export function getLeaderboard(scope: "world" | "continent", continent?: Continent, sort: "xp" | "score" | "distance" = "xp", limit = 100) {
  let arr = [...usersById.values()];
  if (scope === "continent" && continent) arr = arr.filter(u => u.continent === continent);
  if (sort === "xp") arr.sort((a,b)=> b.xp - a.xp);
  else if (sort === "score") arr.sort((a,b)=> b.bestScore - a.bestScore);
  else arr.sort((a,b)=> a.avgDistance - b.avgDistance);
  return arr.slice(0, limit).map((u,i)=> ({
    position: i+1, pseudo: u.pseudo, rank: u.rank, xp: u.xp, continent: u.continent,
    bestScore: u.bestScore, avgDistance: Math.round(u.avgDistance), games: u.games, bestStreak: u.bestStreak,
  }));
}

// seed quelques bots pour que le classement ne soit pas vide
(() => {
  const bots: [string, Continent, number][] = [
    ["GeoMaster", "Europe", 82000], ["Atlas", "Asie", 64000], ["Nomad", "Afrique", 54000], ["ExplorerX", "Amérique du Nord", 48000], ["Sakura", "Asie", 43000],
    ["Luna", "Europe", 39000], ["Cactus", "Amérique du Sud", 31000], ["Koala", "Océanie", 28000], ["Sahara", "Afrique", 22000], ["Viking", "Europe", 18000],
  ];
  for (const [p,c,xp] of bots) {
    try {
      const { user } = createUser(p, "botbot", c as Continent);
      user.xp = xp as number; user.rank = rankForXp(xp as number);
      user.games = Math.floor((xp as number)/800)+2; user.bestScore = 4800 + Math.floor(Math.random()*400);
      user.avgDistance = 40 + Math.floor(Math.random()*220);
    } catch {}
  }
})();
