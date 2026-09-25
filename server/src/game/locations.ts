import type { Region, LocationChallenge } from "./types.js";
import { getImageForLocation } from "./images.js";

// Curated high-quality Street View locations (verified to have coverage)
// Fallback random generation inside bounding boxes if list exhausted.
const CURATED: Record<Region, LocationChallenge[]> = {
  world: [
    { latitude: 48.85837, longitude: 2.29448, country: "FR", region: "europe", difficulty: "easy", tags: ["landmark"] }, // Paris
    { latitude: 40.7128, longitude: -74.006, country: "US", region: "north-america", difficulty: "easy", tags: ["urban"] },
    { latitude: 35.6586, longitude: 139.7454, country: "JP", region: "asia", difficulty: "medium", tags: ["urban"] },
    { latitude: -33.8568, longitude: 151.2153, country: "AU", region: "oceania", difficulty: "medium", tags: ["landmark"] },
    { latitude: 51.5007, longitude: -0.1246, country: "GB", region: "europe", difficulty: "easy", tags: ["urban"] },
    { latitude: -22.9519, longitude: -43.2105, country: "BR", region: "south-america", difficulty: "medium", tags: ["landmark"] },
    { latitude: 41.8902, longitude: 12.4922, country: "IT", region: "europe", difficulty: "easy", tags: ["landmark"] },
    { latitude: 30.0444, longitude: 31.2357, country: "EG", region: "africa", difficulty: "hard", tags: ["urban"] },
    { latitude: 55.7558, longitude: 37.6173, country: "RU", region: "europe", difficulty: "hard", tags: ["urban"] },
    { latitude: 19.4326, longitude: -99.1332, country: "MX", region: "north-america", difficulty: "medium", tags: ["urban"] },
    { latitude: 37.5665, longitude: 126.978, country: "KR", region: "asia", difficulty: "medium", tags: ["urban"] },
    { latitude: 48.2082, longitude: 16.3738, country: "AT", region: "europe", difficulty: "medium", tags: ["urban"] },
    { latitude: -23.5505, longitude: -46.6333, country: "BR", region: "south-america", difficulty: "hard", tags: ["urban"] },
    { latitude: 52.52, longitude: 13.405, country: "DE", region: "europe", difficulty: "medium", tags: ["urban"] },
    { latitude: 34.0522, longitude: -118.2437, country: "US", region: "north-america", difficulty: "easy", tags: ["urban"] },
    { latitude: -33.9249, longitude: 18.4241, country: "ZA", region: "africa", difficulty: "medium", tags: ["urban"] },
    { latitude: 43.6532, longitude: -79.3832, country: "CA", region: "north-america", difficulty: "medium", tags: ["urban"] },
    { latitude: 41.0082, longitude: 28.9784, country: "TR", region: "asia", difficulty: "medium", tags: ["urban"] },
    { latitude: 35.6895, longitude: 139.692, country: "JP", region: "asia", difficulty: "hard", tags: ["urban"] },
    { latitude: 48.8647, longitude: 2.321, country: "FR", region: "france", difficulty: "medium", tags: ["urban"] },
  ],
  europe: [
    { latitude: 48.85837, longitude: 2.29448, country: "FR", tags: ["landmark"] },
    { latitude: 51.5007, longitude: -0.1246, country: "GB", tags: ["urban"] },
    { latitude: 41.8902, longitude: 12.4922, country: "IT", tags: ["landmark"] },
    { latitude: 52.52, longitude: 13.405, country: "DE", tags: ["urban"] },
    { latitude: 40.4168, longitude: -3.7038, country: "ES", tags: ["urban"] },
  ],
  "north-america": [
    { latitude: 40.7128, longitude: -74.006, country: "US", tags: ["urban"] },
    { latitude: 34.0522, longitude: -118.2437, country: "US", tags: ["urban"] },
    { latitude: 43.6532, longitude: -79.3832, country: "CA", tags: ["urban"] },
    { latitude: 19.4326, longitude: -99.1332, country: "MX", tags: ["urban"] },
  ],
  "south-america": [
    { latitude: -22.9519, longitude: -43.2105, country: "BR", tags: ["landmark"] },
    { latitude: -23.5505, longitude: -46.6333, country: "BR", tags: ["urban"] },
    { latitude: -34.6037, longitude: -58.3816, country: "AR", tags: ["urban"] },
  ],
  asia: [
    { latitude: 35.6586, longitude: 139.7454, country: "JP", tags: ["urban"] },
    { latitude: 37.5665, longitude: 126.978, country: "KR", tags: ["urban"] },
    { latitude: 41.0082, longitude: 28.9784, country: "TR", tags: ["urban"] },
  ],
  africa: [
    { latitude: 30.0444, longitude: 31.2357, country: "EG", tags: ["urban"] },
    { latitude: -33.9249, longitude: 18.4241, country: "ZA", tags: ["urban"] },
    { latitude: -1.2921, longitude: 36.8219, country: "KE", tags: ["urban"] },
  ],
  oceania: [
    { latitude: -33.8568, longitude: 151.2153, country: "AU", tags: ["landmark"] },
    { latitude: -36.8485, longitude: 174.7633, country: "NZ", tags: ["urban"] },
  ],
  france: [
    { latitude: 48.85837, longitude: 2.29448, country: "FR", tags: ["landmark"] },
    { latitude: 45.764, longitude: 4.8357, country: "FR", tags: ["urban"] }, // Lyon
    { latitude: 43.2965, longitude: 5.3698, country: "FR", tags: ["urban"] }, // Marseille
    { latitude: 48.5734, longitude: 7.7521, country: "FR", tags: ["urban"] }, // Strasbourg
    { latitude: 43.6045, longitude: 1.444, country: "FR", tags: ["urban"] }, // Toulouse
    { latitude: 47.2184, longitude: -1.5536, country: "FR", tags: ["urban"] }, // Nantes
  ],
};

const REGION_BOUNDS: Record<Region, { lat: [number, number]; lng: [number, number] }> = {
  world: { lat: [-60, 70], lng: [-180, 180] },
  europe: { lat: [35, 71], lng: [-25, 45] },
  "north-america": { lat: [15, 71], lng: [-170, -50] },
  "south-america": { lat: [-55, 13], lng: [-82, -34] },
  asia: { lat: [5, 80], lng: [40, 180] },
  africa: { lat: [-35, 37], lng: [-20, 55] },
  oceania: { lat: [-50, -10], lng: [110, 180] },
  france: { lat: [41, 51.5], lng: [-5.5, 9.5] },
};

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomLocationInRegion(region: Region): LocationChallenge {
  const b = REGION_BOUNDS[region];
  return {
    latitude: randomInRange(b.lat[0], b.lat[1]),
    longitude: randomInRange(b.lng[0], b.lng[1]),
    region,
    difficulty: "medium",
    tags: ["random"],
  };
}

export function getLocationsForGame(region: Region, count: number): LocationChallenge[] {
  const pool = [...(CURATED[region] ?? CURATED.world)];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  const result: LocationChallenge[] = [];
  for (let i = 0; i < count; i++) {
    let loc: LocationChallenge;
    if (i < pool.length) loc = { ...pool[i]! };
    else loc = randomLocationInRegion(region);
    loc.imageUrl = getImageForLocation(loc.latitude, loc.longitude);
    result.push(loc);
  }
  return result;
}
