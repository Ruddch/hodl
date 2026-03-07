<p align="center">
  <img src="public/logo-3.png" alt="Hodleague" width="120" />
</p>

<h1 align="center">Hodleague</h1>

<p align="center">
  <em>A fantasy league where you collect token cards, build decks, and compete for rewards</em>
</p>

<br />

---

## 🎴 What is it?

**Hodleague** is a game where your intuition and market understanding decide everything. Collect cards, build your deck, and compete in weekly tournaments. Results are driven by real token dynamics — those who read the market best come out on top.

<br />

---

## How the project works

This repository is the **frontend** of Hodleague: a Next.js app that talks to a backend API and, for some actions, to blockchain contracts.

### Tech stack

- **Next.js 16** (App Router) with static export (`output: "export"`) for deployment to static hosting
- **React 19**, **TypeScript**
- **wagmi** + **viem** — wallet connection and blockchain calls (Abstract, Avalanche Fuji)
- **TanStack Query** — API data fetching and cache
- **Tailwind CSS** — styling

### Repository structure

| Path | Purpose |
|------|--------|
| `app/` | Next.js App Router pages and layouts (`(main)/` for main app routes) |
| `components/` | Reusable UI (layout, modals, deck, cards, tournament, etc.) |
| `lib/` | API client (`api.ts`), types, contracts config (`blockchain.ts`), hooks, auth, theme |
| `public/` | Static assets (images, logo) |

Backend API base URL is chosen via `NEXT_PUBLIC_ENV` (see below). Contract addresses (TournamentRegistry, pack opener) are in `lib/blockchain.ts` and depend on the chain (Abstract or Avalanche Fuji).

### Running locally

```bash
git clone <repo-url>
cd hodl
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app will use the **development** API (`uat.hodleague.com`) by default.

To run against the **Avalanche** backend and Fuji testnet:

```bash
npm run dev:avax
```

### Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_ENV` | `development` (UAT API), `avax` (Avalanche backend + Fuji), or unset (production API) |
| `NEXT_PUBLIC_BASE_PATH` | Optional base path for static export (e.g. GitHub Pages subpath) |
| `NEXT_PUBLIC_POSTHOG_TOKEN` | Optional; enables PostHog analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | Optional; PostHog host (default: `https://us.i.posthog.com`) |

### Main flows

1. **Auth** — User connects wallet; frontend requests nonce from API, user signs, frontend sends signature and gets JWT. Token is stored in `localStorage` and sent in `Authorization` header.
2. **Packs** — User opens packs; backend prepares mint data, user signs; on Avalanche Fuji the app can call the pack-opener contract (`lib/contracts/pack-opener.ts`). Card catalog and pack history come from the API.
3. **Deck** — User builds a deck (within weight limit). Frontend validates via API; user can register/unregister for a tournament. On supported chains, registration is written to **TournamentRegistry** (`lib/contracts/tournament-registry.ts`).
4. **Tournaments & leaderboard** — Tournament list, details, and leaderboard are loaded from the API. Results are based on real market data computed on the backend.

### Build and deploy

```bash
npm run build
```

This produces a static export in the `out/` directory, suitable for any static host. For GitHub Actions and custom domains (e.g. hodleague.com), see [DEPLOYMENT.md](DEPLOYMENT.md).

---

