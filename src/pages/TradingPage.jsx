import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BarChart3, Plus, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import PerformanceDashboard from '@/components/trading/PerformanceDashboard';

const SIGNAL_ICONS = { buy: TrendingUp, sell: TrendingDown, hold: Minus, alert: AlertTriangle };
const SIGNAL_COLORS = { buy: 'text-green-400', sell: 'text-red-400', hold: 'text-yellow-400', alert: 'text-orange-400' };

export default function TradingPage() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ pair: 'ETH/USDT', signal_type: 'buy', confidence: 50, price_at_signal: 0, target_price: 0, stop_loss: 0, notes: '', source: 'manual' });
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const s = await base44.entities.TradingSignal.list('-created_date', 50);
    setSignals(s);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createSignal = async () => {
    await base44.entities.TradingSignal.create(form);
    setShowCreate(false);
    setForm({ pair: 'ETH/USDT', signal_type: 'buy', confidence: 50, price_at_signal: 0, target_price: 0, stop_loss: 0, notes: '', source: 'manual' });
    load();
    toast({ title: 'Signal created' });
  };

  const active = signals.filter(s => s.status === 'active');
  const history = signals.filter(s => s.status !== 'active');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-widest flex items-center gap-2">
            <BarChart3 className="text-orange-400" size={20} /> TRADING BOT
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Algorithmic signal engine</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus size={14} /> Signal</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Signal</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Pair (e.g. ETH/USDT)" value={form.pair} onChange={e => setForm({ ...form, pair: e.target.value })} />
              <Select value={form.signal_type} onValueChange={v => setForm({ ...form, signal_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['buy', 'sell', 'hold', 'alert'].map(t => <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Confidence %" value={form.confidence} onChange={e => setForm({ ...form, confidence: Number(e.target.value) })} />
              <div className="grid grid-cols-3 gap-2">
                <Input type="number" placeholder="Entry Price" value={form.price_at_signal} onChange={e => setForm({ ...form, price_at_signal: Number(e.target.value) })} />
                <Input type="number" placeholder="Target" value={form.target_price} onChange={e => setForm({ ...form, target_price: Number(e.target.value) })} />
                <Input type="number" placeholder="Stop Loss" value={form.stop_loss} onChange={e => setForm({ ...form, stop_loss: Number(e.target.value) })} />
              </div>
              <Input placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              <Select value={form.source} onValueChange={v => setForm({ ...form, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['manual', 'python_agent', 'quantum_predictor', 'omega_brain'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={createSignal} className="w-full">Create Signal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Performance Dashboard */}
      <PerformanceDashboard signals={signals} />

      {/* Active Signals */}
      <div>
        <h2 className="font-heading text-xs tracking-widest text-muted-foreground mb-3">ACTIVE SIGNALS ({active.length})</h2>
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" /></div>
        ) : active.length === 0 ? (
          <div className="tile-card rounded-xl p-8 text-center text-muted-foreground text-xs">No active signals</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {active.map(s => <SignalCard key={s.id} signal={s} onUpdate={load} />)}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div>
          <h2 className="font-heading text-xs tracking-widest text-muted-foreground mb-3">SIGNAL HISTORY ({history.length})</h2>
          <div className="grid gap-2">
            {history.map(s => <SignalCard key={s.id} signal={s} onUpdate={load} compact />)}
          </div>
        </div>
      )}

      {/* API Hook Info */}
      <div className="tile-card rounded-xl p-4 text-xs text-muted-foreground">
        <div className="font-heading text-[10px] tracking-widest uppercase text-foreground mb-2">EXTERNAL API HOOKS</div>
        <p>Connect Python agents, shell scripts, or quantum predictors via the Base44 entity API. Signal source field tracks origin. Structure your external code to create TradingSignal entities with source = your agent name.</p>
      </div>
    </div>
  );
}

function SignalCard({ signal, onUpdate, compact }) {
  const Icon = SIGNAL_ICONS[signal.signal_type] || Minus;
  const colorClass = SIGNAL_COLORS[signal.signal_type] || 'text-muted-foreground';

  const execute = async (status) => {
    await base44.entities.TradingSignal.update(signal.id, { status });
    onUpdate();
  };

  return (
    <div className="tile-card rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={14} className={colorClass} />
          <span className="font-heading text-xs font-semibold">{signal.pair}</span>
          <span className={`text-[10px] uppercase font-bold ${colorClass}`}>{signal.signal_type}</span>
        </div>
        <div className="text-[10px] text-muted-foreground">{signal.confidence}%</div>
      </div>
      {!compact && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] mb-2">
            <div><div className="text-muted-foreground">Entry</div><div className="font-semibold">${signal.price_at_signal}</div></div>
            <div><div className="text-muted-foreground">Target</div><div className="font-semibold text-green-400">${signal.target_price}</div></div>
            <div><div className="text-muted-foreground">Stop</div><div className="font-semibold text-red-400">${signal.stop_loss}</div></div>
          </div>
          {signal.notes && <p className="text-[10px] text-muted-foreground mb-2">{signal.notes}</p>}
          {signal.status === 'active' && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-6 text-[10px] flex-1" onClick={() => execute('executed')}>Execute</Button>
              <Button size="sm" variant="outline" className="h-6 text-[10px] flex-1" onClick={() => execute('cancelled')}>Cancel</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}