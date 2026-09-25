export type Region =
  | "world"
  | "europe"
  | "north-america"
  | "south-america"
  | "asia"
  | "africa"
  | "oceania"
  | "france";

export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface LocationChallenge {
  latitude: number;
  longitude: number;
  country?: string;
  region?: string;
  difficulty?: Difficulty;
  tags?: string[];
  imageUrl?: string;
}

export interface Round {
  id: string;
  index: number;
  location: LocationChallenge; // kept server-side only
  guess?: { lat: number; lng: number; timeRemaining: number };
  distanceKm?: number;
  score?: number;
  startedAt: number;
  completed: boolean;
}

export interface Game {
  id: string;
  rounds: number;
  timeLimit: number;
  region: Region;
  difficulty: Difficulty;
  roundsData: Round[];
  currentRound: number; // 0-indexed
  createdAt: number;
  status: "playing" | "finished";
  // anti-cheat: store creation IP maybe
}

export interface PublicRound {
  round: number;
  totalRounds: number;
  timeLimit: number;
  pano: { lat: number; lng: number };
  imageUrl?: string;
}

export interface GuessResult {
  distanceKm: number;
  score: number;
  timeBonus: number;
  realLocation: { lat: number; lng: number };
  guessLocation: { lat: number; lng: number };
  round: number;
  totalRounds: number;
  nextRound?: PublicRound | null;
  gameFinished: boolean;
}
