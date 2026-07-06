# Omega Ecosystem

A cosmic-themed Web3 platform built on Base44 — multi-chain wallet management, NFT gallery, algorithmic trading signals, a surreal lantern RPG, OM109 provenance signing, and multi-agent orchestration.

## Features

### Core Modules
- **Dashboard** — Cosmic hub with animated Oracle Eye, live ecosystem stats, and tile navigation
- **Wallet** — Multi-chain wallet management (Ethereum, Polygon, Solana, Bitcoin, Base) with OMG token tracking
- **Gallery** — NFT collection browser with minting, listing, and marketplace support
- **Explorer** — Tabbed ledger viewer for transactions, provenance records, and game states
- **Trading Bot** — Algorithmic signal engine with TradingView charts and Recharts analytics
- **Lantern RPG** — Surreal browser RPG with procedural canvas rendering, 5 worlds, boss arenas, lantern fuel mechanics
- **Provenance** — OM109 SHA-256 metadata signing & Certificate of Authenticity generation
- **Brain** — Multi-agent orchestration console (trading, provenance, oracle, RPG agents)
- **B2B** — Enterprise workflow entry points
- **GitHub Sync** — Two-way repository sync via GitHub REST API with full project push

### OM109 Provenance Protocol
1. Concatenate asset metadata (name | type | id | signer | timestamp)
2. SHA-256 hash the payload
3. Generate metadata signature: SHA-256("OM109:" + hash + ":" + signer)
4. Store both hashes + certificate JSON
5. Certificate = museum-grade Certificate of Authenticity / Art Passport

### Oracle System
- Oracle Score: 0-100 integrity metric
- Ratchet Floor: Score can never drop below historical best
- Visible in Lantern RPG as the Oracle's Eye entity
- Displayed on dashboard and navbar as a global metric

### Trading Integration
- TradingView Advanced Chart widget embedded via embed API
- Real-time price data for ETH, SOL, BTC, BNB, ADA, AVAX, DOT, LINK
- Configurable intervals (15m, 1H, 4H, 1D, 1W) with RSI overlay

## Tech Stack
- **React 18** + **Vite** + **Tailwind CSS** + **shadcn/ui**
- **Recharts** for data visualization
- **Framer Motion** for animations
- **Three.js** for 3D rendering
- **Base44 SDK** for backend (auth, database, integrations)
- **GitHub REST API** for two-way repo sync

## Database Entities
- `Wallet` — Multi-chain wallet management
- `NFT` — Collection items with marketplace support
- `Transaction` — Immutable ledger of all operations
- `GameState` — Lantern RPG player state, progression & Oracle score
- `ProvenanceRecord` — OM109 signing & COA records
- `TradingSignal` — Algorithmic trading signals
- `AgentMemory` — AI agent state, memory log & orchestration

## GitHub Two-Way Sync
- Uses GitHub REST API (api.github.com) directly from browser
- Token stored in localStorage (Personal Access Token with `repo` scope)
- **Pull**: Fetch latest commits, branches, and file tree
- **Push**: Create/update files via Contents API
- **Full Project Sync**: One-click push of all source files, configs, schemas, README, and .gitignore
- Rate limits: 60 req/hr unauthenticated, 5000 req/hr with token

## Getting Started
```bash
npm install
npm run dev
```

## Architecture
The app uses a cosmic dark theme with teal (#38d2bd), purple (#8b5cf6), and gold (#ffc832) accents. All pages share a glass-panel navigation bar with the animated Oracle Eye, and a consistent tile-card design system.

## License
Proprietary — Omega Ecosystem
