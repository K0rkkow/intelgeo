// Subtle premium sounds via Web Audio - no aggressive noise
let ctx: AudioContext | null = null;
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
function tone(freq: number, dur: number, vol: number, type: OscillatorType = "sine", attack = 0.01) {
  try {
    const c = getCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = 0;
    o.connect(g); g.connect(c.destination);
    const t = c.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.start(t); o.stop(t + dur);
  } catch {}
}
export const sounds = {
  place: () => tone(800, 0.12, 0.12, "sine"),
  validate: () => { tone(600, 0.12, 0.14); setTimeout(()=>tone(900,0.12,0.1), 80); },
  result: () => { tone(500, 0.25, 0.12, "sine"); setTimeout(()=>tone(700,0.25,0.1), 120); },
  success: () => { [0,120,240].forEach((d,i)=> setTimeout(()=>tone(600+i*150,0.2,0.12,"sine"), d)); },
  fail: () => tone(200, 0.35, 0.08, "sine"),
  tick: () => tone(1200, 0.04, 0.04, "sine"),
  enabled: true,
  setEnabled(v: boolean) { sounds.enabled = v; localStorage.setItem("intelgeo_sound", v ? "1":"0"); },
  isEnabled() { return localStorage.getItem("intelgeo_sound") !== "0"; },
};
export function playPlace() { if (sounds.isEnabled()) sounds.place(); }
export function playValidate() { if (sounds.isEnabled()) sounds.validate(); }
export function playResult(score: number) { if (!sounds.isEnabled()) return; if (score > 4000) sounds.success(); else if (score < 1000) sounds.fail(); else sounds.result(); }
