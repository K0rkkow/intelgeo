import { useState, useEffect } from "react";
const API = import.meta.env.VITE_API_URL || "";
export function MultiplayerLobby({ initialCode, onStartGame, onBack }: { initialCode?: string | null; onStartGame: (gameId: string, firstRound: any) => void; onBack: () => void }) {
  const [mode, setMode] = useState<"choice" | "create" | "join">(initialCode ? "create" : "choice");
  const [code, setCode] = useState(initialCode || "");
  const [name, setName] = useState(() => localStorage.getItem("intelgeo_name") || "Joueur 1");
  const [players, setPlayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const create = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/api/multiplayer/create`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setCode(data.code); setPlayers(data.players); setMode("create");
      localStorage.setItem("intelgeo_name", name); localStorage.setItem("intelgeo_mp_code", data.code); localStorage.setItem("intelgeo_mp_pid", data.playerId);
    } catch (e: any) { setError(String(e.message || e)); }
    setLoading(false);
  };
  const join = async () => {
    if (!code) return; setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/api/multiplayer/join`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code.toUpperCase(), name }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "Code invalide");
      setPlayers(data.players); setMode("create"); localStorage.setItem("intelgeo_mp_code", code.toUpperCase()); localStorage.setItem("intelgeo_mp_pid", data.playerId);
    } catch (e: any) { setError(String(e.message || e)); }
    setLoading(false);
  };
  useEffect(() => {
    if (mode !== "create" || !code) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`${API}/api/multiplayer/${code}`);
        if (res.ok) { const data = await res.json(); setPlayers(data.players || []); if (data.status === "playing" && data.gameId) onStartGame(data.gameId, data.firstRound); }
      } catch {}
    }, 1500);
    return () => clearInterval(id);
  }, [mode, code]);
  const startGame = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/multiplayer/${code}/start`, { method: "POST" });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "Erreur");
      onStartGame(data.gameId, data.firstRound);
    } catch (e: any) { setError(String(e.message || e)); }
    setLoading(false);
  };
  const copy = () => { navigator.clipboard.writeText(code); };
  if (mode === "choice") {
    return (
      <div className="min-h-screen bg-[#050507] flex flex-col px-4">
        <nav className="h-14 flex items-center justify-between max-w-6xl mx-auto w-full">
          <button onClick={onBack} className="font-mono text-xs tracking-widest text-white/50 hover:text-white">← RETOUR</button>
          <button onClick={onBack} className="flex items-center gap-2 hover:opacity-80 transition">
            <span className="font-black tracking-[0.18em] text-sm">INTELGEO</span>
            <img src="/logo.jpg" alt="IntelGeo" className="w-8 h-8 rounded-full border border-white/10" />
          </button>
        </nav>
        <div className="flex-1 flex flex-col items-center justify-center">
          <img src="/logo.jpg" alt="IntelGeo" className="w-16 h-16 rounded-full border border-white/10" />
          <h1 className="mt-4 text-2xl font-black tracking-[0.18em]">MULTIJOUEUR</h1>
          <div className="mt-8 w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <label className="font-mono text-[10px] tracking-widest text-white/50">TON PSEUDO</label>
            <input value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full h-10 rounded-full bg-[#131316] border border-white/10 px-4 text-sm" placeholder="Joueur 1" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={create} disabled={loading} className="h-11 rounded-full bg-[#ff1a1a] hover:bg-[#e10600] text-white font-black text-xs">CRÉER</button>
              <button onClick={()=>setMode("join")} className="h-11 rounded-full border border-white/20 font-bold text-xs hover:bg-white hover:text-black transition">REJOINDRE</button>
            </div>
            {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          </div>
        </div>
      </div>
    );
  }
  if (mode === "join") {
    return (
      <div className="min-h-screen bg-[#050507] flex flex-col px-4">
        <nav className="h-14 flex items-center justify-between max-w-6xl mx-auto w-full">
          <button onClick={()=>setMode("choice")} className="font-mono text-xs tracking-widest text-white/50 hover:text-white">← RETOUR</button>
          <button onClick={onBack} className="flex items-center gap-2 hover:opacity-80 transition">
            <span className="font-black tracking-[0.18em] text-sm">INTELGEO</span>
            <img src="/logo.jpg" alt="IntelGeo" className="w-8 h-8 rounded-full border border-white/10" />
          </button>
        </nav>
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-xl font-black tracking-widest">REJOINDRE UNE SESSION</h1>
          <div className="mt-6 w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <label className="font-mono text-[10px] tracking-widest text-white/50">CODE DE SESSION</label>
            <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} maxLength={4} placeholder="____" className="mt-1 w-full h-14 rounded-xl bg-[#131316] border border-white/10 text-center text-2xl tracking-[0.4em] font-black" />
            <label className="mt-3 block font-mono text-[10px] tracking-widest text-white/50">PSEUDO</label>
            <input value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full h-10 rounded-full bg-[#131316] border border-white/10 px-4 text-sm" />
            <button onClick={join} disabled={loading || code.length!==4} className="mt-4 w-full h-11 rounded-full bg-[#ff1a1a] hover:bg-[#e10600] text-white font-black disabled:opacity-40">REJOINDRE</button>
            {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#050507] flex flex-col px-4">
      <nav className="h-14 flex items-center justify-between max-w-6xl mx-auto w-full">
        <button onClick={onBack} className="font-mono text-xs tracking-widest text-white/50 hover:text-white">← RETOUR</button>
        <button onClick={onBack} className="flex items-center gap-2 hover:opacity-80 transition">
          <span className="font-black tracking-[0.18em] text-sm">INTELGEO</span>
          <img src="/logo.jpg" alt="IntelGeo" className="w-8 h-8 rounded-full border border-white/10" />
        </button>
      </nav>
      <div className="flex-1 flex flex-col items-center justify-center py-8">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-6">
          <div className="text-center">
            <div className="font-mono text-[10px] tracking-[0.3em] text-white/40">LOBBY</div>
            <div className="mt-2 text-4xl font-black tracking-[0.3em]">{code}</div>
            <button onClick={copy} className="mt-2 text-xs font-mono text-white/50 hover:text-white border border-white/10 rounded-full px-3 py-1">COPIER LE CODE</button>
          </div>
          <div className="mt-6">
            <div className="font-mono text-[10px] tracking-widest text-white/40">JOUEURS ({players.length})</div>
            <div className="mt-2 space-y-2">
              {players.map((p,i)=> (
                <div key={i} className="h-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center gap-3 px-4 text-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> {p}
                </div>
              ))}
              {players.length===0 && <div className="text-sm text-white/30">En attente de joueurs…</div>}
            </div>
          </div>
          <button onClick={startGame} disabled={loading} className="mt-6 w-full h-11 rounded-full bg-[#ff1a1a] hover:bg-[#e10600] text-white font-black tracking-widest text-xs">LANCER LA PARTIE</button>
          {error && <p className="mt-2 text-xs text-red-300 text-center">{error}</p>}
          <p className="mt-3 text-center font-mono text-[10px] text-white/20">Partage le code à tes amis pour qu'ils rejoignent</p>
        </div>
      </div>
    </div>
  );
}
