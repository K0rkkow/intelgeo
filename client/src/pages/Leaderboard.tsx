import { useEffect, useState } from "react";
import { API } from "../lib/api";
const CONTINENTS = ["Europe","Asie","Afrique","Amérique du Nord","Amérique du Sud","Océanie"] as const;
const RANKS: Record<string, string> = { Bronze: "🥉", Argent: "🥈", Or: "🥇", Platine: "💎", Diamant: "👑" };

export function Leaderboard({ onBack }: { onBack: () => void }) {
  const [scope, setScope] = useState<"world"|"continent">("world");
  const [continent, setContinent] = useState<string>("Europe");
  const [sort, setSort] = useState<"xp"|"score"|"distance">("xp");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBoard = async () => {
    setLoading(true);
    const url = `${API}/api/leaderboard?scope=${scope}&continent=${encodeURIComponent(continent)}&sort=${sort}&limit=50`;
    const res = await fetch(url);
    const j = await res.json();
    setData(j.data || []);
    setLoading(false);
  };
  useEffect(()=>{ fetchBoard(); }, [scope, continent, sort]);

  return (
    <div className="min-h-screen bg-[#050507] px-4 py-6">
      <nav className="h-14 flex items-center justify-between max-w-5xl mx-auto w-full">
        <button onClick={onBack} className="font-mono text-xs tracking-widest text-white/50 hover:text-white">← RETOUR</button>
        <div className="flex items-center gap-2">
          <span className="font-black tracking-[0.18em] text-sm">INTELGEO</span>
          <img src="/logo.jpg" alt="IntelGeo" className="w-8 h-8 rounded-full border border-white/10" />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto mt-6">
        <h1 className="text-2xl font-black tracking-[0.14em]">CLASSEMENT OFFICIEL</h1>
        <p className="text-sm text-white/50 mt-1">Monde & continents • XP • Score • Précision</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={()=>setScope("world")} className={`h-8 px-4 rounded-full text-xs font-black tracking-widest border ${scope==="world" ? "bg-white text-black border-white" : "border-white/20 text-white/60"}`}>MONDE</button>
          <button onClick={()=>setScope("continent")} className={`h-8 px-4 rounded-full text-xs font-black tracking-widest border ${scope==="continent" ? "bg-white text-black border-white" : "border-white/20 text-white/60"}`}>CONTINENT</button>
          {scope==="continent" && (
            <select value={continent} onChange={e=>setContinent(e.target.value)} className="h-8 rounded-full bg-white text-black px-3 text-xs font-bold">
              {CONTINENTS.map(c=> <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <div className="ml-auto flex gap-1">
            {(["xp","score","distance"] as const).map(s=>(
              <button key={s} onClick={()=>setSort(s)} className={`h-8 px-3 rounded-full text-xs font-bold border ${sort===s ? "bg-[#ff1a1a] text-white border-[#ff1a1a]" : "border-white/15 text-white/50"}`}>{s==="xp"?"XP":s==="score"?"SCORE":"PRÉCISION"}</button>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.3)]">
          <div className="grid grid-cols-[40px_1fr_80px_80px_90px] gap-2 px-4 py-2 bg-black text-white font-mono text-[10px] tracking-widest">
            <span>#</span><span>JOUEUR</span><span>RANG</span><span>XP</span><span className="text-right">SCORE</span>
          </div>
          {loading ? <div className="p-8 text-center text-sm text-black/40">Chargement...</div> :
            data.map((row:any)=>(
              <div key={row.pseudo+row.position} className="grid grid-cols-[40px_1fr_80px_80px_90px] gap-2 px-4 py-3 border-b border-black/5 items-center hover:bg-black/[0.02]">
                <span className="font-black text-sm">{row.position<=3 ? ["🥇","🥈","🥉"][row.position-1] : `#${row.position}`}</span>
                <span className="font-bold text-sm truncate">{row.pseudo} <span className="font-mono text-[10px] text-black/30 ml-1">{row.continent}</span></span>
                <span className="text-xs font-bold">{RANKS[row.rank]||""} {row.rank}</span>
                <span className="font-mono text-xs">{row.xp.toLocaleString()}</span>
                <span className="font-mono text-xs text-right">{row.bestScore.toLocaleString()} pts<br/><span className="text-[10px] text-black/40">{row.avgDistance} km • {row.games} parties</span></span>
              </div>
            ))}
          {!loading && data.length===0 && <div className="p-8 text-center text-sm text-black/40">Aucun joueur dans ce classement</div>}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3"><div className="font-mono text-[10px] tracking-widest text-white/40">RANGS</div><div className="text-xs font-bold">Bronze → Diamant</div></div>
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3"><div className="font-mono text-[10px] tracking-widest text-white/40">XP</div><div className="text-xs">1 XP = 10 pts</div></div>
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3"><div className="font-mono text-[10px] tracking-widest text-white/40">CLASSEMENT</div><div className="text-xs">Monde & par continent</div></div>
        </div>
      </div>
    </div>
  );
}
