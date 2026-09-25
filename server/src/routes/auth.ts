import { Router } from "express";
import { z } from "zod";
import { createUser, login, getUserByToken, submitResult } from "../services/users.js";

const router = Router();

const regSchema = z.object({
  pseudo: z.string().min(2).max(16),
  password: z.string().min(4).max(32),
  continent: z.enum(["Europe","Asie","Afrique","Amérique du Nord","Amérique du Sud","Océanie","Monde"]).default("Europe"),
});

router.post("/register", (req, res) => {
  const p = regSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Données invalides", details: p.error.flatten() });
  try {
    const { user, token } = createUser(p.data.pseudo, p.data.password, p.data.continent as any);
    res.json({ token, user: { id: user.id, pseudo: user.pseudo, continent: user.continent, xp: user.xp, rank: user.rank } });
  } catch (e:any) { res.status(400).json({ error: e.message }); }
});

router.post("/login", (req, res) => {
  const { pseudo, password } = req.body || {};
  if (!pseudo || !password) return res.status(400).json({ error: "Pseudo et mot de passe requis" });
  try {
    const { user, token } = login(pseudo, password);
    res.json({ token, user: { id: user.id, pseudo: user.pseudo, continent: user.continent, xp: user.xp, rank: user.rank } });
  } catch (e:any) { res.status(401).json({ error: e.message }); }
});

router.get("/me", (req, res) => {
  const token = (req.headers.authorization || "").replace("Bearer ","");
  const u = getUserByToken(token);
  if (!u) return res.status(401).json({ error: "Non authentifié" });
  res.json({ id: u.id, pseudo: u.pseudo, continent: u.continent, xp: u.xp, rank: u.rank, games: u.games, bestScore: u.bestScore, avgDistance: u.avgDistance, bestStreak: u.bestStreak });
});

router.post("/submit", (req, res) => {
  const token = (req.headers.authorization || "").replace("Bearer ","");
  const u = getUserByToken(token);
  if (!u) return res.status(401).json({ error: "Non authentifié" });
  const { totalScore, avgDistance, rounds } = req.body || {};
  if (typeof totalScore !== "number" || typeof avgDistance !== "number") return res.status(400).json({ error: "Données invalides" });
  const updated = submitResult(u.id, totalScore, avgDistance, rounds || 5);
  res.json({ ok: true, user: updated });
});

export default router;
