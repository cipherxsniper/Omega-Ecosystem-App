import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Compass, ArrowRightLeft, Shield, Gamepad2 } from 'lucide-react';

export default function ExplorerPage() {
  const [transactions, setTransactions] = useState([]);
  const [provRecords, setProvRecords] = useState([]);
  const [gameStates, setGameStates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Transaction.list('-created_date', 50),
      base44.entities.ProvenanceRecord.list('-created_date', 50),
      base44.entities.GameState.list('-updated_date', 20),
    ]).then(([t, p, g]) => {
      setTransactions(t);
      setProvRecords(p);
      setGameStates(g);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-bold tracking-widest flex items-center gap-2">
        <Compass className="text-blue-400" size={20} /> OMEGA EXPLORER
      </h1>

      <Tabs defaultValue="ledger">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="ledger" className="text-xs gap-1"><ArrowRightLeft size={12} /> Ledger</TabsTrigger>
          <TabsTrigger value="provenance" className="text-xs gap-1"><Shield size={12} /> Provenance</TabsTrigger>
          <TabsTrigger value="game" className="text-xs gap-1"><Gamepad2 size={12} /> Game State</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger" className="space-y-2 mt-4">
          {transactions.length === 0 ? <EmptyState text="No transactions recorded" /> : transactions.map(tx => (
            <div key={tx.id} className="tile-card rounded-xl p-3 grid grid-cols-4 gap-2 items-center text-xs">
              <div><span className="font-heading text-[10px] uppercase tracking-wider text-muted-foreground">Type</span><div className="font-semibold capitalize mt-0.5">{tx.type}</div></div>
              <div><span className="font-heading text-[10px] uppercase tracking-wider text-muted-foreground">Amount</span><div className="font-semibold mt-0.5">{tx.amount} {tx.currency}</div></div>
              <div><span className="font-heading text-[10px] uppercase tracking-wider text-muted-foreground">Hash</span><div className="font-mono text-muted-foreground truncate mt-0.5">{tx.tx_hash?.slice(0, 14)}...</div></div>
              <div className="text-right"><span className={`text-[10px] font-semibold ${tx.status === 'confirmed' ? 'text-primary' : 'text-yellow-500'}`}>{tx.status}</span></div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="provenance" className="space-y-2 mt-4">
          {provRecords.length === 0 ? <EmptyState text="No provenance records" /> : provRecords.map(pr => (
            <div key={pr.id} className="tile-card rounded-xl p-3 grid grid-cols-3 gap-2 items-center text-xs">
              <div><span className="font-heading text-[10px] uppercase tracking-wider text-muted-foreground">Asset</span><div className="font-semibold mt-0.5">{pr.asset_name}</div></div>
              <div><span className="font-heading text-[10px] uppercase tracking-wider text-muted-foreground">Type</span><div className="capitalize mt-0.5">{pr.asset_type}</div></div>
              <div className="text-right"><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${pr.status === 'signed' ? 'bg-primary/20 text-primary' : pr.status === 'verified' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{pr.status}</span></div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="game" className="space-y-2 mt-4">
          {gameStates.length === 0 ? <EmptyState text="No game states" /> : gameStates.map(gs => (
            <div key={gs.id} className="tile-card rounded-xl p-4 text-xs">
              <div className="flex justify-between items-center mb-2">
                <span className="font-heading font-semibold">{gs.player_name}</span>
                <span className="text-muted-foreground">Level {gs.level}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div><div className="font-semibold text-primary">{gs.xp}</div><div className="text-[9px] text-muted-foreground">XP</div></div>
                <div><div className="font-semibold text-red-400">{gs.health}/{gs.max_health}</div><div className="text-[9px] text-muted-foreground">HP</div></div>
                <div><div className="font-semibold text-yellow-400">{gs.lantern_fuel}%</div><div className="text-[9px] text-muted-foreground">Fuel</div></div>
                <div><div className="font-semibold text-accent">{gs.omg_earned}</div><div className="text-[9px] text-muted-foreground">OMG</div></div>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="tile-card rounded-xl p-8 text-center text-muted-foreground text-xs">{text}</div>;
}