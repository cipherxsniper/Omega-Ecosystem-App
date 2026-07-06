import React from 'react';
import { Heart, Flame, Star, Coins, Trophy, Eye } from 'lucide-react';

export default function ZeldaHud({ gameState, world }) {
  const hpPct = (gameState.health / gameState.max_health) * 100;
  const fuelPct = gameState.lantern_fuel;
  const hearts = Math.ceil(gameState.health / 20);
  const maxHearts = Math.ceil(gameState.max_health / 20);

  return (
    <div className="tile-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${world.accent}25`, border: `1px solid ${world.accent}40` }}>
            <span className="text-xs font-heading font-bold" style={{ color: world.accent }}>{gameState.level}</span>
          </div>
          <div>
            <div className="font-heading text-sm font-bold">{gameState.player_name}</div>
            <div className="text-[9px] text-muted-foreground tracking-wider" style={{ color: world.accent }}>{world.name.toUpperCase()}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground">POS</div>
          <div className="text-[10px] font-mono text-muted-foreground/70">({gameState.current_x}, {gameState.current_y})</div>
        </div>
      </div>

      {/* Hearts */}
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        {Array.from({ length: maxHearts }).map((_, i) => (
          <Heart
            key={i}
            size={14}
            className={i < hearts ? 'text-red-500 fill-red-500' : 'text-muted/30'}
            fill={i < hearts ? 'currentColor' : 'none'}
          />
        ))}
        <span className="text-[10px] text-muted-foreground ml-1">{gameState.health}/{gameState.max_health}</span>
      </div>

      {/* Lantern fuel */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-yellow-400 flex items-center gap-1"><Flame size={10} /> Lantern</span>
          <span className="text-muted-foreground">{fuelPct}%</span>
        </div>
        <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-600 to-yellow-300 transition-all lantern-glow"
            style={{ width: `${fuelPct}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-1.5 text-center">
        <div className="bg-muted/20 rounded-lg py-1.5">
          <Star size={12} className="text-primary mx-auto" />
          <div className="text-xs font-heading font-bold text-primary mt-0.5">{gameState.xp}</div>
          <div className="text-[8px] text-muted-foreground">XP</div>
        </div>
        <div className="bg-muted/20 rounded-lg py-1.5">
          <Coins size={12} className="text-accent mx-auto" />
          <div className="text-xs font-heading font-bold text-accent mt-0.5">{gameState.omg_earned}</div>
          <div className="text-[8px] text-muted-foreground">OMG</div>
        </div>
        <div className="bg-muted/20 rounded-lg py-1.5">
          <Trophy size={12} className="text-purple-400 mx-auto" />
          <div className="text-xs font-heading font-bold text-purple-400 mt-0.5">{gameState.nfts_discovered}</div>
          <div className="text-[8px] text-muted-foreground">NFTs</div>
        </div>
        <div className="bg-muted/20 rounded-lg py-1.5">
          <Trophy size={12} className="text-red-400 mx-auto" />
          <div className="text-xs font-heading font-bold text-red-400 mt-0.5">{JSON.parse(gameState.bosses_defeated || '[]').length}</div>
          <div className="text-[8px] text-muted-foreground">BOSSES</div>
        </div>
        <div className="bg-muted/20 rounded-lg py-1.5">
          <Eye size={12} className="text-yellow-400 mx-auto" />
          <div className="text-xs font-heading font-bold text-yellow-400 mt-0.5">{gameState.oracle_score}</div>
          <div className="text-[8px] text-muted-foreground">ORACLE</div>
        </div>
      </div>
    </div>
  );
}