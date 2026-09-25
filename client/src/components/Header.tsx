export function Header({ round, total, time, onHome }: { round: number; total: number; time: string; onHome?: () => void }) {
  const urgent = time <= "00:15"; // string compare ok for mm:ss? better parse
  return (
    <header className="h-[52px] shrink-0 bg-geo-surface border-b border-geo-border flex items-center justify-between px-4 md:px-6">
      <button onClick={onHome} className="flex items-center gap-3 text-left">
        <div className="w-8 h-8 rounded bg-white text-black grid place-items-center font-black text-[11px] tracking-widest">GO</div>
        <span className="font-extrabold tracking-[0.18em] text-sm">GEOOSINT</span>
        <span className="hidden md:inline text-[10px] tracking-widest text-geo-muted border border-geo-border rounded px-2 py-0.5">GEOINT</span>
      </button>
      <div className="flex items-center gap-6 font-mono text-xs">
        <span className="text-geo-muted">ROUND <span className="text-white font-semibold">{round}/{total}</span></span>
        <span className={`px-3 py-1 rounded bg-geo-surface2 border ${urgent ? "border-red-500/50 text-red-400 animate-pulse" : "border-geo-border text-white"}`}>{time}</span>
      </div>
    </header>
  );
}
