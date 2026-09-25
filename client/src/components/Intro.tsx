import { useEffect, useState } from "react";

export function Intro({ onEnter }: { onEnter: () => void }) {
  const [phase, setPhase] = useState(0);
  const [exiting, setExiting] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100);
    const t2 = setTimeout(() => setPhase(2), 650);
    const t3 = setTimeout(() => setPhase(3), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);
  const handleEnter = () => { setExiting(true); setTimeout(onEnter, 600); };
  return (
    <div className={`fixed inset-0 z-[100] bg-[#050507] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-600 ${exiting ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-[#050507] via-[#050507] to-[#0a0a0c]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-white/[0.015] blur-[80px] pointer-events-none" />

      <div className={`relative flex flex-col items-center transition-all duration-700 ${exiting ? "scale-105 opacity-0" : "scale-100 opacity-100"}`}>
        <div className={`relative transition-all duration-[900ms] ease-out ${phase >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
          <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full bg-[#0c0c0e] border border-white/10 p-1.5 overflow-hidden">
            <img src="/logo.jpg" alt="IntelGeo" className="w-full h-full object-cover rounded-full" />
          </div>
        </div>
        <div className={`mt-7 text-center transition-all duration-700 ${phase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
          <h1 className="text-[32px] md:text-[42px] font-black tracking-[0.22em] text-white">INTELGEO</h1>
          <p className="mt-2 text-sm md:text-[15px] tracking-wide text-white/60 font-light">Explore le monde. Trouve l'endroit.</p>
        </div>
        <div className={`mt-10 transition-all duration-700 ${phase >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
          <button onClick={handleEnter} className="px-10 py-4 bg-[#ff1a1a] hover:bg-[#e10600] text-white font-black tracking-[0.16em] text-sm rounded-full transition-colors">
            ENTRER
          </button>
        </div>
      </div>
      <div className="absolute bottom-6 font-mono text-[10px] tracking-[0.2em] text-white/20">JEU DE GÉOLOCALISATION</div>
    </div>
  );
}
