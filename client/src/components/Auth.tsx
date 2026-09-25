import { useState } from "react";
import { API } from "../lib/api";

export function Auth({ onAuth }: { onAuth: (token: string, user: any) => void }) {
  const [mode, setMode] = useState<"login"|"register">("register");
  const [pseudo, setPseudo] = useState("");
  const [password, setPassword] = useState("");
  const [continent, setContinent] = useState("Europe");
  const [error, setError] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null); setLoading(true);
    try {
      const url = `${API}/api/auth/${mode}`;
      const body: any = { pseudo, password };
      if (mode==="register") body.continent = continent;
      const res = await fetch(url, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      localStorage.setItem("intelgeo_token", data.token);
      localStorage.setItem("intelgeo_user", JSON.stringify(data.user));
      localStorage.setItem("intelgeo_name", data.user.pseudo);
      onAuth(data.token, data.user);
    } catch(e:any){ setError(e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050507] relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c] via-[#050507] to-[#050507]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "32px 32px" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#ff1a1a]/[0.015] blur-[80px] pointer-events-none" />

      <nav className="relative z-10 h-14 flex items-center justify-between px-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2 text-white/30 font-mono text-[10px] tracking-[0.2em]">ENQUÊTE • GÉOLOCALISATION</div>
        <div className="flex items-center gap-2">
          <span className="font-black tracking-[0.18em] text-sm">INTELGEO</span>
          <img src="/logo.jpg" alt="IntelGeo" className="w-7 h-7 rounded-full border border-white/10" />
        </div>
      </nav>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full mx-auto bg-[#0c0c0e] border border-white/10 p-1.5">
            <img src="/logo.jpg" alt="IntelGeo" className="w-full h-full rounded-full object-cover" />
          </div>
          <h1 className="mt-4 text-[22px] font-black tracking-[0.14em]">REJOINS L'ENQUÊTE</h1>
          <p className="mt-1 text-sm text-white/50">Ton profil enquêteur • Classement officiel</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-full px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-[#ff1a1a] animate-pulse" />
            <span className="font-mono text-[10px] tracking-widest text-white/60">MONDE • CONTINENT • PROGRESSION SAUVEGARDÉE</span>
          </div>
        </div>

        <div className="mt-6 w-full max-w-[380px] rounded-[24px] bg-[#0c0c0e] border border-white/10 overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
          <div className="p-1.5 flex gap-1.5 bg-white/[0.04] m-1.5 rounded-full">
            <button onClick={()=>setMode("register")} className={`flex-1 h-8 rounded-full text-xs font-black tracking-widest transition ${mode==="register" ? "bg-white text-black shadow" : "text-white/50 hover:text-white"}`}>INSCRIPTION</button>
            <button onClick={()=>setMode("login")} className={`flex-1 h-8 rounded-full text-xs font-black tracking-widest transition ${mode==="login" ? "bg-white text-black shadow" : "text-white/50 hover:text-white"}`}>CONNEXION</button>
          </div>

          <div className="p-5 pt-3">
            <label className="font-mono text-[10px] tracking-[0.2em] text-white/40">PSEUDO ENQUÊTEUR</label>
            <div className="mt-1.5 relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 text-sm">◎</span>
              <input value={pseudo} onChange={e=>setPseudo(e.target.value)} placeholder="Ex: Atlas" maxLength={16} className="w-full h-11 rounded-full bg-white/[0.06] border border-white/10 pl-9 pr-4 text-sm placeholder:text-white/30 focus:outline-none focus:border-[#ff1a1a]/40 focus:bg-white/[0.08] transition" />
            </div>

            <label className="mt-4 block font-mono text-[10px] tracking-[0.2em] text-white/40">MOT DE PASSE</label>
            <div className="mt-1.5 relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 text-sm">◈</span>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="w-full h-11 rounded-full bg-white/[0.06] border border-white/10 pl-9 pr-4 text-sm placeholder:text-white/30 focus:outline-none focus:border-[#ff1a1a]/40 focus:bg-white/[0.08] transition" />
            </div>

            {mode==="register" && (
              <div className="mt-4">
                <label className="font-mono text-[10px] tracking-[0.2em] text-white/40">TERRITOIRE</label>
                <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                  {["Europe","Asie","Afrique","Amérique du Nord","Amérique du Sud","Océanie"].map(c=>(
                    <button key={c} onClick={()=>setContinent(c)} className={`h-8 rounded-full text-[11px] font-bold border transition ${continent===c ? "bg-[#ff1a1a] border-[#ff1a1a] text-white" : "bg-white/[0.04] border-white/10 text-white/60 hover:border-white/20 hover:text-white"}`}>{c.split(" ")[0]}</button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-white/30 font-mono">Détermine ton classement continent</p>
              </div>
            )}

            {error && <div className="mt-4 text-xs text-white bg-[#ff1a1a] rounded-full px-4 py-2 text-center font-bold">{error}</div>}

            <button onClick={submit} disabled={loading || !pseudo || !password} className="mt-5 w-full h-11 rounded-full bg-[#ff1a1a] hover:bg-[#e10600] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black tracking-[0.14em] text-xs transition flex items-center justify-center gap-2">
              {loading ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : null}
              {mode==="register" ? "CRÉER MON DOSSIER →" : "OUVRIR MON DOSSIER →"}
            </button>

            <div className="mt-3 flex items-center gap-2 text-[10px] font-mono tracking-widest text-white/20 justify-center">
              <span>○ Chiffré</span><span>•</span><span>○ Classement officiel</span><span>•</span><span>○ Reprise auto</span>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center font-mono text-[10px] tracking-widest text-white/20">IntelGeo — Enquête géographique • Noir + Rouge • Premium</p>
      </div>
    </div>
  );
}
