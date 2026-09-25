import { useState, useEffect } from "react";
import type { GameConfig, Region, Difficulty } from "../types/game";

const REGIONS: { v: Region; l: string }[] = [
  { v: "world", l: "MONDE" },
  { v: "europe", l: "EUROPE" },
  { v: "north-america", l: "AMÉRIQUE N." },
  { v: "south-america", l: "AMÉRIQUE S." },
  { v: "asia", l: "ASIE" },
  { v: "africa", l: "AFRIQUE" },
  { v: "oceania", l: "OCÉANIE" },
  { v: "france", l: "FRANCE" },
];

export function Menu({ onStart }: { onStart: (cfg: GameConfig) => void }) {
  const [rounds, setRounds] = useState(5);
  const [time, setTime] = useState(120);
  const [region, setRegion] = useState<Region>("world");
  const [difficulty, setDifficulty] = useState<Difficulty>("expert");
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => {
    const v = localStorage.getItem("geoosint_best");
    if (v) setBest(Number(v));
  }, []);

  return (
    <div className="min-h-screen bg-geo-bg relative overflow-hidden flex flex-col">
      {/* subtle grid */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <nav className="relative z-10 h-14 border-b border-white/5 flex items-center justify-between px-6 max-w-6xl mx-auto w-full">
        <span className="text-xs tracking-[0.2em] font-semibold text-geo-muted">GEOINT // OSINT</span>
        <span className="text-[11px] font-mono text-geo-muted">v1.0 — WORLD INTEL</span>
      </nav>

      <main className="relative z-10 flex-1 grid place-items-center px-4 py-10">
        <div className="w-full max-w-5xl grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
          {/* Left hero */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-geo-border bg-geo-surface px-3 py-1 text-[11px] tracking-widest text-geo-muted">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> SYSTEM READY
            </div>
            <h1 className="mt-6 text-5xl md:text-6xl font-black tracking-[0.14em]">GEOOSINT</h1>
            <p className="text-xs tracking-[0.28em] text-geo-muted mt-2">GEOGRAPHIC INTELLIGENCE CHALLENGE</p>
            <p className="mt-6 text-geo-muted max-w-md leading-relaxed text-sm">Test your ability to read the world. Analyse the terrain, vegetation, signage and infrastructure. Place your estimate.</p>

            <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
              <div className="rounded-lg border border-geo-border bg-geo-surface p-3">
                <div className="text-[10px] tracking-widest text-geo-muted">BEST</div>
                <div className="font-mono font-bold text-lg">{best ? best.toLocaleString() : "—"}</div>
              </div>
              <div className="rounded-lg border border-geo-border bg-geo-surface p-3">
                <div className="text-[10px] tracking-widest text-geo-muted">GAMES</div>
                <div className="font-mono font-bold text-lg">{localStorage.getItem("geoosint_games") || "0"}</div>
              </div>
              <div className="rounded-lg border border-geo-border bg-geo-surface p-3">
                <div className="text-[10px] tracking-widest text-geo-muted">MODE</div>
                <div className="font-mono font-bold text-lg text-geo-accent">WORLD</div>
              </div>
            </div>
          </div>

          {/* Config card */}
          <div className="rounded-2xl border border-geo-border bg-geo-surface/80 backdrop-blur p-6 md:p-7 shadow-2xl">
            <h2 className="text-xs tracking-[0.2em] text-geo-muted">CONFIGURATION</h2>

            <div className="mt-5">
              <label className="text-[11px] tracking-widest text-geo-muted">MANCHES</label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {[1, 3, 5, 10].map((n) => (
                  <button key={n} onClick={() => setRounds(n)} className={`h-10 rounded-lg border text-sm font-semibold ${rounds === n ? "bg-white text-black border-white" : "bg-geo-surface2 border-geo-border text-geo-muted hover:text-white"}`}>{n}</button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <label className="text-[11px] tracking-widest text-geo-muted">TEMPS / MANCHE</label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {[30, 60, 120, 180].map((n) => (
                  <button key={n} onClick={() => setTime(n)} className={`h-10 rounded-lg border text-sm font-semibold ${time === n ? "bg-white text-black border-white" : "bg-geo-surface2 border-geo-border text-geo-muted hover:text-white"}`}>{n}s</button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <label className="text-[11px] tracking-widest text-geo-muted">ZONE</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {REGIONS.map((r) => (
                  <button key={r.v} onClick={() => setRegion(r.v)} className={`h-9 rounded-lg border text-xs font-semibold tracking-wide ${region === r.v ? "bg-geo-accent text-black border-geo-accent" : "bg-geo-surface2 border-geo-border text-geo-muted hover:text-white"}`}>{r.l}</button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <label className="text-[11px] tracking-widest text-geo-muted">DIFFICULTÉ</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["easy", "expert"] as Difficulty[]).map((d) => (
                  <button key={d} onClick={() => setDifficulty(d)} className={`h-9 rounded-lg border text-xs font-semibold tracking-wide ${difficulty === d ? "bg-white text-black border-white" : "bg-geo-surface2 border-geo-border text-geo-muted hover:text-white"}`}>{d.toUpperCase()}</button>
                ))}
              </div>
            </div>

            <button onClick={() => onStart({ rounds, timeLimit: time, region, difficulty })} className="mt-7 w-full h-12 rounded-lg bg-geo-accent hover:bg-cyan-300 text-black font-black tracking-[0.14em] text-sm transition">COMMENCER UNE PARTIE →</button>
            <p className="mt-3 text-center text-[11px] text-geo-muted font-mono">100% gratuit — OSM + Mapillary (aucune carte bancaire)</p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-4 text-center text-[11px] font-mono text-geo-muted">© 2026 GeoOSINT — 100% gratuit • OSM + Mapillary • Not affiliated with Google</footer>
    </div>
  );
}
