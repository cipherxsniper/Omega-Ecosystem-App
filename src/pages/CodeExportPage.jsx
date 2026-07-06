import React, { useState } from 'react';
import { FileCode, Copy, Check, ChevronDown, ChevronRight, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ENTITY_SCHEMAS = {
  'base44/entities/Wallet.jsonc': '{"name":"Wallet","type":"object","properties":{"address":{"type":"string","description":"Wallet address"},"chain":{"type":"string","enum":["ethereum","polygon","solana","bitcoin","base"],"default":"ethereum"},"label":{"type":"string"},"balance_eth":{"type":"number","default":0},"balance_usd":{"type":"number","default":0},"omg_balance":{"type":"number","default":0},"is_primary":{"type":"boolean","default":false}},"required":["address","chain"]}',
  'base44/entities/NFT.jsonc': '{"name":"NFT","type":"object","properties":{"name":{"type":"string"},"description":{"type":"string"},"image_url":{"type":"string"},"collection":{"type":"string"},"token_id":{"type":"string"},"chain":{"type":"string","enum":["ethereum","polygon","solana","base"],"default":"ethereum"},"contract_address":{"type":"string"},"owner_wallet":{"type":"string"},"mint_price":{"type":"number","default":0},"current_price":{"type":"number","default":0},"listed_for_sale":{"type":"boolean","default":false},"listing_price":{"type":"number","default":0},"rarity_rank":{"type":"number"},"attributes":{"type":"string","description":"JSON string of trait attributes"},"provenance_hash":{"type":"string"},"status":{"type":"string","enum":["minted","listed","sold","transferred","burned"],"default":"minted"}},"required":["name","collection"]}',
  'base44/entities/Transaction.jsonc': '{"name":"Transaction","type":"object","properties":{"tx_hash":{"type":"string"},"type":{"type":"string","enum":["transfer","mint","sale","listing","delist","reward","trade","sign"],"default":"transfer"},"from_address":{"type":"string"},"to_address":{"type":"string"},"amount":{"type":"number","default":0},"currency":{"type":"string","default":"ETH"},"nft_id":{"type":"string"},"chain":{"type":"string","enum":["ethereum","polygon","solana","base"],"default":"ethereum"},"status":{"type":"string","enum":["pending","confirmed","failed"],"default":"confirmed"},"metadata":{"type":"string"}},"required":["type"]}',
  'base44/entities/GameState.jsonc': '{"name":"GameState","type":"object","properties":{"player_name":{"type":"string"},"xp":{"type":"number","default":0},"level":{"type":"number","default":1},"health":{"type":"number","default":100},"max_health":{"type":"number","default":100},"lantern_fuel":{"type":"number","default":100},"lantern_radius":{"type":"number","default":5},"current_world":{"type":"string","default":"void_nexus"},"current_x":{"type":"number","default":0},"current_y":{"type":"number","default":0},"omg_earned":{"type":"number","default":0},"nfts_discovered":{"type":"number","default":0},"bosses_defeated":{"type":"string","default":"[]"},"portals_unlocked":{"type":"string","default":"[]"},"inventory":{"type":"string","default":"[]"},"oracle_score":{"type":"number","default":50},"oracle_floor":{"type":"number","default":50},"achievements":{"type":"string","default":"[]"}},"required":["player_name"]}',
  'base44/entities/ProvenanceRecord.jsonc': '{"name":"ProvenanceRecord","type":"object","properties":{"asset_type":{"type":"string","enum":["nft","music","deed","game_item","document","artwork"],"default":"nft"},"asset_id":{"type":"string"},"asset_name":{"type":"string"},"sha256_hash":{"type":"string"},"metadata_signature":{"type":"string"},"signer_address":{"type":"string"},"chain":{"type":"string","default":"ethereum"},"certificate_data":{"type":"string","description":"JSON string of COA data"},"status":{"type":"string","enum":["pending","signed","verified","revoked"],"default":"pending"},"parent_record_id":{"type":"string"},"transfer_history":{"type":"string","default":"[]"}},"required":["asset_name","asset_type"]}',
  'base44/entities/TradingSignal.jsonc': '{"name":"TradingSignal","type":"object","properties":{"pair":{"type":"string","default":"ETH/USDT"},"signal_type":{"type":"string","enum":["buy","sell","hold","alert"],"default":"hold"},"confidence":{"type":"number","default":50},"source":{"type":"string","default":"manual"},"price_at_signal":{"type":"number","default":0},"target_price":{"type":"number","default":0},"stop_loss":{"type":"number","default":0},"notes":{"type":"string"},"status":{"type":"string","enum":["active","executed","expired","cancelled"],"default":"active"}},"required":["pair","signal_type"]}',
  'base44/entities/AgentMemory.jsonc': '{"name":"AgentMemory","type":"object","properties":{"agent_name":{"type":"string"},"agent_type":{"type":"string","enum":["trading","provenance","oracle","rpg","general"],"default":"general"},"status":{"type":"string","enum":["idle","active","paused","error"],"default":"idle"},"last_action":{"type":"string"},"memory_log":{"type":"string","default":"[]"},"config":{"type":"string","default":"{}"},"performance_score":{"type":"number","default":0}},"required":["agent_name","agent_type"]}',
};

const ARCHITECTURE = `# Omega Ecosystem — Architecture

## Entities (Database)
- Wallet: Multi-chain wallet management (ETH, Polygon, Solana, Bitcoin, Base)
- NFT: Collection items with marketplace support (mint, list, sell, transfer)
- Transaction: Immutable ledger of all operations
- GameState: Lantern RPG player state, progression & Oracle score
- ProvenanceRecord: OM109 signing & Certificate of Authenticity records
- TradingSignal: Algorithmic trading signals with entry/target/stop
- AgentMemory: AI agent state, memory log & orchestration

## Pages
- Dashboard: Cosmic hub with Oracle Eye, stats & tile navigation
- WalletPage: Multi-chain wallet management & transfers
- GalleryPage: NFT collection browser with minting & listing
- ExplorerPage: Tabbed ledger/provenance/game state viewer
- TradingPage: Signal engine + TradingView performance dashboard
- LanternRPG: Surreal RPG with canvas rendering, 5 worlds, boss arenas
- ProvenancePage: OM109 SHA-256 signing & COA generation
- BrainPage: Multi-agent orchestration console
- B2BPage: Enterprise workflow entry points
- GitHubPage: Two-way repo sync via GitHub REST API
- CodeExportPage: Full source code browser (this page)

## OM109 Provenance Protocol
1. Concatenate asset metadata (name|type|id|signer|timestamp)
2. SHA-256 hash the payload
3. Generate metadata signature: SHA-256("OM109:" + hash + ":" + signer)
4. Store both hashes + certificate JSON
5. Certificate = museum-grade COA / Art Passport

## Oracle System
- Oracle Score: 0-100 integrity metric
- Ratchet Floor: Score can never drop below historical best
- Visible in Lantern RPG as Oracle's Eye entity
- Visible on dashboard & navbar as global metric

## TradingView Integration
- Advanced Chart widget embedded via TradingView's embed API
- Real-time price data for ETH, SOL, BTC, BNB, ADA, AVAX, DOT, LINK
- Configurable intervals (15m, 1H, 4H, 1D, 1W)
- RSI indicator overlay

## GitHub Two-Way Sync
- Uses GitHub REST API (api.github.com) directly from browser
- Token stored in localStorage (Personal Access Token with repo scope)
- Pull: Fetch latest commits, branches, file tree
- Push: Create/update files via Contents API (PUT /repos/{owner}/{repo}/contents/{path})
- Sync status: Compares local last-known commit SHA with remote
- Rate limits: 60 req/hr unauthenticated, 5000 req/hr with token

## External Integration Pattern
Structure external repos (omega_v10.py, etc.) to:
1. Authenticate via Base44 API
2. Read/write entities directly (base44.entities.EntityName.create/update/delete)
3. Keep Base44 UI as presentation layer
4. Heavy computation stays in external environments

## Tech Stack
- React 18 + Vite + Tailwind CSS + shadcn/ui
- Recharts for data visualization
- Framer Motion for animations
- Base44 SDK for backend (auth, database, integrations)
`;

const FILE_TREE = `src/
├── App.jsx                          # Router & app shell
├── main.jsx                         # React entry point
├── index.css                        # Tailwind + cosmic theme tokens
├── pages/
│   ├── Dashboard.jsx                # Cosmic hub with Oracle Eye & tiles
│   ├── WalletPage.jsx               # Multi-chain wallet management
│   ├── GalleryPage.jsx              # NFT collection browser & minting
│   ├── ExplorerPage.jsx             # Ledger/provenance/game state viewer
│   ├── TradingPage.jsx              # Signal engine + TradingView
│   ├── LanternRPG.jsx              # Surreal RPG with canvas rendering
│   ├── ProvenancePage.jsx           # OM109 SHA-256 signing & COA
│   ├── BrainPage.jsx                # Multi-agent orchestration console
│   ├── B2BPage.jsx                  # Enterprise workflow entry points
│   ├── GitHubPage.jsx               # Two-way repo sync (GitHub API)
│   └── CodeExportPage.jsx           # This page — schemas & architecture
├── components/
│   ├── omega/
│   │   ├── AppLayout.jsx            # Layout wrapper with Oracle state
│   │   ├── NavBar.jsx               # Navigation with Oracle Eye
│   │   ├── CosmicBackground.jsx     # Animated star/eye background
│   │   ├── TileCard.jsx             # Reusable navigation tile
│   │   └── OracleEye.jsx            # Animated score-dependent eye
│   ├── lantern/
│   │   ├── LanternCanvas.jsx        # Procedural canvas game renderer
│   │   └── RPGHud.jsx                # Player stats HUD
│   └── trading/
│       ├── TradingViewWidget.jsx    # TradingView chart embed
│       └── PerformanceDashboard.jsx # Recharts analytics suite
└── api/
    └── base44Client.js               # Pre-initialized Base44 SDK
`;

export default function CodeExportPage() {
  const [copied, setCopied] = useState(null);
  const [expanded, setExpanded] = useState({ 'Database Schemas': true, 'Architecture': true, 'File Tree': true });

  const copy = (content, key) => {
    navigator.clipboard.writeText(content);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggle = (section) => setExpanded(prev => ({ ...prev, [section]: !prev[section] }));

  const SECTIONS = {
    'Database Schemas': ENTITY_SCHEMAS,
    'File Tree': { 'src/ structure': FILE_TREE },
    'Architecture': { 'ARCHITECTURE.md': ARCHITECTURE },
  };

  const totalFiles = Object.values(SECTIONS).reduce((a, cat) => a + Object.keys(cat).length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-bold tracking-widest flex items-center gap-2">
          <FileCode className="text-purple-400" size={20} /> CODE EXPORT
        </h1>
        <p className="text-xs text-muted-foreground mt-1">{totalFiles} files · Entity schemas, architecture & file tree</p>
      </div>

      {/* GitHub Sync Link */}
      <Link to="/github" className="tile-card rounded-xl p-4 block border-l-2 border-purple-400/50 hover:border-primary transition-colors">
        <div className="flex items-center gap-2 mb-1">
          <Github size={14} className="text-foreground" />
          <h3 className="font-heading text-xs font-semibold tracking-wide">GITHUB TWO-WAY SYNC — FULL SOURCE</h3>
        </div>
        <p className="text-xs text-muted-foreground">Browse the full source code of every file in the GitHub tab. Connect a repo, browse the file tree, pull commits, and push changes directly from the app using the GitHub REST API.</p>
      </Link>

      {Object.entries(SECTIONS).map(([section, sectionFiles]) => {
        if (Object.keys(sectionFiles).length === 0) return null;
        return (
          <div key={section}>
            <button onClick={() => toggle(section)} className="flex items-center gap-2 mb-3 w-full text-left">
              {expanded[section] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span className="font-heading text-xs tracking-widest uppercase text-muted-foreground">{section}</span>
              <span className="text-[10px] text-muted-foreground">({Object.keys(sectionFiles).length} files)</span>
            </button>
            {expanded[section] && (
              <div className="space-y-3">
                {Object.entries(sectionFiles).map(([filename, content]) => (
                  <div key={filename} className="tile-card rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
                      <span className="font-mono text-[11px] text-muted-foreground">{filename}</span>
                      <div className="flex gap-2 items-center">
                        <span className="text-[9px] text-muted-foreground">{String(content).split('\n').length} lines</span>
                        <Button size="sm" variant="ghost" className="h-6 gap-1 text-[10px]" onClick={() => copy(content, filename)}>
                          {copied === filename ? <><Check size={10} className="text-green-400" /> Copied</> : <><Copy size={10} /> Copy</>}
                        </Button>
                      </div>
                    </div>
                    <pre className="p-4 text-[10px] font-mono text-muted-foreground overflow-x-auto max-h-96 whitespace-pre-wrap break-all">{content}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}