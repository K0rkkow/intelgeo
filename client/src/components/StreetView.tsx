import { useEffect, useRef, useState, useCallback } from "react";

function ImmersiveImage({ src, alt, onReady }: { src: string; alt?: string; onReady?: () => void }) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const handleLoad = () => { setLoaded(true); onReady?.(); };
  const clamp = (x: number, y: number, s: number) => {
    const el = containerRef.current;
    const img = imgRef.current;
    if (!el || !img) return { x, y };
    const cw = el.clientWidth, ch = el.clientHeight;
    const iw = img.naturalWidth || cw * 1.25, ih = img.naturalHeight || ch * 1.25;
    const dispW = (cw * 1.25) * s;
    const dispH = (ch * 1.25) * s;
    // si l'image est panoramique, on limite pour ne jamais voir de noir : max = (disp - container)/2
    const maxX = Math.max(0, (dispW - cw) / 2);
    const maxY = Math.max(0, (dispH - ch) / 2);
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
  };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const d = e.deltaY > 0 ? -0.08 : 0.08;
    const ns = Math.min(2.2, Math.max(1, scale + d));
    setScale(ns);
    setOffset(o => clamp(o.x, o.y, ns));
  };
  const onDown = (e: React.MouseEvent) => setDrag({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  const onMove = (e: React.MouseEvent) => { if (drag) { const n = clamp(e.clientX - drag.x, e.clientY - drag.y, scale); setOffset(n); } };
  const onUp = () => setDrag(null);
  return (
    <div ref={containerRef} className="absolute inset-0 bg-[#050507] overflow-hidden cursor-grab active:cursor-grabbing select-none" onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp} onWheel={onWheel}>
      <img ref={imgRef} src={src} alt={alt || "Vue immersive"} draggable={false} onLoad={handleLoad} className={`absolute left-1/2 top-1/2 w-[125%] h-[125%] max-w-none object-cover transition-opacity duration-500 ${loaded?"opacity-100":"opacity-0"}`} style={{ transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transition: drag ? "none" : "transform 0.2s ease" }} />
      {!loaded && <div className="absolute inset-0 grid place-items-center bg-[#050507]"><div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" /></div>}
    </div>
  );
}

const LIMITS: Record<number, number> = { 1: 12, 2: 8, 3: 5, 4: 3 };

// Vérification honnête : Panoramax d'abord, puis Mapillary. Apple MapKit JS et OSM ne fournissent pas de vue immersive Street View.
async function tryPanoramax(lat: number, lng: number): Promise<string | null> {
  const tries = [0.005, 0.01, 0.02];
  for (const d of tries) {
    const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
    const url = `https://api.panoramax.xyz/api/search?bbox=${bbox}&limit=1`;
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) continue;
      const data = await res.json();
      const feat = data.features?.[0];
      if (!feat) continue;
      // hd > sd > thumb
      const href = feat.assets?.hd?.href || feat.assets?.sd?.href || feat.assets?.thumb?.href;
      if (href) return href;
      // alternative: le lien self contient déjà l'image
      if (feat.assets) {
        const first = Object.values(feat.assets as Record<string, any>)[0] as any;
        if (first?.href) return first.href;
      }
    } catch { continue; }
  }
  return null;
}

async function tryMapillary(lat: number, lng: number, token: string): Promise<string | null> {
  const tries = [0.001, 0.002, 0.005];
  for (const d of tries) {
    const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
    const url = `https://graph.mapillary.com/images?access_token=${token}&fields=id&bbox=${bbox}&per_page=1`;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (data?.data?.[0]?.id) return data.data[0].id;
    } catch { continue; }
  }
  return null;
}

export function StreetView({ lat, lng, imageUrl, level = 2, onReady, onMove, onNeedNew }: { lat: number; lng: number; imageUrl?: string; level?: number; onReady?: () => void; onMove?: (count: number, max: number) => void; onNeedNew?: () => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [mode, setMode] = useState<"panoramax"|"mapillary"|"image">("image");
  const [loading, setLoading] = useState(true);
  const [moves, setMoves] = useState(0);
  const [panoramaxUrl, setPanoramaxUrl] = useState<string | null>(null);
  const maxMoves = LIMITS[level] ?? 8;
  const token = import.meta.env.VITE_MAPILLARY_TOKEN as string | undefined;

  const doMove = useCallback(async (dir: "forward"|"back"|"left"|"right") => {
    if (moves >= maxMoves && (dir==="forward"||dir==="back")) return;
    const viewer = viewerRef.current;
    if (!viewer) return;
    try {
      if (dir==="left" || dir==="right") {
        const pov = viewer.getPointOfView ? await viewer.getPointOfView() : { bearing: 0 };
        const bearing = pov?.bearing ?? 0;
        const delta = dir==="left" ? -30 : 30;
        if (viewer.setPointOfView) viewer.setPointOfView({ bearing: bearing + delta });
        return;
      }
      const pos = viewer.getPosition ? await viewer.getPosition() : { lat, lng };
      const pov = viewer.getPointOfView ? await viewer.getPointOfView() : { bearing: 0 };
      const bearing = pov?.bearing ?? 0;
      const rad = bearing * Math.PI / 180;
      const dist = dir==="forward" ? 0.0004 : -0.0004;
      const nLat = (pos?.lat ?? lat) + dist * Math.cos(rad);
      const nLng = (pos?.lng ?? lng) + dist * Math.sin(rad);
      const d = 0.0015; const bbox = `${nLng - d},${nLat - d},${nLng + d},${nLat + d}`;
      const res = await fetch(`https://graph.mapillary.com/images?access_token=${token}&fields=id&bbox=${bbox}&per_page=1`);
      if (!res.ok) throw new Error("no image");
      const data = await res.json();
      const nid = data?.data?.[0]?.id;
      if (!nid) return;
      setLoading(true);
      await (viewer.moveToKey ? viewer.moveToKey(nid) : viewer.moveTo(nid));
      setMoves(m => { const nm = m+1; onMove?.(nm, maxMoves); return nm; });
      setTimeout(()=> setLoading(false), 400);
    } catch { setLoading(false); }
  }, [lat, lng, token, moves, maxMoves, onMove]);

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;
    setLoading(true); setMoves(0); onMove?.(0, maxMoves); setPanoramaxUrl(null);
    if (viewerRef.current) { try { viewerRef.current.remove(); } catch {} viewerRef.current = null; }

    const run = async () => {
      // 1 - Panoramax (priorité)
      const panoUrl = await tryPanoramax(lat, lng);
      if (cancelled) return;
      if (panoUrl) {
        setMode("panoramax");
        setPanoramaxUrl(panoUrl);
        // onReady sera appelé par ImmersiveImage onLoad (chargement réel)
        return;
      }
      // 2 - Apple MapKit JS : honnêtement non viable comme Street View libre (nécessite Apple Developer JWT, couverture limitée, pas d'API street-level libre)
      // → on passe directement à Mapillary

      // 3 - OpenStreetMap : ne fournit pas de vue immersive → on ne l'utilise pas comme faux Street View

      // 4 - Mapillary
      if (token) {
        const mid = await tryMapillary(lat, lng, token);
        if (cancelled) return;
        if (mid && mapRef.current) {
          try {
            const { Viewer } = await import("mapillary-js");
            if (cancelled || !mapRef.current) return;
            setMode("mapillary");
            let loaded = false;
            let initialDone = false;
            const onLoad = () => { if (!cancelled && !loaded) { loaded = true; setLoading(false); onReady?.(); setTimeout(()=> { initialDone = true; }, 500); } };
            const onImage = () => {
              if (cancelled) return;
              if (!loaded) { onLoad(); return; }
              if (!initialDone) return;
              // navigation native → comptabilise comme déplacement
              setMoves(m => {
                if (m >= maxMoves) return m;
                const nm = m + 1;
                onMove?.(nm, maxMoves);
                return nm;
              });
            };
            viewerRef.current = new (Viewer as any)({
              accessToken: token,
              container: mapRef.current,
              imageId: mid,
              component: { cover: false, direction: true, sequence: true, zoom: true },
            });
            viewerRef.current.on("load", onLoad);
            viewerRef.current.on("image", onImage);
            setTimeout(() => {
              if (!cancelled && !loaded) {
                try { viewerRef.current?.remove(); } catch {}
                if (onNeedNew) onNeedNew(); else { setMode("image"); setPanoramaxUrl(imageUrl || null); setLoading(false); onReady?.(); }
              }
            }, 8000);
            return;
          } catch {}
        }
      }
      // si Panoramax et Mapillary échouent → nouvelle localisation (jamais de faux Street View)
      if (cancelled) return;
      if (onNeedNew) onNeedNew();
      else if (imageUrl) { setMode("image"); setPanoramaxUrl(imageUrl); setLoading(false); onReady?.(); }
    };
    run();
    return () => { cancelled = true; if (viewerRef.current) try { viewerRef.current.remove(); } catch {} };
  }, [lat, lng, token, imageUrl]);

  const showPanoramax = mode==="panoramax" && panoramaxUrl;
  const showImage = mode==="image" && panoramaxUrl;
  const atLimit = moves >= maxMoves;

  return (
    <div className="relative w-full h-full bg-[#050507] overflow-hidden">
      <div ref={mapRef} className={`absolute inset-0 ${showPanoramax || showImage ? "hidden" : "block"}`} />
      {showPanoramax && <ImmersiveImage src={panoramaxUrl!} alt="Panoramax immersive" onReady={() => { setLoading(false); onReady?.(); }} />}
      {showImage && <ImmersiveImage src={panoramaxUrl!} alt="Vue immersive" onReady={() => { setLoading(false); onReady?.(); }} />}
      {loading && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-[#050507]/85 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            <div className="font-mono text-xs tracking-widest text-white/60">CHARGEMENT DE LA VUE…</div>
          </div>
        </div>
      )}
      {null}
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded-full px-3 py-1 text-[10px] font-bold tracking-widest shadow border border-black/5 pointer-events-none">
        {mode==="panoramax" ? "PANORAMAX" : mode==="mapillary" ? "STREET VIEW" : "VUE IMMERSIVE"}
      </div>
      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur text-white rounded-full px-3 py-1 text-[10px] font-mono tracking-widest border border-white/10 pointer-events-none">
        Exploration {moves} / {maxMoves} {atLimit && "— Limite atteinte"}
      </div>
      {atLimit && <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[#ff1a1a] text-white rounded-full px-4 py-2 text-xs font-bold shadow">Limite d'exploration atteinte — regarde autour de toi</div>}
    </div>
  );
}
