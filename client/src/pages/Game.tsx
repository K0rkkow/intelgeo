import { useState, useCallback, useEffect } from "react";
import { StreetView } from "../components/StreetView";
import { GuessMap } from "../components/GuessMap";
import { useTimer } from "../hooks/useTimer";
import type { PublicRound, GuessResult } from "../types/game";
import { apiGuess, API } from "../lib/api";
import { playPlace, playValidate, playResult, sounds } from "../lib/sounds";

function fmt(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function Game({ initial, gameId, lang = "fr", level = 2, onFinish, onAbort }: { initial: PublicRound; gameId: string; lang?: string; level?: number; onFinish: (results: GuessResult[], cfg: PublicRound) => void; onAbort?: () => void }) {
  const [round, setRound] = useState<PublicRound>(initial);
  const [guess, setGuess] = useState<{ lat: number; lng: number } | null>(null);
  const [phase, setPhase] = useState<"playing" | "revealing">("playing");
  const [lastResult, setLastResult] = useState<GuessResult | null>(null);
  const [results, setResults] = useState<GuessResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  // LOADING → READY → PLAYING
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [countdown, setCountdown] = useState<number | string | null>(null);
  const [streetReady, setStreetReady] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);
  const tips = [
    "Observez les panneaux et les noms de rues.",
    "L'architecture peut révéler le pays.",
    "Regardez les véhicules et leur signalisation.",
    "La végétation est un indice important.",
    "Comparez les indices avant de placer votre point.",
    "Plus votre estimation est proche, plus votre score est élevé.",
  ];
  // progression réelle liée aux étapes
  const progress = !streetReady && !mapReady ? 15 : !streetReady || !mapReady ? 55 : ready ? 100 : 88;
  const isFullyReady = streetReady && mapReady;

  const doGuess = useCallback(async (timeRemaining: number) => {
    if (!guess || submitting || phase !== "playing") return;
    if (sounds.isEnabled()) playValidate();
    setSubmitting(true);
    try {
      const r = await apiGuess(gameId, { lat: guess.lat, lng: guess.lng, timeRemaining });
      setLastResult(r);
      setPhase("revealing");
      setResults(prev => [...prev, r]);
      playResult(r.score);
    } catch (e) { alert("Erreur: " + String(e)); }
    finally { setSubmitting(false); }
  }, [guess, submitting, phase, gameId]);

  const { remaining } = useTimer(round.timeLimit, () => {
    if (phase === "playing" && !loading && countdown === null) {
      if (guess) doGuess(0);
      else { setGuess({ lat: 0, lng: 0 }); setTimeout(() => doGuess(0), 200); }
    }
  }, phase === "playing" && !loading && countdown === null);

  // conseils rotatifs pendant chargement
  useEffect(() => {
    if (!loading) return;
    const t = setInterval(()=> setTipIdx(i => (i+1)%tips.length), 1800);
    return ()=> clearInterval(t);
  }, [loading, tips.length]);

  const handleNeedNew = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/game/start`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rounds: 1, timeLimit: round.timeLimit, region: "world", difficulty: "expert" })
      });
      if (!res.ok) throw new Error("retry");
      const data = await res.json();
      setRound(prev => ({ ...prev, pano: data.pano, imageUrl: data.imageUrl }));
      setStreetReady(false); setMapReady(false); setReady(false);
    } catch {
      setStreetReady(true);
    }
  }, [round.timeLimit]);

  // détection READY : toutes les vérifications réelles
  useEffect(() => {
    if (loading && isFullyReady && !ready) {
      setReady(true);
      // petit délai pour afficher PRÊT puis 3-2-1-GO
      setTimeout(() => {
        let c: number | string = 3;
        setCountdown(c);
        const iv = setInterval(()=> {
          c = c === 3 ? 2 : c === 2 ? 1 : c === 1 ? "GO" : null as any;
          if (c === null) { clearInterval(iv); setCountdown(null); setLoading(false); }
          else setCountdown(c);
        }, 550);
      }, 400);
    }
  }, [isFullyReady, loading, ready]);

  useEffect(() => {
    if (!loading || isFullyReady) return;
    const to = setTimeout(async () => {
      if (!loading || isFullyReady) return;
      try {
        const res = await fetch(`${API}/api/game/start`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rounds: 1, timeLimit: round.timeLimit, region: "world", difficulty: "expert" })
        });
        if (res.ok) {
          const data = await res.json();
          setRound({ gameId: data.gameId, round: 1, totalRounds: round.totalRounds, timeLimit: round.timeLimit, pano: data.pano, imageUrl: data.imageUrl });
          setStreetReady(false); setMapReady(false); setReady(false);
        }
      } catch {}
    }, 12000);
    return ()=> clearTimeout(to);
  }, [loading, isFullyReady, round.timeLimit, round.totalRounds]);

  const handleStreetReady = () => setStreetReady(true);
  const handleMapReady = () => setMapReady(true);

  useEffect(()=> { // nouveau round → recharger proprement
    setLoading(true); setReady(false); setCountdown(null); setStreetReady(false); setMapReady(false);
  }, [round.pano.lat, round.pano.lng]);

  const nextRound = () => {
    if (!lastResult) return;
    if (lastResult.gameFinished) { onFinish(results, round); return; }
    if (lastResult.nextRound) {
      setRound(lastResult.nextRound);
      setGuess(null);
      setLastResult(null);
      setPhase("playing");
    }
  };
  const urgent = remaining <= 15;
  const [soundOn, setSoundOn] = useState(()=> sounds.isEnabled());
  const toggleSound = () => { const v = !soundOn; setSoundOn(v); sounds.setEnabled(v); };
  // tick sonore subtil quand urgent
  useEffect(()=> { if (urgent && phase==="playing" && soundOn) sounds.tick(); }, [remaining, urgent, phase, soundOn]);
  const handlePick = (p: {lat:number; lng:number}) => { setGuess(p); if (soundOn) playPlace(); };

  return (
    <div className="h-[100dvh] flex flex-col bg-[#050507] text-white">
      <header className="h-14 shrink-0 bg-[#0c0c0e] border-b border-white/10 flex items-center justify-between px-3 md:px-4 z-30">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs tracking-widest">ROUND <b>{round.round}/{round.totalRounds}</b></span>
          <span className={`font-mono text-sm px-3 py-1.5 rounded-full border font-bold ${loading || countdown!==null ? "bg-white/10 border-white/10 text-white/50" : urgent ? "bg-[#ff1a1a] border-[#ff1a1a] text-white animate-pulse" : "bg-white text-black border-white"}`}>{loading || countdown!==null ? "00:00" : fmt(remaining)}</span>
          <button onClick={toggleSound} className="w-8 h-8 rounded-full bg-white/10 grid place-items-center text-xs hover:bg-white/20 transition" aria-label="Son">{soundOn ? "🔊" : "🔇"}</button>
        </div>
        <button onClick={onAbort} className="flex items-center gap-2 hover:opacity-80 transition">
          <span className="font-black tracking-[0.18em] text-xs hidden sm:inline">INTELGEO</span>
          <img src="/logo.jpg" alt="IntelGeo" className="w-8 h-8 rounded-full border border-white/10" />
        </button>
      </header>

      {/* immersive street view — ZONE A principale */}
      <div className="flex-1 relative min-h-0 bg-black overflow-hidden">
        <div className="absolute inset-0">
          {phase === "playing" ? (
            <StreetView lat={round.pano.lat} lng={round.pano.lng} imageUrl={round.imageUrl} level={level} onReady={handleStreetReady} onNeedNew={handleNeedNew} />
          ) : lastResult ? (
            <StreetView lat={round.pano.lat} lng={round.pano.lng} imageUrl={round.imageUrl} level={level} />
          ) : null}
        </div>
        {(loading || countdown !== null) && phase === "playing" && (
          <div className="absolute inset-0 z-40 bg-[#050507] flex flex-col items-center justify-center px-6">
            <img src="/logo.jpg" alt="IntelGeo" className="w-14 h-14 rounded-full border border-white/10" />
            <div className="mt-4 font-black tracking-[0.18em] text-sm">INTELGEO</div>
            <div className="mt-1 font-mono text-xs tracking-widest text-white/50">{ready ? "Prêt !" : "Préparation de votre localisation..."}</div>
            <div className="mt-6 w-full max-w-sm h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-[#ff1a1a] transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 text-xs text-white/60 text-center h-4">{tips[tipIdx]}</div>
            {countdown !== null && <div className="mt-6 text-5xl font-black tracking-tighter animate-pulse">{countdown}</div>}
            <div className="mt-2 font-mono text-[10px] tracking-widest text-white/30">Trouvez la localisation de cette scène</div>
            {!isFullyReady && <div className="mt-2 font-mono text-[10px] text-white/20">{streetReady ? "✓ Vue prête" : "○ Vue..."} • {mapReady ? "✓ Carte prête" : "○ Carte..."}</div>}
          </div>
        )}
        {phase === "playing" && !loading && countdown===null && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 bg-black/55 backdrop-blur text-white rounded-full px-4 py-1.5 text-xs font-bold tracking-wide border border-white/10 pointer-events-none">Trouvez la localisation de cette scène</div>
        )}

        {/* ZONE B — CARTE + VÉRIFIER (comme avant, compact) */}
        <div className="hidden lg:block absolute top-4 right-4 bottom-4 w-[380px] z-20">
          <div className="w-full h-full rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.45)] border border-black/10 bg-white flex flex-col">
            <div className="flex-1 relative min-h-0">
              <GuessMap lang={lang} guess={guess} onPick={handlePick} onReady={handleMapReady} result={lastResult ? { real: lastResult.realLocation, guess: lastResult.guessLocation } : null} />
              {phase === "playing" && !guess && <div className="absolute top-3 left-3 right-12 bg-white/95 backdrop-blur rounded-full shadow border border-black/5 px-3 py-2 text-xs font-bold text-center pointer-events-none z-10">Clique sur la carte pour placer ton point</div>}
            </div>
            <div className="p-3 bg-white border-t border-black/5 shrink-0">
              <button disabled={!guess || phase !== "playing" || submitting} onClick={() => doGuess(remaining)} className="w-full h-11 rounded-full bg-[#ff1a1a] hover:bg-[#e10600] disabled:bg-black/10 disabled:text-black/30 text-white font-black tracking-widest text-xs transition">VÉRIFIER</button>
              <div className="mt-2 text-center font-mono text-[11px] text-black/40">{guess ? `${guess.lat.toFixed(4)}, ${guess.lng.toFixed(4)}` : "Aucun point placé"}</div>
            </div>
          </div>
        </div>

        {/* mobile : carte et validation indépendantes */}
        <div className="lg:hidden absolute bottom-0 left-0 right-0 z-20">
          {phase === "playing" && (
            <div className="bg-white border-t border-black/10">
              <button onClick={() => setMobileMapOpen(v=>!v)} className="w-full h-11 bg-white text-black font-bold tracking-widest text-xs">
                {mobileMapOpen ? "FERMER LA CARTE ✕" : "OUVRIR LA CARTE 🗺️"}
              </button>
              {mobileMapOpen && <div className="h-[38vh] bg-white border-t border-black/5"><GuessMap lang={lang} guess={guess} onPick={handlePick} result={null} /></div>}
              <div className="p-3 bg-white border-t border-black/5 flex gap-2">
                <button disabled={!guess || submitting} onClick={() => doGuess(remaining)} className="flex-1 h-11 rounded-full bg-[#ff1a1a] hover:bg-[#e10600] disabled:bg-black/10 disabled:text-black/30 text-white font-black text-xs">VÉRIFIER</button>
                <span className="self-center font-mono text-xs text-black/40">{remaining}s</span>
              </div>
            </div>
          )}
        </div>

        {/* result - centered overlay with own space, not hidden */}
        {phase === "revealing" && lastResult && (() => {
          const d = lastResult.distanceKm;
          const msg = d < 2 ? "Très proche !" : d < 50 ? "Bien joué !" : d < 400 ? "Pas mal !" : "Tu étais loin cette fois.";
          return (
            <div className="absolute inset-0 z-30 grid place-items-center p-4 bg-black/55 backdrop-blur-sm">
              <div className="w-full max-w-[520px] bg-white rounded-2xl p-5 shadow-[0_16px_50px_rgba(0,0,0,0.5)] border border-black/5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-black/40">TON CHOIX ↔ BON ENDROIT</span>
                  <span className="font-mono text-xs text-black/40">ROUND {lastResult.round}</span>
                </div>
                <div className="mt-3 h-[220px] rounded-xl overflow-hidden border border-black/5">
                  <GuessMap lang={lang} guess={guess} onPick={()=>{}} result={{ real: lastResult.realLocation, guess: lastResult.guessLocation }} />
                </div>
                <div className="mt-3 text-sm font-black text-black">{msg}</div>
                <div className="mt-1 text-3xl font-black tracking-tight" style={{color: d<50 ? "#22c55e" : d<400 ? "#f97316" : "#ff1a1a"}}>{d < 1 ? `${Math.round(d*1000)} m` : d<10 ? `${d.toFixed(1)} km` : `${Math.round(d).toLocaleString()} km`}</div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="bg-[#050507] rounded-xl p-3"><div className="font-mono text-[10px] text-white/50">DISTANCE</div><div className="font-mono font-bold text-white">{d < 1 ? `${Math.round(d*1000)} m` : `${Math.round(d).toLocaleString()} km`}</div></div>
                  <div className="bg-[#ff1a1a] rounded-xl p-3"><div className="font-mono text-[10px] text-white/70">SCORE</div><div className="font-mono font-black text-white">{lastResult.score.toLocaleString()} / 5 000</div></div>
                </div>
                <button onClick={nextRound} className="mt-4 w-full h-11 rounded-full bg-[#ff1a1a] hover:bg-[#e10600] text-white font-black tracking-widest text-xs">{lastResult.gameFinished ? "VOIR RÉSULTATS" : "MANCHE SUIVANTE →"}</button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
