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
  const dot = id.indexOf(".");
  if (dot === -1) return undefined;
  const b64 = id.slice(dot + 1);
  try {
    const json = Buffer.from(b64, "base64url").toString("utf-8");
    const payload = JSON.parse(json);
    if (!payload.locs || !Array.isArray(payload.locs)) return undefined;
    const baseId = id.slice(0, dot);
    const existing = games.get(id);
    if (existing) return existing;
    // payload contient currentRound et roundsData avec completed/guess si déjà avancé
    const locs = payload.locs;
    const currentRound = typeof payload.currentRound === "number" ? payload.currentRound : 0;
    const savedRounds = Array.isArray(payload.roundsData) ? payload.roundsData : null;
    const roundsData = locs.map((loc: any, idx: number) => {
      const saved = savedRounds ? savedRounds.find((r: any) => r.index === idx) : null;
      return {
        id: `${baseId}-${idx}`,
        index: idx,
        location: loc,
        startedAt: saved?.startedAt || Date.now(),
        completed: !!saved?.completed,
        guess: saved?.guess,
        distanceKm: saved?.distanceKm,
        score: saved?.score,
      };
    });
    const game: Game = {
      id,
      rounds: payload.rounds,
      timeLimit: payload.timeLimit,
      region: payload.region,
      difficulty: payload.difficulty,
      roundsData,
      currentRound,
      createdAt: payload.createdAt || Date.now(),
      status: payload.status || "playing",
    };
    games.set(id, game);
    return game;
  } catch { return undefined; }
}

export function updateGame(game: Game): string {
  // génère un nouveau gameId qui encode l'état à jour pour le prochain appel stateless
  const dot = game.id.indexOf(".");
  const baseId = dot === -1 ? game.id : game.id.slice(0, dot);
  const payload = {
    rounds: game.rounds,
    timeLimit: game.timeLimit,
    region: game.region,
    difficulty: game.difficulty,
    locs: game.roundsData.map(r => r.location),
    roundsData: game.roundsData.map(r => ({ index: r.index, completed: r.completed, guess: r.guess, distanceKm: r.distanceKm, score: r.score, startedAt: r.startedAt })),
    currentRound: game.currentRound,
    status: game.status,
    createdAt: game.createdAt,
  };
  const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const newId = `${baseId}.${b64}`;
  // garde l'ancien id aussi pour compat, mais stocke le nouveau
  const newGame: Game = { ...game, id: newId };
  games.set(newId, newGame);
  // garde aussi l'ancien pour éviter 404 si client rejoue avec ancien
  games.set(game.id, newGame);
  return newId;
}

// Cleanup old games every 30min (in-memory)
setInterval(() => {
  const now = Date.now();
  for (const [k, g] of games) {
    if (now - g.createdAt > 1000 * 60 * 60 * 4) games.delete(k);
  }
}, 1000 * 60 * 30);
