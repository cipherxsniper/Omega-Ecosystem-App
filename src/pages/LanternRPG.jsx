import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Gamepad2 } from 'lucide-react';
import OracleEye from '@/components/omega/OracleEye';
import ZeldaCanvas from '@/components/lantern/ZeldaCanvas';
import ZeldaHud from '@/components/lantern/ZeldaHud';

const WORLDS = {
  void_nexus: { name: 'The Void Nexus', color: '#0a0a2e', accent: '#38d2bd', desc: 'A shifting geometric void where all timelines converge.' },
  mirror_depths: { name: 'Mirror Depths', color: '#1a0a2e', accent: '#8b5cf6', desc: 'A crystalline underworld reflecting fractured memories.' },
  ember_wastes: { name: 'Ember Wastes', color: '#2e1a0a', accent: '#f97316', desc: 'Burning ruins of a timeline that collapsed into fire.' },
  chronos_spire: { name: 'Chronos Spire', color: '#0a1e2e', accent: '#3b82f6', desc: 'A temporal tower where past and future exist simultaneously.' },
  oracle_sanctum: { name: "Oracle's Sanctum", color: '#1e1a0a', accent: '#ffc832', desc: 'The inner sanctum of the Oracle. Only the worthy enter.' },
};

const PORTAL_DESTINATIONS = {
  void_nexus: 'mirror_depths',
  mirror_depths: 'ember_wastes',
  ember_wastes: 'chronos_spire',
  chronos_spire: 'oracle_sanctum',
  oracle_sanctum: 'void_nexus',
};

export default function LanternRPG() {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [combatLog, setCombatLog] = useState([]);

  const load = async () => {
    const states = await base44.entities.GameState.list('-updated_date', 1);
    if (states.length > 0) {
      setGameState(states[0]);
    } else {
      setShowCreate(true);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createGame = async () => {
    const gs = await base44.entities.GameState.create({ player_name: playerName || 'Wanderer', current_world: 'void_nexus' });
    setGameState(gs);
    setShowCreate(false);
    addLog('You awaken in the Void Nexus. Your lantern flickers to life.');
  };

  const addLog = (msg) => setCombatLog(prev => [...prev.slice(-19), { text: msg, time: Date.now() }]);

  const saveState = async (updates) => {
    if (!gameState) return;
    const merged = { ...gameState, ...updates };
    if (merged.oracle_score > merged.oracle_floor) merged.oracle_floor = merged.oracle_score;
    if (merged.oracle_score < merged.oracle_floor) merged.oracle_score = merged.oracle_floor;
    await base44.entities.GameState.update(gameState.id, updates);
    setGameState(merged);
  };

  // === Zelda interaction callbacks ===
  const handleItemFound = useCallback(async (type) => {
    if (!gameState) return;
    if (type === 'nft') {
      const xpGain = 25 + Math.floor(Math.random() * 50);
      await saveState({ xp: gameState.xp + xpGain, nfts_discovered: gameState.nfts_discovered + 1 });
      addLog(`✦ Found a hidden artifact! +${xpGain} XP. NFTs: ${gameState.nfts_discovered + 1}`);
    } else if (type === 'coin') {
      const reward = 5 + Math.floor(Math.random() * 20);
      await saveState({ omg_earned: gameState.omg_earned + reward, xp: gameState.xp + 5 });
      addLog(`⬡ Found ${reward} OMG tokens! +5 XP`);
    } else if (type === 'heart') {
      const heal = 20;
      const newHp = Math.min(gameState.max_health, gameState.health + heal);
      await saveState({ health: newHp });
      addLog(`♥ Recovered ${heal} HP from a heart crystal.`);
    }
    checkLevelUp();
  }, [gameState]);

  const handleEnemyEncounter = useCallback(async (enemy) => {
    if (!gameState) return;
    const dmg = 5 + Math.floor(Math.random() * 15);
    const newHp = Math.max(0, gameState.health - dmg);
    const xpGain = 10 + Math.floor(Math.random() * 20);
    enemy.alive = false;
    await saveState({ health: newHp, xp: gameState.xp + xpGain });
    addLog(`⚔ Floating Eye strikes! -${dmg} HP, +${xpGain} XP. It dissolves into shadow.`);
    if (newHp <= 0) addLog('💀 Your lantern dims... Find a shrine to rest.');
    checkLevelUp();
  }, [gameState]);

  const handlePortalEnter = useCallback(async () => {
    if (!gameState) return;
    const dest = PORTAL_DESTINATIONS[gameState.current_world] || 'void_nexus';
    let unlocked = [];
    try { unlocked = JSON.parse(gameState.portals_unlocked || '[]'); } catch {}
    if (!unlocked.includes(dest)) unlocked.push(dest);
    await saveState({ current_world: dest, current_x: 0, current_y: 0, portals_unlocked: JSON.stringify(unlocked) });
    addLog(`🌀 Portal shift — entered ${WORLDS[dest].name}.`);
  }, [gameState]);

  const handleShrineRest = useCallback(async () => {
    if (!gameState) return;
    await saveState({ health: gameState.max_health, lantern_fuel: 100 });
    addLog('🕯 You rest at a shrine. HP & lantern fuel restored.');
  }, [gameState]);

  const handleBossFight = useCallback(async () => {
    if (!gameState) return;
    let defeated = [];
    try { defeated = JSON.parse(gameState.bosses_defeated || '[]'); } catch {}
    const world = gameState.current_world;
    if (defeated.includes(world)) { addLog('This arena is empty. The boss has already fallen.'); return; }

    const bossDmg = 20 + Math.floor(Math.random() * 30);
    const playerDmg = 15 + Math.floor(Math.random() * 25) + gameState.level * 3;
    const bossHp = 80 + gameState.level * 10;

    if (playerDmg >= bossHp * 0.6) {
      defeated.push(world);
      const xpGain = 100 + gameState.level * 25;
      const omgReward = 50 + gameState.level * 10;
      await saveState({
        health: Math.max(1, gameState.health - bossDmg),
        xp: gameState.xp + xpGain,
        omg_earned: gameState.omg_earned + omgReward,
        bosses_defeated: JSON.stringify(defeated),
        oracle_score: Math.min(100, gameState.oracle_score + 10),
      });
      addLog(`⚔ BOSS DEFEATED in ${WORLDS[world].name}! +${xpGain} XP, +${omgReward} OMG. Oracle Score rises!`);
    } else {
      await saveState({ health: Math.max(0, gameState.health - bossDmg) });
      addLog(`⚔ The boss strikes! You take ${bossDmg} damage. Level up and try again.`);
    }
    checkLevelUp();
  }, [gameState]);

  const checkLevelUp = async () => {
    if (!gameState) return;
    const newXp = gameState.xp + 3;
    const newLevel = Math.floor(newXp / 100) + 1;
    if (newLevel > gameState.level) {
      await saveState({ level: newLevel, max_health: 100 + (newLevel - 1) * 20, oracle_score: Math.min(100, gameState.oracle_score + 5) });
      addLog(`⬆ LEVEL UP! You are now level ${newLevel}. Oracle Score increased.`);
    }
  };

  const enterPortal = async (worldKey) => {
    const world = WORLDS[worldKey];
    if (!world) return;
    let unlocked = [];
    try { unlocked = JSON.parse(gameState.portals_unlocked || '[]'); } catch {}
    if (!unlocked.includes(worldKey)) unlocked.push(worldKey);
    await saveState({ current_world: worldKey, current_x: 0, current_y: 0, portals_unlocked: JSON.stringify(unlocked) });
    addLog(`Portal shift — entered ${world.name}.`);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" /></div>;

  const world = WORLDS[gameState?.current_world || 'void_nexus'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-bold tracking-widest flex items-center gap-2">
          <Gamepad2 className="text-yellow-400" size={20} /> LANTERN RPG
        </h1>
        {gameState && <OracleEye score={gameState.oracle_score} size={50} />}
      </div>

      {!gameState ? (
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader><DialogTitle>Begin Your Journey</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <p className="text-sm text-muted-foreground">Enter the shifting worlds with nothing but a lantern. Discover artifacts, face watchers, and find truth in the dark. Move with WASD or the on-screen controls.</p>
              <Input placeholder="Your Name" value={playerName} onChange={e => setPlayerName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createGame()} />
              <Button onClick={createGame} className="w-full">Ignite Your Lantern</Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <>
          <ZeldaHud gameState={gameState} world={world} />
          <ZeldaCanvas
            gameState={gameState}
            world={world}
            worldKey={gameState.current_world}
            onItemFound={handleItemFound}
            onEnemyEncounter={handleEnemyEncounter}
            onPortalEnter={handlePortalEnter}
            onShrineRest={handleShrineRest}
            onBossFight={handleBossFight}
          />

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-2">
            <Button onClick={handleShrineRest} disabled={gameState.health >= gameState.max_health && gameState.lantern_fuel >= 100} className="text-xs h-10" style={{ background: `${world.accent}15`, color: world.accent, borderColor: `${world.accent}30` }} variant="outline">
              🕯 Rest
            </Button>
            <Button onClick={handleBossFight} disabled={gameState.health <= 0} className="text-xs h-10 border-red-500/30 text-red-400 hover:bg-red-500/10" variant="outline">
              ⚔ Boss Arena
            </Button>
            <div className="relative">
              <select
                className="w-full h-10 text-xs bg-muted/30 border border-border rounded-lg px-3 text-foreground appearance-none cursor-pointer"
                value=""
                onChange={e => e.target.value && enterPortal(e.target.value)}
              >
                <option value="">🌀 Portal...</option>
                {Object.entries(WORLDS).filter(([k]) => k !== gameState.current_world).map(([k, w]) => (
                  <option key={k} value={k}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Combat Log */}
          <div className="tile-card rounded-xl p-3 max-h-48 overflow-y-auto">
            <div className="font-heading text-[10px] tracking-widest text-muted-foreground mb-2">CHRONICLE</div>
            {combatLog.length === 0 ? (
              <p className="text-xs text-muted-foreground">Your story begins... Move around and explore the darkness.</p>
            ) : (
              <div className="space-y-1">
                {combatLog.map((log, i) => (
                  <div key={log.time + i} className="text-xs text-muted-foreground">{log.text}</div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}