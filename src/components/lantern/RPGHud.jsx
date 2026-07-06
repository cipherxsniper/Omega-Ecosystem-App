import React from 'react';

export default function RPGHud({ gameState, world }) {
  const hpPct = (gameState.health / gameState.max_health) * 100;
  const fuelPct = gameState.lantern_fuel;

  return (
    <div className="tile-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="font-heading text-sm font-bold">{gameState.player_name}</span>
          <span className="text-xs text-muted-foreground ml-2">Lv.{gameState.level}</span>
        </div>
        <div className="text-right">
          <span className="text-xs font-heading" style={{ color: world.accent }}>{world.name}</span>
          <div className="text-[10px] text-muted-foreground">({gameState.current_x}, {gameState.current_y})</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* HP Bar */}
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-red-400">HP</span>
            <span>{gameState.health}/{gameState.max_health}</span>
          </div>
          <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all" style={{ width: `${hpPct}%` }} />
          </div>
        </div>
        {/* Fuel Bar */}
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-yellow-400">Lantern</span>
            <span>{fuelPct}%</span>
          </div>
          <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 transition-all lantern-glow" style={{ width: `${fuelPct}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
        <div><div className="font-semibold text-primary">{gameState.xp}</div><div className="text-muted-foreground">XP</div></div>
        <div><div className="font-semibold text-accent">{gameState.omg_earned}</div><div className="text-muted-foreground">OMG</div></div>
        <div><div className="font-semibold text-purple-400">{gameState.nfts_discovered}</div><div className="text-muted-foreground">NFTs</div></div>
        <div><div className="font-semibold text-red-400">{JSON.parse(gameState.bosses_defeated || '[]').length}</div><div className="text-muted-foreground">Bosses</div></div>
        <div><div className="font-semibold text-yellow-400">{gameState.oracle_score}</div><div className="text-muted-foreground">Oracle</div></div>
      </div>
    </div>
  );
}