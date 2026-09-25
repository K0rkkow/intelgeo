const LEVELS = [
  { id: 1, label: "Facile", emoji: "🟢", color: "#22c55e" },
  { id: 2, label: "Moyen", emoji: "🟡", color: "#eab308" },
  { id: 3, label: "Difficile", emoji: "🟠", color: "#f97316" },
  { id: 4, label: "Expert", emoji: "🔴", color: "#ff1a1a" },
];

export function LevelSelect({ onSelect, onBack }: { onSelect: (level: number) => void; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-[#050507] flex flex-col">
      <nav className="h-14 flex items-center justify-between px-6 max-w-6xl mx-auto w-full">
        <button onClick={onBack} className="font-mono text-xs tracking-widest text-white/50 hover:text-white">← RETOUR</button>
        <button onClick={onBack} className="flex items-center gap-2">
          <span className="font-black tracking-[0.18em] text-sm">INTELGEO</span>
          <img src="/logo.jpg" alt="IntelGeo" className="w-8 h-8 rounded-full border border-white/10" />
        </button>
      </nav>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-black tracking-[0.14em]">CHOISIS TON NIVEAU</h1>
        <p className="mt-2 text-white/50 text-sm">Sélectionne la difficulté</p>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-[640px]">
          {LEVELS.map(l => (
            <button
              key={l.id}
              onClick={() => onSelect(l.id)}
              className="group rounded-2xl p-6 border border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07] flex flex-col items-center gap-3 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="text-3xl">{l.emoji}</span>
              <span className="font-black tracking-widest text-sm">{l.label}</span>
              <span className="w-10 h-1 rounded-full transition-colors" style={{ background: l.color }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
