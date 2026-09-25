import { v4 as uuid } from "uuid";
import type { Game, Region, Difficulty } from "./types.js";
import { getLocationsForGame } from "./locations.js";

const g = globalThis as any;
if (!g.__geoGames) g.__geoGames = new Map<string, Game>();
const games: Map<string, Game> = g.__geoGames;

export function createGame(params: { rounds: number; timeLimit: number; region: Region; difficulty: Difficulty }): Game {
  const baseId = uuid();
  const locs = getLocationsForGame(params.region, params.rounds);
  const payload = { rounds: params.rounds, timeLimit: params.timeLimit, region: params.region, difficulty: params.difficulty, locs };
  const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const id = `${baseId}.${b64}`;
  const roundsData = locs.map((loc, idx) => ({
    id: `${baseId}-${idx}`,
    index: idx,
    location: loc,
    startedAt: Date.now(),
    completed: false,
  }));
  const game: Game = {
    id,
    rounds: params.rounds,
    timeLimit: params.timeLimit,
    region: params.region,
    difficulty: params.difficulty,
    roundsData,
    currentRound: 0,
    createdAt: Date.now(),
    status: "playing",
  };
  games.set(id, game);
  return game;
}

export function getGame(id: string): Game | undefined {
  const direct = games.get(id);
  if (direct) return direct;
  // Fallback stateless pour Vercel serverless (cold start / autre instance)
  // gameId format: uuid.base64(payload) -> on reconstruit
  const dot = id.indexOf(".");
  if (dot === -1) return undefined;
  const b64 = id.slice(dot + 1);
  try {
    const json = Buffer.from(b64, "base64url").toString("utf-8");
    const payload = JSON.parse(json);
    if (!payload.locs || !Array.isArray(payload.locs)) return undefined;
    const baseId = id.slice(0, dot);
    // vérifie qu'on a pas déjà recréé
    const existing = games.get(id);
    if (existing) return existing;
    const roundsData = payload.locs.map((loc: any, idx: number) => ({
      id: `${baseId}-${idx}`,
      index: idx,
      location: loc,
      startedAt: Date.now(),
      completed: false,
    }));
    const game: Game = {
      id,
      rounds: payload.rounds,
      timeLimit: payload.timeLimit,
      region: payload.region,
      difficulty: payload.difficulty,
      roundsData,
      currentRound: 0,
      createdAt: Date.now(),
      status: "playing",
    };
    games.set(id, game);
    return game;
  } catch { return undefined; }
}

export function updateGame(game: Game): void {
  games.set(game.id, game);
}

// Cleanup old games every 30min (in-memory)
setInterval(() => {
  const now = Date.now();
  for (const [k, g] of games) {
    if (now - g.createdAt > 1000 * 60 * 60 * 4) games.delete(k);
  }
}, 1000 * 60 * 30);
