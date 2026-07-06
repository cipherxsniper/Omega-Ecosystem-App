import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Wallet, Image, Compass, BarChart3, Gamepad2, Shield, Brain, FileCode, Briefcase, Eye, Github, Sparkles } from 'lucide-react';
import TileCard from '@/components/omega/TileCard';
import OracleEye from '@/components/omega/OracleEye';

const TILES = [
  { title: 'Omega Wallet', desc: 'Multi-chain ledger & transfers', icon: <Wallet size={18} />, to: '/wallet', color: '#38d2bd' },
  { title: 'Omega Gallery', desc: '700+ NFT collection', icon: <Image size={18} />, to: '/gallery', color: '#8b5cf6' },
  { title: 'Omega Explorer', desc: 'Ledger & game state viewer', icon: <Compass size={18} />, to: '/explorer', color: '#3b82f6' },
  { title: 'Trading Bot', desc: 'Algorithmic signal engine', icon: <BarChart3 size={18} />, to: '/trading', color: '#f97316' },
  { title: 'Lantern RPG', desc: 'Surreal psychological adventure', icon: <Gamepad2 size={18} />, to: '/lantern', color: '#ffc832' },
  { title: 'Provenance', desc: 'OM109 signing & COA engine', icon: <Shield size={18} />, to: '/provenance', color: '#ec4899' },
  { title: 'Brain Console', desc: 'Multi-agent orchestration', icon: <Brain size={18} />, to: '/brain', color: '#06b6d4' },
  { title: 'B2B Portal', desc: 'Enterprise access workflows', icon: <Briefcase size={18} />, to: '/b2b', color: '#84cc16' },
  { title: 'Code Export', desc: 'Full source access', icon: <FileCode size={18} />, to: '/code-export', color: '#a78bfa' },
  { title: 'GitHub Sync', desc: 'Two-way repo sync & file browser', icon: <Github size={18} />, to: '/github', color: '#6e7681' },
  { title: 'Omega Deep', desc: 'Super-intelligence AI chat', icon: <Sparkles size={18} />, to: '/omega-deep', color: '#a855f7' },
];

export default function Dashboard() {
  const [stats, setStats] = useState({ wallets: 0, nfts: 0, txns: 0, oracle: 50, omg: 0 });

  useEffect(() => {
    Promise.all([
      base44.entities.Wallet.list().catch(() => []),
      base44.entities.NFT.list().catch(() => []),
      base44.entities.Transaction.list().catch(() => []),
      base44.entities.GameState.list('-created_date', 1).catch(() => []),
    ]).then(([wallets, nfts, txns, games]) => {
      const game = games[0] || {};
      setStats({
        wallets: wallets.length,
        nfts: nfts.length,
        txns: txns.length,
        oracle: game.oracle_score || 50,
        omg: game.omg_earned || 0,
      });
    });
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-8">
        <div className="flex justify-center mb-4">
          <OracleEye score={stats.oracle} size={100} />
        </div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-widest mt-6 bg-gradient-to-r from-primary via-purple-400 to-accent bg-clip-text text-transparent">
          OMEGA ECOSYSTEM
        </h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
          Unified Web3 · DeFi · NFT · RPG · AI Agent Platform
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Wallets', value: stats.wallets, color: '#38d2bd' },
          { label: 'NFTs', value: stats.nfts, color: '#8b5cf6' },
          { label: 'Transactions', value: stats.txns, color: '#3b82f6' },
          { label: 'Oracle Score', value: stats.oracle, color: '#ffc832' },
          { label: 'OMG Tokens', value: stats.omg, color: '#ec4899' },
        ].map(s => (
          <div key={s.label} className="tile-card rounded-xl p-4 text-center">
            <div className="text-2xl font-heading font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-muted-foreground tracking-widest uppercase mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Module Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TILES.map(tile => (
          <TileCard key={tile.title} title={tile.title} description={tile.desc} icon={tile.icon} to={tile.to} accentColor={tile.color} />
        ))}
      </div>
    </div>
  );
}