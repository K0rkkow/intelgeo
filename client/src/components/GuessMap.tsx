import { useEffect, useRef, useState } from "react";
import L from "leaflet";

function tileForLang(lang: string) {
  if (lang === "fr") return "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png";
  // en/es use standard OSM (labels in local language, but we respect preference via nominatim)
  return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
}

export function GuessMap({
  guess,
  onPick,
  result,
  lang = "fr",
  onReady,
}: {
  guess: { lat: number; lng: number } | null;
  onPick: (p: { lat: number; lng: number }) => void;
  result?: { real: { lat: number; lng: number }; guess: { lat: number; lng: number } } | null;
  lang?: string;
  onReady?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ guess?: L.Marker; real?: L.Marker; line?: L.Polyline }>({});
  const tileRef = useRef<L.TileLayer | null>(null);
  const [mode, setMode] = useState<"carte" | "satellite">("carte");

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { zoomControl: false, attributionControl: false, worldCopyJump: true }).setView([20, 0], 2);
    tileRef.current = L.tileLayer(tileForLang(lang), { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (result) return;
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    // carte prête quand tuiles chargées
    tileRef.current.on("load", () => onReady?.());
    // fallback si load ne se déclenche pas (cache)
    setTimeout(()=> onReady?.(), 1200);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // lang change
  useEffect(() => {
    if (!mapRef.current || !tileRef.current) return;
    mapRef.current.removeLayer(tileRef.current);
    tileRef.current = L.tileLayer(tileForLang(lang), { maxZoom: 19 }).addTo(mapRef.current);
    if (mode === "satellite") {
      mapRef.current.removeLayer(tileRef.current);
      tileRef.current = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19 }).addTo(mapRef.current);
    }
  }, [lang]);

  // mode
  useEffect(() => {
    if (!mapRef.current || !tileRef.current) return;
    mapRef.current.removeLayer(tileRef.current);
    const url = mode === "carte" ? tileForLang(lang) : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    tileRef.current = L.tileLayer(url, { maxZoom: 19 }).addTo(mapRef.current);
  }, [mode]);

  // custom beautiful marker html with animation
  const guessIcon = () => L.divIcon({
    html: `<div style="position:relative;width:28px;height:28px;"><span style="position:absolute;inset:0;background:#ff1a1a;border:3px solid white;border-radius:50%;box-shadow:0 4px 16px rgba(0,0,0,0.3);animation:pinPop 0.35s ease;"></span><span style="position:absolute;left:50%;top:100%;width:2px;height:8px;background:#ff1a1a;transform:translateX(-50%);"></span></div><style>@keyframes pinPop{0%{transform:scale(0.5);opacity:0}100%{transform:scale(1);opacity:1}}</style>`,
    className: "", iconSize: [28, 28], iconAnchor: [14, 24]
  });
  const realIcon = () => L.divIcon({
    html: `<div style="position:relative;width:28px;height:28px;"><span style="position:absolute;inset:0;background:#22c55e;border:3px solid white;border-radius:50%;box-shadow:0 4px 16px rgba(0,0,0,0.3)"></span><span style="position:absolute;left:50%;top:50%;width:8px;height:8px;background:white;border-radius:50%;transform:translate(-50%,-50%)"></span></div>`,
    className: "", iconSize: [28, 28], iconAnchor: [14, 24]
  });

  useEffect(() => {
    if (!mapRef.current || !guess) return;
    if (!markersRef.current.guess) {
      markersRef.current.guess = L.marker([guess.lat, guess.lng], { icon: guessIcon() }).addTo(mapRef.current);
    } else {
      markersRef.current.guess.setLatLng([guess.lat, guess.lng]);
      markersRef.current.guess.setIcon(guessIcon());
    }
    // smooth fly
    mapRef.current.panTo([guess.lat, guess.lng], { animate: true, duration: 0.4 });
  }, [guess]);

  useEffect(() => {
    if (!mapRef.current) return;
    const m = markersRef.current;
    if (result) {
      if (!m.guess) m.guess = L.marker([result.guess.lat, result.guess.lng], { icon: guessIcon() }).addTo(mapRef.current);
      else { m.guess.setLatLng([result.guess.lat, result.guess.lng]); m.guess.setIcon(guessIcon()); }
      if (!m.real) m.real = L.marker([result.real.lat, result.real.lng], { icon: realIcon() }).addTo(mapRef.current);
      else { m.real.setLatLng([result.real.lat, result.real.lng]); m.real.setIcon(realIcon()); }
      if (m.line) mapRef.current.removeLayer(m.line);
      m.line = L.polyline([[result.guess.lat, result.guess.lng], [result.real.lat, result.real.lng]], { color: "#ff1a1a", weight: 3, dashArray: "8 6", opacity: 0.95 }).addTo(mapRef.current);
      const bounds = L.latLngBounds([result.guess.lat, result.guess.lng], [result.real.lat, result.real.lng]).pad(0.4);
      mapRef.current.fitBounds(bounds, { animate: true, duration: 0.6 });
    } else {
      if (m.real) { mapRef.current.removeLayer(m.real); m.real = undefined; }
      if (m.line) { mapRef.current.removeLayer(m.line); m.line = undefined; }
    }
  }, [result]);

  return (
    <div className="relative w-full h-full bg-[#e5e3df] overflow-hidden">
      <div ref={ref} className="absolute inset-0" />
      {/* macOS controls - icons only, no text, big rounded, ensure pointer events */}
      <div className="absolute top-3 left-3 z-20 flex gap-2">
        <button aria-label="Carte" onClick={()=>setMode("carte")} className={`w-11 h-11 rounded-full grid place-items-center text-lg border shadow-mac transition pointer-events-auto ${mode==="carte" ? "bg-[#ff1a1a] text-white border-[#ff1a1a]" : "bg-white text-black border-black/5 hover:scale-105"}`}>🗺️</button>
        <button aria-label="Satellite" onClick={()=>setMode("satellite")} className={`w-11 h-11 rounded-full grid place-items-center text-lg border shadow-mac transition pointer-events-auto ${mode==="satellite" ? "bg-[#ff1a1a] text-white border-[#ff1a1a]" : "bg-white text-black border-black/5 hover:scale-105"}`}>🛰️</button>
      </div>
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        <button aria-label="Zoom +" onClick={()=>mapRef.current?.zoomIn()} className="mac-btn pointer-events-auto">＋</button>
        <button aria-label="Zoom -" onClick={()=>mapRef.current?.zoomOut()} className="mac-btn pointer-events-auto">−</button>
        <button aria-label="Recentrer" onClick={()=>mapRef.current?.setView([20,0],2)} className="mac-btn pointer-events-auto text-base">◎</button>
      </div>
      {result && (
        <div className="absolute bottom-3 left-3 z-20 bg-white rounded-full shadow-mac border border-black/5 px-3 py-1.5 flex items-center gap-2 text-xs font-bold pointer-events-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff1a1a] border border-white" /> TON CHOIX <span className="opacity-20">—</span> <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] border border-white" /> BON ENDROIT
        </div>
      )}
    </div>
  );
}
