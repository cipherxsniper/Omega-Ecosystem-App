import React, { useState, useMemo } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import TradingViewWidget from '@/components/trading/TradingViewWidget';
import { TrendingUp, Target, Zap, Activity } from 'lucide-react';

const PAIRS = ['ETHUSDT', 'SOLUSDT', 'BTCUSDT', 'BNBUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'LINKUSDT'];

export default function PerformanceDashboard({ signals = [] }) {
  const [symbol, setSymbol] = useState('ETHUSDT');
  const [interval, setInterval] = useState('60');

  const stats = useMemo(() => {
    const total = signals.length;
    const executed = signals.filter(s => s.status === 'executed');
    const cancelled = signals.filter(s => s.status === 'cancelled');
    const expired = signals.filter(s => s.status === 'expired');
    const active = signals.filter(s => s.status === 'active');
    const successRate = total > 0 ? (executed.length / total * 100) : 0;
    const avgConfidence = total > 0 ? signals.reduce((a, s) => a + (s.confidence || 0), 0) / total : 0;
    return { total, executed: executed.length, cancelled: cancelled.length, expired: expired.length, active: active.length, successRate, avgConfidence };
  }, [signals]);

  const statusData = useMemo(() => [
    { name: 'Active', value: stats.active, color: '#38d2bd' },
    { name: 'Executed', value: stats.executed, color: '#22c55e' },
    { name: 'Cancelled', value: stats.cancelled, color: '#ef4444' },
    { name: 'Expired', value: stats.expired, color: '#eab308' },
  ].filter(d => d.value > 0), [stats]);

  const priceData = useMemo(() => {
    return signals
      .filter(s => s.price_at_signal > 0)
      .slice().reverse()
      .map((s, i) => ({
        name: `#${i + 1}`,
        pair: s.pair,
        entry: s.price_at_signal,
        target: s.target_price,
        stop: s.stop_loss,
        confidence: s.confidence,
      }));
  }, [signals]);

  const confidenceData = useMemo(() => {
    const buckets = { '0-25%': 0, '26-50%': 0, '51-75%': 0, '76-100%': 0 };
    signals.forEach(s => {
      const c = s.confidence || 0;
      if (c <= 25) buckets['0-25%']++;
      else if (c <= 50) buckets['26-50%']++;
      else if (c <= 75) buckets['51-75%']++;
      else buckets['76-100%']++;
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [signals]);

  const pairPerformance = useMemo(() => {
    const pairMap = {};
    signals.forEach(s => {
      if (!pairMap[s.pair]) pairMap[s.pair] = { pair: s.pair, total: 0, executed: 0 };
      pairMap[s.pair].total++;
      if (s.status === 'executed') pairMap[s.pair].executed++;
    });
    return Object.values(pairMap).map(p => ({
      name: p.pair.replace('/USDT', ''),
      total: p.total,
      successRate: p.total > 0 ? (p.executed / p.total * 100) : 0,
    }));
  }, [signals]);

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Activity} label="Total Signals" value={stats.total} color="#38d2bd" />
        <StatCard icon={Target} label="Success Rate" value={`${stats.successRate.toFixed(0)}%`} color="#22c55e" />
        <StatCard icon={TrendingUp} label="Avg Confidence" value={`${stats.avgConfidence.toFixed(0)}%`} color="#f97316" />
        <StatCard icon={Zap} label="Active" value={stats.active} color="#8b5cf6" />
      </div>

      {/* TradingView Live Chart */}
      <div className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-heading text-xs tracking-widest text-muted-foreground">LIVE PRICE CHART (TRADINGVIEW)</h3>
          <div className="flex gap-2">
            <select value={interval} onChange={e => setInterval(e.target.value)} className="bg-muted/50 text-xs rounded-lg px-2 py-1 border border-border">
              <option value="15">15m</option>
              <option value="60">1H</option>
              <option value="240">4H</option>
              <option value="D">1D</option>
              <option value="W">1W</option>
            </select>
            <select value={symbol} onChange={e => setSymbol(e.target.value)} className="bg-muted/50 text-xs rounded-lg px-2 py-1 border border-border">
              {PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <TradingViewWidget symbol={symbol} interval={interval} height={380} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Price Movement */}
        <div className="tile-card rounded-xl p-4">
          <h3 className="font-heading text-xs tracking-widest text-muted-foreground mb-3">PRICE MOVEMENT (ENTRY/TARGET/STOP)</h3>
          {priceData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-xs">No price data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 10 }} />
                <YAxis tick={{ fill: '#888', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0a0a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="entry" stroke="#38d2bd" strokeWidth={2} dot={{ r: 3 }} name="Entry" />
                <Line type="monotone" dataKey="target" stroke="#22c55e" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Target" />
                <Line type="monotone" dataKey="stop" stroke="#ef4444" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Stop" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Signal Status Donut */}
        <div className="tile-card rounded-xl p-4">
          <h3 className="font-heading text-xs tracking-widest text-muted-foreground mb-3">SIGNAL STATUS DISTRIBUTION</h3>
          {statusData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-xs">No signals yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0a0a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Confidence Distribution + Pair Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="tile-card rounded-xl p-4">
          <h3 className="font-heading text-xs tracking-widest text-muted-foreground mb-3">CONFIDENCE DISTRIBUTION</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={confidenceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 10 }} />
              <YAxis tick={{ fill: '#888', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#0a0a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="tile-card rounded-xl p-4">
          <h3 className="font-heading text-xs tracking-widest text-muted-foreground mb-3">PAIR PERFORMANCE</h3>
          {pairPerformance.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-muted-foreground text-xs">No pair data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={pairPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 10 }} />
                <YAxis tick={{ fill: '#888', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0a0a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="total" fill="#38d2bd" radius={[4, 4, 0, 0]} name="Total Signals" />
                <Bar dataKey="successRate" fill="#22c55e" radius={[4, 4, 0, 0]} name="Success %" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="tile-card rounded-xl p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} style={{ color }} />
        <span className="text-[9px] text-muted-foreground tracking-widest uppercase">{label}</span>
      </div>
      <div className="text-lg font-heading font-bold" style={{ color }}>{value}</div>
    </div>
  );
}