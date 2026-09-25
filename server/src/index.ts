import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import gameRouter from "./routes/game.js";
import mpRouter from "./routes/multiplayer.js";
import authRouter from "./routes/auth.js";
import leaderboardRouter from "./routes/leaderboard.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

const isVercel = !!process.env.VERCEL;
app.use(cors({ origin: isVercel ? true : CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true, version: "1.0.0" }));
app.use("/api/game", gameRouter);
app.use("/api/multiplayer", mpRouter);
app.use("/api/auth", authRouter);
app.use("/api/leaderboard", leaderboardRouter);

// servir le client en prod (Vercel / single deployment)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) res.status(404).json({ error: "Not found" });
  });
});

// error handler
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;

if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`);
    console.log(`[server] CORS origin: ${CORS_ORIGIN}`);
  });
}
