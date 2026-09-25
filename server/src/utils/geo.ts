export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371.0088;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateScore(distanceKm: number, timeRemainingSec: number, timeLimitSec: number): number {
  // GeoGuessr-like exponential decay. 5000 max per round.
  // score = 5000 * exp(-distance / 1500)  => 0km=5000, ~500km~3580, 2000km~1300
  // time bonus up to 300 pts
  const base = 5000 * Math.exp(-distanceKm / 1800);
  const timeBonus = timeLimitSec > 0 ? Math.max(0, (timeRemainingSec / timeLimitSec) * 300) : 0;
  // minimal score 0
  const total = Math.round(base + timeBonus);
  // rounding + special case: if distance < 0.05 km => perfect 5000+bonus
  if (distanceKm < 0.05) return 5000 + Math.round(timeBonus);
  return Math.min(5300, Math.max(0, total));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 100) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString("en-US")} km`;
}
