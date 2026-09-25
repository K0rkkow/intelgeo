import { Router } from "express";
import { z } from "zod";
import { createGame, getGame, updateGame } from "../game/store.js";
import { haversineKm, calculateScore } from "../utils/geo.js";
import type { PublicRound } from "../game/types.js";

const router = Router();

const startSchema = z.object({
  rounds: z.number().int().min(1).max(10).default(5),
  timeLimit: z.number().int().min(30).max(600).default(120),
  region: z.enum(["world", "europe", "north-america", "south-america", "asia", "africa", "oceania", "france"]).default("world"),
  difficulty: z.enum(["easy", "medium", "hard", "expert"]).default("expert"),
});

function toPublicRound(game: ReturnType<typeof getGame>): PublicRound | null {
  if (!game) return null;
  const r = game.roundsData[game.currentRound];
  if (!r) return null;
  return {
    round: game.currentRound + 1,
    totalRounds: game.rounds,
    timeLimit: game.timeLimit,
    pano: { lat: r.location.latitude, lng: r.location.longitude },
    imageUrl: r.location.imageUrl,
  };
}

router.post("/start", (req, res) => {
  const parsed = startSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid params", details: parsed.error.flatten() });
  }
  const game = createGame(parsed.data);
  const pub = toPublicRound(game);
  return res.json({ gameId: game.id, ...pub });
});

const guessSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  timeRemaining: z.number().min(0).max(600).optional().default(0),
});

router.post("/:id/guess", (req, res) => {
  const game = getGame(req.params.id);
  if (!game) return res.status(404).json({ error: "Game not found" });
  if (game.status === "finished") return res.status(400).json({ error: "Game already finished" });

  const round = game.roundsData[game.currentRound];
  if (!round) return res.status(400).json({ error: "No active round" });
  if (round.completed) return res.status(400).json({ error: "Round already completed" });

  const parsed = guessSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid guess", details: parsed.error.flatten() });

  const { lat, lng, timeRemaining } = parsed.data;

  // Validate timeRemaining not greater than limit (anti-cheat clamp)
  const clampedTime = Math.max(0, Math.min(timeRemaining, game.timeLimit));

  const distanceKm = haversineKm(round.location.latitude, round.location.longitude, lat, lng);
  const score = calculateScore(distanceKm, clampedTime, game.timeLimit);
  const timeBonus = Math.round(Math.max(0, (clampedTime / game.timeLimit) * 300));

  round.guess = { lat, lng, timeRemaining: clampedTime };
  round.distanceKm = distanceKm;
  round.score = score;
  round.completed = true;

  const isLast = game.currentRound >= game.rounds - 1;
  let nextRound: PublicRound | null = null;

  if (!isLast) {
    game.currentRound += 1;
    const next = game.roundsData[game.currentRound];
    if (next) next.startedAt = Date.now();
    nextRound = toPublicRound(game);
  } else {
    game.status = "finished";
  }

  const newId = updateGame(game);
  // pour le client stateless, nextRound doit contenir le nouveau gameId
  if (nextRound) (nextRound as any).gameId = newId;

  return res.json({
    distanceKm,
    score,
    timeBonus,
    realLocation: { lat: round.location.latitude, lng: round.location.longitude },
    guessLocation: { lat, lng },
    round: round.index + 1,
    totalRounds: game.rounds,
    nextRound,
    nextGameId: newId,
    gameFinished: isLast,
  });
});

router.get("/:id/result", (req, res) => {
  const game = getGame(req.params.id);
  if (!game) return res.status(404).json({ error: "Game not found" });
  const rounds = game.roundsData.map((r) => ({
    round: r.index + 1,
    completed: r.completed,
    distanceKm: r.distanceKm ?? null,
    score: r.score ?? null,
    guess: r.guess ?? null,
    realLocation: r.completed ? { lat: r.location.latitude, lng: r.location.longitude } : null,
  }));
  const totalScore = game.roundsData.reduce((acc, r) => acc + (r.score ?? 0), 0);
  const avgDistance =
    rounds.filter((r) => r.distanceKm !== null).reduce((acc, r) => acc + (r.distanceKm as number), 0) /
    Math.max(1, rounds.filter((r) => r.distanceKm !== null).length);
  const bestRound = Math.max(...game.roundsData.map((r) => r.score ?? 0), 0);
  return res.json({
    gameId: game.id,
    status: game.status,
    totalScore,
    avgDistance: Number.isFinite(avgDistance) ? avgDistance : 0,
    bestRound,
    rounds,
    config: { rounds: game.rounds, timeLimit: game.timeLimit, region: game.region, difficulty: game.difficulty },
  });
});

export default router;
