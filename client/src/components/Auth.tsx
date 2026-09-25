import { useState } from "react";
const API = import.meta.env.VITE_API_URL || "";

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
    <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center px-4">
      <img src="/logo.jpg" alt="IntelGeo" className="w-16 h-16 rounded-full border border-white/10" />
      <h1 className="mt-4 text-2xl font-black tracking-[0.18em]">INTELGEO</h1>
      <p className="mt-1 text-sm text-white/50">Crée ton profil pour le classement officiel</p>

      <div className="mt-6 w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
        <div className="flex gap-2 mb-4">
          <button onClick={()=>setMode("register")} className={`flex-1 h-8 rounded-full text-xs font-black tracking-widest ${mode==="register" ? "bg-black text-white" : "bg-black/5 text-black/50"}`}>INSCRIPTION</button>
          <button onClick={()=>setMode("login")} className={`flex-1 h-8 rounded-full text-xs font-black tracking-widest ${mode==="login" ? "bg-black text-white" : "bg-black/5 text-black/50"}`}>CONNEXION</button>
        </div>

        <label className="font-mono text-[10px] tracking-widest text-black/40">PSEUDO</label>
        <input value={pseudo} onChange={e=>setPseudo(e.target.value)} placeholder="Ton pseudo" className="mt-1 w-full h-10 rounded-full bg-black/[0.04] border border-black/10 px-4 text-sm" maxLength={16} />

        <label className="mt-3 block font-mono text-[10px] tracking-widest text-black/40">MOT DE PASSE</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••" className="mt-1 w-full h-10 rounded-full bg-black/[0.04] border border-black/10 px-4 text-sm" />

        {mode==="register" && <>
          <label className="mt-3 block font-mono text-[10px] tracking-widest text-black/40">CONTINENT</label>
          <select value={continent} onChange={e=>setContinent(e.target.value)} className="mt-1 w-full h-10 rounded-full bg-black/[0.04] border border-black/10 px-4 text-sm">
            <option>Europe</option><option>Asie</option><option>Afrique</option><option>Amérique du Nord</option><option>Amérique du Sud</option><option>Océanie</option>
          </select>
        </>}

        {error && <div className="mt-3 text-xs text-[#ff1a1a] bg-[#ff1a1a]/10 rounded-full px-3 py-2">{error}</div>}

        <button onClick={submit} disabled={loading || !pseudo || !password} className="mt-4 w-full h-11 rounded-full bg-[#ff1a1a] hover:bg-[#e10600] disabled:opacity-40 text-white font-black tracking-widest text-xs"> {mode==="register" ? "CRÉER MON PROFIL →" : "SE CONNECTER →"} </button>
        <p className="mt-2 text-center font-mono text-[10px] text-black/30">Classement monde & continent • Progression sauvegardée</p>
      </div>
    </div>
  );
}
