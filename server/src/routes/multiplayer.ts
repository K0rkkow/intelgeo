import { Router } from "express";
import { v4 as uuid } from "uuid";
import { createGame, getGame } from "../game/store.js";
import { getLocationsForGame } from "../game/locations.js";
import type { Region } from "../game/types.js";

const router = Router();

type Session = {
  code: string;
  players: { id: string; name: string }[];
  hostId: string;
  status: "lobby" | "playing";
  gameId?: string;
  firstRound?: any;
  createdAt: number;
};

const sessions = new Map<string, Session>();

function genCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "";
  for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
  if (sessions.has(c)) return genCode();
  return c;
}

router.post("/create", (req, res) => {
  const name = (req.body?.name || "Joueur 1").toString().slice(0, 20);
  const code = genCode();
  const playerId = uuid();
  const sess: Session = { code, players: [{ id: playerId, name }], hostId: playerId, status: "lobby", createdAt: Date.now() };
  sessions.set(code, sess);
  res.json({ code, playerId, players: sess.players.map(p=>p.name) });
});

router.post("/join", (req, res) => {
  const code = (req.body?.code || "").toString().toUpperCase();
  const name = (req.body?.name || "Joueur").toString().slice(0, 20);
  const sess = sessions.get(code);
  if (!sess) return res.status(404).json({ error: "Code introuvable" });
  if (sess.status !== "lobby") return res.status(400).json({ error: "Partie déjà lancée" });
  if (sess.players.length >= 8) return res.status(400).json({ error: "Lobby plein" });
  const playerId = uuid();
  sess.players.push({ id: playerId, name });
  res.json({ code, playerId, players: sess.players.map(p=>p.name) });
});

router.get("/:code", (req, res) => {
  const code = req.params.code.toUpperCase();
  const sess = sessions.get(code);
  if (!sess) return res.status(404).json({ error: "Session introuvable" });
  res.json({ code: sess.code, players: sess.players.map(p=>p.name), status: sess.status, gameId: sess.gameId || null, firstRound: sess.firstRound || null });
});

router.post("/:code/start", (req, res) => {
  const code = req.params.code.toUpperCase();
  const sess = sessions.get(code);
  if (!sess) return res.status(404).json({ error: "Session introuvable" });
  if (sess.status === "playing" && sess.gameId) {
    return res.json({ gameId: sess.gameId, firstRound: sess.firstRound });
  }
  // create shared game (5 manches monde par défaut)
  const region: Region = "world";
  const game = createGame({ rounds: 5, timeLimit: 120, region, difficulty: "expert" });
  sess.status = "playing";
  sess.gameId = game.id;
  const round = game.roundsData[0];
  sess.firstRound = { gameId: game.id, round: 1, totalRounds: game.rounds, timeLimit: game.timeLimit, pano: { lat: round.location.latitude, lng: round.location.longitude }, imageUrl: round.location.imageUrl };
  res.json({ gameId: game.id, firstRound: sess.firstRound });
});

// cleanup old sessions
setInterval(() => {
  const now = Date.now();
  for (const [k, s] of sessions) if (now - s.createdAt > 1000 * 60 * 60 * 2) sessions.delete(k);
}, 60000);

export default router;
