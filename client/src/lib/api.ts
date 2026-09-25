const API = import.meta.env.VITE_API_URL || "";

export async function apiStartGame(cfg: { rounds: number; timeLimit: number; region: string; difficulty: string }) {
  const res = await fetch(`${API}/api/game/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cfg),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as { gameId: string; round: number; totalRounds: number; timeLimit: number; pano: { lat: number; lng: number } };
}

export async function apiGuess(gameId: string, payload: { lat: number; lng: number; timeRemaining: number }) {
  const res = await fetch(`${API}/api/game/${gameId}/guess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as import("../types/game").GuessResult;
}

export async function apiResult(gameId: string) {
  const res = await fetch(`${API}/api/game/${gameId}/result`);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}
