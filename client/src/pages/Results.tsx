import type { GuessResult } from "../types/game";

export function Results({ results, onReplay, onMenu, onBoard }: { results: GuessResult[]; onReplay: () => void; onMenu: () => void; onBoard?: () => void }) {
  const total = results.reduce((a, r) => a + r.score, 0);
  const avg = results.length ? results.reduce((a, r) => a + r.distanceKm, 0) / results.length : 0;
  const best = Math.max(...results.map((r) => r.score), 0);
  const totalDist = results.reduce((a,r)=>a+r.distanceKm,0);
  return (
    <div className="min-h-screen bg-[#050507] px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <span className="font-mono text-[10px] tracking-widest text-white/30">JEU TERMINÉ</span>
          <button onClick={onMenu} className="flex items-center gap-2 hover:opacity-80 transition">
            <span className="font-black tracking-[0.18em] text-sm">INTELGEO</span>
            <img src="/logo.jpg" alt="IntelGeo" className="w-8 h-8 rounded-full border border-white/10" />
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-mac">
          <div className="font-mono text-[10px] tracking-[0.3em] text-black/40 text-center">PARTIE TERMINÉE</div>
          <div className="mt-2 text-4xl md:text-5xl font-black text-center tracking-tight">{total.toLocaleString()} <span className="text-lg font-bold text-black/40">PTS</span></div>
          <div className="mt-1 text-center text-sm text-black/50">{results.length} / {results.length} manches • Distance totale {Math.round(totalDist).toLocaleString()} km</div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="bg-[#050507] rounded-2xl p-4 text-center"><div className="font-mono text-[10px] tracking-widest text-white/40">SCORE TOTAL</div><div className="text-xl font-black font-mono text-white mt-1">{total.toLocaleString()}</div></div>
            <div className="bg-[#050507] rounded-2xl p-4 text-center"><div className="font-mono text-[10px] tracking-widest text-white/40">DIST. MOY</div><div className="text-xl font-black font-mono text-white mt-1">{avg < 1 ? `${Math.round(avg*1000)} m` : `${Math.round(avg).toLocaleString()} km`}</div></div>
            <div className="bg-[#ff1a1a] rounded-2xl p-4 text-center"><div className="font-mono text-[10px] tracking-widest text-white/70">MEILLEURE MANCHE</div><div className="text-xl font-black font-mono text-white mt-1">{best.toLocaleString()}</div></div>
          </div>
          <div className="mt-6 flex gap-3 justify-center flex-wrap">
            <button onClick={onReplay} className="h-11 px-7 rounded-full bg-[#ff1a1a] hover:bg-[#e10600] text-white font-black text-xs tracking-widest transition shadow-[0_4px_16px_rgba(255,26,26,0.3)]">REJOUER</button>
            <button onClick={onMenu} className="h-11 px-7 rounded-full bg-black text-white font-bold text-xs tracking-widest hover:bg-[#1a1a1e] transition">MENU PRINCIPAL</button>
            {onBoard && <button onClick={onBoard} className="h-11 px-7 rounded-full border border-black/10 font-bold text-xs tracking-widest hover:bg-black hover:text-white transition">CLASSEMENT</button>}
          </div>
        </div>

        <div className="mt-4 bg-white rounded-2xl overflow-hidden shadow-mac">
          {results.map((r) => (
            <div key={r.round} className="flex items-center justify-between px-4 py-3 border-b border-black/5 last:border-0 hover:bg-black/[0.02] transition">
              <span className="text-xs font-bold tracking-widest text-black">ROUND {r.round}</span>
              <span className="font-mono text-sm font-black text-black">{r.score.toLocaleString()}</span>
              <span className="font-mono text-sm text-black/40">{Math.round(r.distanceKm).toLocaleString()} km</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
