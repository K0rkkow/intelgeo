import { Router } from "express";
import { getLeaderboard } from "../services/users.js";

const router = Router();

router.get("/", (req, res) => {
  const scope = (req.query.scope as string) === "continent" ? "continent" : "world";
  const continent = req.query.continent as any;
  const sort = (req.query.sort as string) === "score" ? "score" : (req.query.sort as string) === "distance" ? "distance" : "xp";
  const limit = Math.min(100, Math.max(10, Number(req.query.limit) || 50));
  const data = getLeaderboard(scope, continent, sort as any, limit);
  res.json({ scope, sort, data });
});

export default router;
