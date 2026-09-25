import { useState, useEffect } from "react";
import { Intro } from "./components/Intro";
import { Home } from "./pages/Home";
import { LevelSelect } from "./pages/LevelSelect";
import { MultiplayerLobby } from "./components/MultiplayerLobby";
import { Game } from "./pages/Game";
import { Results } from "./pages/Results";
import { Auth } from "./components/Auth";
import { Leaderboard } from "./pages/Leaderboard";
import { apiStartGame } from "./lib/api";
import type { PublicRound, GuessResult } from "./types/game";
import { saveGameResult } from "./lib/progression";

type Screen = "intro" | "auth" | "home" | "level" | "mp" | "game" | "results" | "board";

export default function App() {
  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("intelgeo_token");
  const [screen, setScreen] = useState<Screen>("intro");
  const [showIntro, setShowIntro] = useState(true);
  const [mpInitialCode, setMpInitialCode] = useState<string | null>(null);

  const [gameId, setGameId] = useState<string | null>(null);
  const [initial, setInitial] = useState<PublicRound | null>(null);
  const [results, setResults] = useState<GuessResult[]>([]);
  const [gameLang, setGameLang] = useState<"fr"|"en"|"es">(()=> (localStorage.getItem("intelgeo_lang") as any) || "fr");
  const [gameLevel, setGameLevel] = useState(2);

  const enterHome = () => {
    setShowIntro(false);
    setTimeout(() => {
      const tok = localStorage.getItem("intelgeo_token");
      setScreen(tok ? "home" : "auth");
    }, 80);
  };

  const levelToConfig = (level: number) => {
    const diffMap = ["easy","easy","medium","hard","expert"] as const;
    const difficulty = diffMap[level-1] || "expert";
    return { rounds: 5, timeLimit: 120, region: "world", difficulty };
  };

  const startGameWithLevel = async (level: number) => {
    const cfg = levelToConfig(level);
    setGameLevel(level);
    try {
      const res = await apiStartGame(cfg as any);
      setGameId(res.gameId);
      setInitial({ gameId: res.gameId, round: res.round, totalRounds: res.totalRounds, timeLimit: res.timeLimit, pano: res.pano, imageUrl: (res as any).imageUrl });
      setResults([]);
      setScreen("game");
    } catch (e) { alert("Impossible de démarrer: " + String(e)); }
  };

  const handleMpCreate = (gameId: string, firstRound: PublicRound) => {
    setGameId(gameId);
    setInitial(firstRound);
    setResults([]);
    setScreen("game");
  };

  const handleFinish = async (res: GuessResult[]) => {
    setResults(res);
    const total = res.reduce((a, r) => a + r.score, 0);
    const avg = res.length ? res.reduce((a,r)=>a+r.distanceKm,0)/res.length : 0;
    saveGameResult(total, avg, res.length);
    const best = Number(localStorage.getItem("intelgeo_best") || "0");
    if (total > best) localStorage.setItem("intelgeo_best", String(total));
    // sync serveur si connecté
    const token = localStorage.getItem("intelgeo_token");
    if (token) {
      try { await fetch(`${import.meta.env.VITE_API_URL || ""}/api/auth/submit`, { method:"POST", headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`}, body: JSON.stringify({ totalScore: total, avgDistance: avg, rounds: res.length }) }); } catch {}
    }
    setScreen("results");
  };

  return (
    <div className="transition-opacity duration-300">
      {showIntro && <Intro onEnter={enterHome} />}
      {screen === "auth" && <Auth onAuth={()=> setScreen("home")} />}
      {screen === "home" && (
        <Home
          onPlay={() => setScreen("level")}
          onMultiplayer={(action) => {
            if (action === "create") { setMpInitialCode(null); setScreen("mp"); }
            else { setMpInitialCode(null); setScreen("mp"); }
          }}
          onBoard={()=> setScreen("board")}
        />
      )}
      {screen === "level" && (
        <LevelSelect onSelect={(lvl)=> startGameWithLevel(lvl)} onBack={()=> setScreen("home")} />
      )}
      {screen === "mp" && (
        <MultiplayerLobby
          initialCode={mpInitialCode}
          onStartGame={handleMpCreate}
          onBack={() => setScreen("home")}
        />
      )}
      {screen === "game" && initial && gameId && (
        <Game initial={initial} gameId={gameId} lang={gameLang} level={gameLevel} onFinish={handleFinish} onAbort={() => setScreen("home")} />
      )}
      {screen === "results" && (
        <Results results={results} onReplay={() => setScreen("home")} onMenu={() => setScreen("home")} onBoard={()=> setScreen("board")} />
      )}
      {screen === "board" && <Leaderboard onBack={()=> setScreen("home")} />}
    </div>
  );
}
