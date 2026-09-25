export type Region = "world" | "europe" | "north-america" | "south-america" | "asia" | "africa" | "oceania" | "france";
export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface GameConfig {
  rounds: number;
  timeLimit: number;
  region: Region;
  difficulty: Difficulty;
}

export interface PublicRound {
  gameId: string;
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
  nextRound: PublicRound | null;
  nextGameId?: string;
  gameFinished: boolean;
}

export interface RoundSummary {
  round: number;
  distanceKm: number | null;
  score: number | null;
}
