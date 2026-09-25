# GeoOSINT — Geographic Intelligence Challenge

Jeu web type GeoGuessr orienté GEOINT/OSINT. **100% gratuit**, sans Google, scoring sécurisé côté serveur, timer fiable, design dark premium.

## Features

- Menu premium dark (GEOINT)
- Configuration : 1/3/5/10 manches, 30/60/120/180s, 8 régions
- Street View gratuit : **Mapillary** (Meta) + fallback **OSM**
- Carte d'estimation **Leaflet + OpenStreetMap/Carto Dark** (gratuit, pas de clé)
- Timer + validation serveur
- Scoring exponentiel + bonus temps, distance haversine
- Résultats par manche + total/avg/best

## Tech Stack

- Frontend: React 18, TypeScript strict, Vite, Tailwind, **Leaflet**, **mapillary-js**
- Backend: Node.js, Express, TypeScript, Zod, Vitest
- APIs: **OpenStreetMap / Carto** (tuiles, gratuit), **Mapillary** (street-level, gratuit)

## 100% Gratuit — Setup

### Carte : OpenStreetMap (aucune action)
Aucune clé, aucun compte. Fonctionne direct. Tiles Carto Dark par défaut.

### Street View : Mapillary (gratuit sans CB, 2 min)
1. Crée un compte sur https://www.mapillary.com
2. Va sur https://www.mapillary.com/dashboard/developers
3. `Generate Token` (Client token, pas besoin de carte bancaire)
4. Colle le token dans `.env` → `VITE_MAPILLARY_TOKEN=MLY|...`

**Sans token**, le jeu reste 100% jouable : StreetView affiche une carte satellite OSM centrée sur la cible avec cercle de précision (gameplay GEOINT pur — analyse terrain/route/végétation).

> Alternative street-level gratuite : KartaView (https://kartaview.org) même principe, mais Mapillary a meilleure couverture.

## Environment Variables

```env
# .env.example (copie vers .env ou client/.env + server/.env)
VITE_API_URL=http://localhost:3001
VITE_MAPILLARY_TOKEN=MLY|xxx         # optionnel, gratuit - voir ci-dessus
VITE_TILE_URL=https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png

PORT=3001
CORS_ORIGIN=http://localhost:5173
MAPILLARY_TOKEN=MLY|xxx              # optionnel, même valeur
```

Aucune clé Google nécessaire. Legacy `VITE_GOOGLE_MAPS_API_KEY` ignorée.

## Installation

```bash
npm install
```

## Development

```bash
npm run dev              # client 5173 + server 3001
```

Ouvre http://localhost:5173 — jouable immédiatement sans aucune clé.

## Production

```bash
npm run build
npm run start --workspace=server
```

Frontend `client/dist` → Vercel/Netlify. Backend → Fly.io/Render.

## Architecture

- `POST /api/game/start` { rounds, timeLimit, region } → { gameId, pano }
- `POST /api/game/:id/guess` { lat, lng, timeRemaining } → { distanceKm, score, realLocation }
- `GET /api/game/:id/result` → résumé

Sécurité : `LocationChallenge` en mémoire serveur, jamais exposée avant validation.

## Limitations (stack gratuit)

- OSM : fair-use, pas de facturation mais rate-limit si abus → auto-héberge tes tuiles si gros trafic
- Mapillary couverture inégale (rural/afrique/chine) → fallback OSM automatique
- Carto Dark tiles gratuits, attribution OSM obligatoire
- Pour améliorer : ajoute vérif serveur Mapillary `/images?closeto=` avec retry

## Licence

MIT
