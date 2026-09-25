import { v4 as uuid } from "uuid";
import type { Game, Region, Difficulty } from "./types.js";
import { getLocationsForGame } from "./locations.js";

const games = new Map<string, Game>();

export function createGame(params: { rounds: number; timeLimit: number; region: Region; difficulty: Difficulty }): Game {
  const id = uuid();
  const locs = getLocationsForGame(params.region, params.rounds);
  const roundsData = locs.map((loc, idx) => ({
    id: uuid(),
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
  return games.get(id);
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
