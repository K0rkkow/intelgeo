import { useEffect, useRef, useState } from "react";
import L from "leaflet";

type Props = {
  center?: [number, number];
  zoom?: number;
  markers?: { id: string; lat: number; lng: number; label?: string }[];
  onPick?: (p: { lat: number; lng: number }) => void;
  onMarkerSelect?: (id: string) => void;
  selectedId?: string | null;
  cursorPos?: { lat: number; lng: number } | null;
  interactive?: boolean;
};

export function IntelMap({ center = [48.86, 2.33], zoom = 5, markers = [], onPick, onMarkerSelect, selectedId, cursorPos, interactive = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(zoom);
  const [mouse, setMouse] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, {
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true,
      maxZoom: 18,
      minZoom: 2,
    }).setView(center, zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    map.on("zoomend", () => setZoomLevel(map.getZoom()));
    map.on("mousemove", (e: L.LeafletMouseEvent) => setMouse({ lat: e.latlng.lat, lng: e.latlng.lng }));
    if (onPick) map.on("click", (e: L.LeafletMouseEvent) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }));

    L.control.zoom({ position: "bottomright" }).addTo(map);
    markersLayer.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setMapReady(true);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // fly to center
  useEffect(() => { if (mapRef.current) mapRef.current.flyTo(center, zoom, { duration: 0.8 }); }, [center[0], center[1], zoom]);

  // markers
  useEffect(() => {
    if (!mapRef.current || !markersLayer.current) return;
    markersLayer.current.clearLayers();
    markers.forEach((m) => {
      const isSel = m.id === selectedId;
      const el = document.createElement("div");
      el.className = `w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg transition-all ${isSel ? "bg-white scale-125 shadow-white/20" : "bg-[#f2f1ed]"}`;
      if (isSel) el.style.boxShadow = "0 0 12px rgba(255,255,255,0.6)";
      const marker = L.marker([m.lat, m.lng], { icon: L.divIcon({ html: el, className: "", iconSize: [14, 14], iconAnchor: [7, 7] }) });
      if (onMarkerSelect) marker.on("click", (e: L.LeafletMouseEvent) => { L.DomEvent.stopPropagation(e); onMarkerSelect(m.id); });
      if (m.label) marker.bindTooltip(m.label, { direction: "top", offset: [0, -10] });
      markersLayer.current!.addLayer(marker);
    });
  }, [markers, selectedId]);

  return (
    <div className="relative w-full h-full bg-[#08080a] overflow-hidden">
      <div ref={ref} className="absolute inset-0" />
      {!mapReady && <div className="absolute inset-0 grid place-items-center bg-[#050507] text-[#9a9da3] text-sm font-mono">Initialisation carte…</div>}

      {/* HUD top */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none">
        <div className="flex gap-2">
          <div className="glass px-3 py-1.5 rounded-full flex items-center gap-2 pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px] tracking-widest text-[#f2f1ed]">LIVE</span>
            <span className="font-mono text-[10px] text-[#9a9da3]">MAP DATA ACTIVE</span>
          </div>
          <div className="hidden md:flex glass px-3 py-1.5 rounded-full font-mono text-[10px] tracking-widest text-[#9a9da3] pointer-events-auto">
            ZOOM {zoomLevel} • CARTO DARK • OSM
          </div>
        </div>
        <div className="glass px-3 py-1.5 rounded-full font-mono text-[10px] text-[#9a9da3] hidden sm:flex">
          {mouse ? `${mouse.lat.toFixed(4)}° / ${mouse.lng.toFixed(4)}°` : "— / —"}
        </div>
      </div>

      {/* HUD bottom */}
      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 pointer-events-none">
        <div className="glass px-3 py-2 rounded-xl pointer-events-auto">
          <div className="font-mono text-[10px] tracking-[0.18em] text-[#5c5f67]">CURSOR</div>
          <div className="font-mono text-xs text-[#f2f1ed]">{cursorPos ? `${cursorPos.lat.toFixed(5)}, ${cursorPos.lng.toFixed(5)}` : mouse ? `${mouse.lat.toFixed(5)}, ${mouse.lng.toFixed(5)}` : "—"}</div>
          <div className="font-mono text-[10px] text-[#5c5f67] mt-1">GRID: WGS84</div>
        </div>
        <div className="hidden md:flex gap-2 pointer-events-auto">
          <button onClick={() => mapRef.current?.setView(center, zoom)} className="glass px-3 py-2 rounded-full font-mono text-[10px] tracking-widest text-[#f2f1ed] hover:bg-white hover:text-black transition">RECENTRER</button>
        </div>
      </div>

      {/* crosshair center */}
      <div className="absolute inset-0 pointer-events-none grid place-items-center opacity-10">
        <div className="w-8 h-8 border border-white/20 relative">
          <span className="absolute left-1/2 top-0 w-px h-2 bg-white/30 -translate-x-1/2" />
          <span className="absolute left-1/2 bottom-0 w-px h-2 bg-white/30 -translate-x-1/2" />
          <span className="absolute top-1/2 left-0 h-px w-2 bg-white/30 -translate-y-1/2" />
          <span className="absolute top-1/2 right-0 h-px w-2 bg-white/30 -translate-y-1/2" />
        </div>
      </div>
    </div>
  );
}
