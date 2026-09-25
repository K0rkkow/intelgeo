import { useState, useEffect } from "react";
import { getStats, getLeaderboard } from "../lib/progression";

export function Home({ onPlay, onMultiplayer, onBoard }: { onPlay: () => void; onMultiplayer: (action: "create" | "join") => void; onBoard?: () => void }) {
  const [showHow, setShowHow] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [lang, setLang] = useState<"fr"|"en"|"es">(()=> (localStorage.getItem("intelgeo_lang") as any) || "fr");
  const setLangAndSave = (l: "fr"|"en"|"es") => { setLang(l); localStorage.setItem("intelgeo_lang", l); };
  const stats = getStats();
  const board = getLeaderboard().slice(0,5);

  return (
    <div className="min-h-screen bg-[#050507] relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c] via-[#050507] to-[#050507]" />

      <nav className="relative z-10 h-14 flex items-center justify-between px-6 max-w-6xl mx-auto w-full">
        <button onClick={()=>setShowHow(true)} className="font-mono text-[10px] tracking-widest text-white/40 hover:text-white border border-white/10 rounded-full px-3 py-1.5">COMMENT JOUER ?</button>
        <button onClick={()=>window.location.reload()} className="flex items-center gap-2 hover:opacity-80 transition">
          <span className="font-black tracking-[0.18em] text-sm">INTELGEO</span>
          <img src="/logo.jpg" alt="IntelGeo" className="w-8 h-8 rounded-full border border-white/10" />
        </button>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-10">
        <img src="/logo.jpg" alt="IntelGeo" className="w-24 h-24 rounded-full border border-white/10 object-cover" />
        <h1 className="mt-5 text-4xl md:text-5xl font-black tracking-[0.18em]">INTELGEO</h1>
        <p className="mt-2 text-white/60">Explore le monde. Trouve l'endroit.</p>

        <div className="mt-3 flex gap-1.5 justify-center">
          {(["fr","en","es"] as const).map(l=>(
            <button key={l} onClick={()=>setLangAndSave(l)} className={`px-3 py-1 rounded-full text-xs font-bold border transition ${lang===l ? "bg-white text-black border-white" : "border-white/20 text-white/60 hover:text-white"}`}>{l.toUpperCase()}</button>
          ))}
        </div>

        <button onClick={onPlay} className="mt-8 w-full max-w-[360px] h-[56px] rounded-full bg-[#ff1a1a] hover:bg-[#e10600] text-white font-black tracking-[0.16em] text-sm transition">JOUER</button>

        <div className="mt-3 flex flex-col sm:flex-row gap-2 w-full max-w-[360px]">
          <button onClick={()=>onMultiplayer("create")} className="flex-1 h-11 rounded-full bg-white text-black font-bold text-xs tracking-widest hover:bg-[#f2f1ed] transition">MULTIJOUEUR</button>
          <button onClick={()=>setShowHow(true)} className="flex-1 h-11 rounded-full border border-white/20 text-white font-bold text-xs tracking-widest hover:bg-white hover:text-black transition">COMMENT JOUER</button>
        </div>

        <div className="mt-6 w-full max-w-[360px] rounded-2xl bg-white/[0.04] border border-white/10 p-3 flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] tracking-widest text-white/40">PROGRESSION</div>
            <div className="text-sm font-black">{stats.rank} • {stats.xp} XP • {stats.games} parties</div>
            <div className="text-xs text-white/50">Meilleur {stats.bestScore.toLocaleString()} pts • {Math.round(stats.avgDistance)} km moy</div>
          </div>
          <button onClick={()=> (onBoard ? onBoard() : setShowBoard(true))} className="h-8 px-3 rounded-full bg-white/10 border border-white/10 text-xs font-bold hover:bg-white hover:text-black transition">CLASSEMENT</button>
        </div>
        <p className="mt-6 text-center font-mono text-[10px] tracking-widest text-white/20">IntelGeo — Enquête géographique • Noir + Rouge • Premium</p>
      </main>

      {showHow && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={()=>setShowHow(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-[#0c0c0e] border border-white/10 p-6" onClick={e=>e.stopPropagation()}>
            <h2 className="font-black tracking-widest">COMMENT JOUER</h2>
            <ol className="mt-4 space-y-2 text-sm text-white/70 list-decimal list-inside">
              <li>Explore la vue immersive, cherche des indices.</li>
              <li>Ouvre la carte colorée à droite.</li>
              <li>Clique où tu penses être.</li>
              <li>Appuie sur <b className="text-[#ff1a1a]">VÉRIFIER</b>.</li>
              <li>Vois la distance et ton score.</li>
            </ol>
            <button onClick={()=>setShowHow(false)} className="mt-6 w-full h-10 rounded-full bg-white text-black font-bold">COMPRIS</button>
          </div>
        </div>
      )}
      {showBoard && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={()=>setShowBoard(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5" onClick={e=>e.stopPropagation()}>
            <h2 className="font-black tracking-widest text-black">CLASSEMENT</h2>
            <div className="mt-4 space-y-2">
              {board.length===0 && <div className="text-sm text-black/50">Aucune partie jouée — lance une partie !</div>}
              {board.map((e,i)=>(
                <div key={i} className="flex items-center justify-between h-10 rounded-full bg-black/[0.04] border border-black/5 px-4">
                  <span className="font-bold text-sm">#{i+1} {e.pseudo}</span>
                  <span className="font-mono text-xs">{e.score.toLocaleString()} pts • {e.rank}</span>
                </div>
              ))}
            </div>
            <button onClick={()=>setShowBoard(false)} className="mt-4 w-full h-10 rounded-full bg-black text-white font-bold">FERMER</button>
          </div>
        </div>
      )}
    </div>
  );
}
