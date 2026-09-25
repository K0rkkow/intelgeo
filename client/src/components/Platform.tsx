import { useState, useEffect } from "react";
import { IntelMap } from "./IntelMap";

type Marker = { id: string; lat: number; lng: number; label: string; ts: number };

const NAV = [
  { id: "carte", label: "Carte", icon: "◉" },
  { id: "investigations", label: "Investigations", icon: "◈" },
  { id: "marqueurs", label: "Marqueurs", icon: "◎" },
  { id: "donnees", label: "Données", icon: "▤" },
  { id: "historique", label: "Historique", icon: "◷" },
  { id: "parametres", label: "Paramètres", icon: "⚙" },
];

export function Platform({ onStartGame }: { onStartGame: (opts: { rounds: number; time: number; region: string }) => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState("carte");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [center, setCenter] = useState<[number, number]>([48.86, 2.33]);
  const [markers, setMarkers] = useState<Marker[]>([
    { id: "1", lat: 48.85837, lng: 2.29448, label: "Paris — Tour Eiffel", ts: Date.now() - 1000 * 60 * 12 },
  ]);
  const [selected, setSelected] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [rounds, setRounds] = useState(5);
  const [time, setTime] = useState(120);
  const [region, setRegion] = useState("world");
  const [cursor, setCursor] = useState<{ lat: number; lng: number } | null>(null);

  // search via Nominatim (gratuit, pas de clé)
  const doSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`, { headers: { Accept: "application/json" } });
      const data = await res.json();
      if (data[0]) {
        const lat = parseFloat(data[0].lat), lon = parseFloat(data[0].lon);
        setCenter([lat, lon]);
        const id = Date.now().toString();
        setMarkers((m) => [...m, { id, lat, lng: lon, label: data[0].display_name.slice(0, 48), ts: Date.now() }]);
        setSelected(id);
      }
    } catch {}
    setSearching(false);
  };

  const selectedMarker = markers.find((m) => m.id === selected) || null;

  // responsive collapsed default
  useEffect(() => { if (window.innerWidth < 1024) setCollapsed(true); }, []);

  return (
    <div className="h-[100dvh] flex bg-[#050507] text-[#f2f1ed] overflow-hidden">
      {/* Sidebar */}
      <aside className={`${collapsed ? "w-[64px]" : "w-[280px]"} shrink-0 bg-[#0c0c0e] border-r border-[#1e1e22] flex flex-col transition-all duration-300 z-20`}>
        <div className="h-14 flex items-center gap-3 px-3 border-b border-[#1e1e22]">
          <img src="/logo.jpg" alt="IntelGeo" className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-black tracking-[0.18em] text-sm leading-none">INTELGEO</div>
              <div className="font-mono text-[10px] tracking-[0.2em] text-[#9a9da3]">GEOINT PLATFORM</div>
            </div>
          )}
          <button onClick={() => setCollapsed((v) => !v)} className="ml-auto w-7 h-7 grid place-items-center rounded-full border border-white/10 hover:bg-white hover:text-black transition text-xs">
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {!collapsed && (
          <div className="p-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5f67] text-xs">⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                placeholder="Lieu, adresse, coordonnées…"
                className="w-full h-9 pl-8 pr-3 rounded-full bg-[#131316] border border-[#1e1e22] text-xs placeholder:text-[#5c5f67] focus:outline-none focus:border-white/20 transition"
              />
            </div>
            <button onClick={doSearch} disabled={searching} className="mt-2 w-full h-8 rounded-full bg-[#f2f1ed] text-black text-xs font-bold tracking-widest hover:bg-white transition disabled:opacity-50">
              {searching ? "RECHERCHE…" : "RECHERCHER"}
            </button>
          </div>
        )}

        <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setActive(n.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs tracking-wide transition ${active === n.id ? "bg-[#f2f1ed] text-black" : "text-[#9a9da3] hover:bg-white/5 hover:text-[#f2f1ed]"}`}
            >
              <span className="w-5 text-center">{n.icon}</span>
              {!collapsed && <span className="font-medium">{n.label}</span>}
              {!collapsed && active === n.id && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-black" />}
            </button>
          ))}
        </nav>

        {!collapsed && (
          <div className="p-3 border-t border-[#1e1e22]">
            <div className="glass rounded-xl p-3">
              <div className="font-mono text-[10px] tracking-widest text-[#5c5f67]">SESSION</div>
              <div className="text-xs font-mono text-[#f2f1ed] mt-1">{markers.length} marqueurs • {new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar */}
        <header className="h-14 shrink-0 bg-[#0c0c0e]/80 backdrop-blur border-b border-[#1e1e22] flex items-center gap-3 px-3 md:px-4 z-10">
          <div className="hidden md:flex items-center gap-2 font-mono text-[10px] tracking-widest text-[#5c5f67]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> SYSTEM SECURE
            <span className="ml-2 px-2 py-1 rounded-full border border-white/10 text-[#f2f1ed]">OSINT MODE</span>
          </div>
          <div className="flex-1 flex justify-center md:justify-end gap-2">
            <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-[#9a9da3]">
              <span>LAT {center[0].toFixed(3)}°</span>
              <span className="opacity-30">•</span>
              <span>LNG {center[1].toFixed(3)}°</span>
            </div>
            <button onClick={() => setPanelOpen((v) => !v)} className="h-8 px-4 rounded-full bg-[#f2f1ed] text-black text-xs font-bold hover:bg-white transition">
              {panelOpen ? "MASQUER" : "INVESTIGATION"}
            </button>
          </div>
        </header>

        {/* Map area */}
        <div className="flex-1 relative min-h-0">
          <IntelMap
            center={center}
            markers={markers}
            selectedId={selected}
            cursorPos={cursor}
            onPick={(p) => {
              setCursor(p);
              const id = Date.now().toString();
              setMarkers((m) => [...m, { id, lat: p.lat, lng: p.lng, label: `Marqueur ${m.length + 1}`, ts: Date.now() }]);
              setSelected(id);
            }}
            onMarkerSelect={setSelected}
          />

          {/* Investigation panel overlay right */}
          <div className={`absolute top-3 right-3 bottom-3 w-[360px] max-w-[92vw] flex flex-col gap-3 transition-transform duration-300 ${panelOpen ? "translate-x-0" : "translate-x-[calc(100%+12px)]"}`}>
            {/* New investigation */}
            <div className="glass-strong rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold tracking-[0.12em] text-xs">NOUVELLE INVESTIGATION</h2>
                <button onClick={() => setPanelOpen(false)} className="w-6 h-6 grid place-items-center rounded-full border border-white/10 text-xs">✕</button>
              </div>
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {[1, 3, 5].map((n) => (
                    <button key={n} onClick={() => setRounds(n)} className={`h-8 rounded-full border text-xs font-bold ${rounds === n ? "bg-[#f2f1ed] text-black border-[#f2f1ed]" : "border-white/10 text-[#9a9da3] hover:text-white"}`}>{n} MANCHES</button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[60, 120, 180].map((v) => (
                    <button key={v} onClick={() => setTime(v)} className={`h-8 rounded-full border text-xs font-bold ${time === v ? "bg-[#f2f1ed] text-black border-[#f2f1ed]" : "border-white/10 text-[#9a9da3] hover:text-white"}`}>{v}s</button>
                  ))}
                </div>
                <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full h-9 rounded-full bg-[#131316] border border-[#1e1e22] px-3 text-xs">
                  <option value="world">Monde</option>
                  <option value="europe">Europe</option>
                  <option value="france">France</option>
                  <option value="asia">Asie</option>
                  <option value="africa">Afrique</option>
                </select>
                <button onClick={() => onStartGame({ rounds, time, region })} className="w-full h-10 rounded-full bg-[#f2f1ed] text-black font-black tracking-[0.14em] text-xs hover:bg-white transition">LANCER L'INVESTIGATION →</button>
                <p className="text-center font-mono text-[10px] text-[#5c5f67]">OSM gratuit • Mapillary street-level</p>
              </div>
            </div>

            {/* Panels */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-2xl p-3">
                <div className="font-mono text-[10px] tracking-widest text-[#5c5f67]">LOCATION</div>
                {selectedMarker ? (
                  <div className="mt-2 font-mono text-xs leading-relaxed text-[#f2f1ed]">
                    LAT {selectedMarker.lat.toFixed(5)}<br />LNG {selectedMarker.lng.toFixed(5)}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-[#9a9da3]">Aucune sélection</div>
                )}
              </div>
              <div className="glass rounded-2xl p-3">
                <div className="font-mono text-[10px] tracking-widest text-[#5c5f67]">MAP DATA</div>
                <div className="mt-2 font-mono text-xs text-[#f2f1ed]">Zoom • Grille WGS84<br />Distance • Orientation</div>
              </div>
            </div>

            {/* Markers list */}
            <div className="flex-1 glass rounded-2xl p-3 overflow-hidden flex flex-col min-h-[160px]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-widest text-[#5c5f67]">MARQUEURS ({markers.length})</span>
                <button onClick={() => setMarkers([])} className="font-mono text-[10px] text-[#9a9da3] hover:text-white">EFFACER</button>
              </div>
              <div className="mt-2 flex-1 overflow-auto space-y-1 pr-1">
                {markers.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setSelected(m.id); setCenter([m.lat, m.lng]); }}
                    className={`w-full text-left px-3 py-2 rounded-xl border text-xs flex items-center gap-2 transition ${selected === m.id ? "bg-white text-black border-white" : "bg-white/5 border-white/5 hover:bg-white/10 text-[#f2f1ed]"}`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${selected === m.id ? "bg-black" : "bg-[#f2f1ed]"}`} />
                    <span className="truncate">{m.label}</span>
                    <span className="ml-auto font-mono text-[10px] opacity-60">{new Date(m.ts).toLocaleTimeString()}</span>
                  </button>
                ))}
                {markers.length === 0 && <div className="text-xs text-[#5c5f67] py-6 text-center">Clique sur la carte pour ajouter un marqueur</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
