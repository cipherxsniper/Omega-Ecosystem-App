import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Send, Copy, Check, Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const CHAINS = ['ethereum', 'polygon', 'solana', 'bitcoin', 'base'];
const CHAIN_COLORS = { ethereum: '#627eea', polygon: '#8b5cf6', solana: '#14f195', bitcoin: '#f7931a', base: '#0052ff' };

export default function WalletPage() {
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [copied, setCopied] = useState(null);
  const [form, setForm] = useState({ address: '', chain: 'ethereum', label: '', balance_eth: 0, balance_usd: 0, omg_balance: 0 });
  const [transferForm, setTransferForm] = useState({ to_address: '', amount: 0, currency: 'ETH' });
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const [w, t] = await Promise.all([
      base44.entities.Wallet.list('-created_date'),
      base44.entities.Transaction.list('-created_date', 20),
    ]);
    setWallets(w);
    setTransactions(t);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addWallet = async () => {
    await base44.entities.Wallet.create(form);
    setShowAdd(false);
    setForm({ address: '', chain: 'ethereum', label: '', balance_eth: 0, balance_usd: 0, omg_balance: 0 });
    load();
    toast({ title: 'Wallet connected' });
  };

  const sendTransfer = async (fromWallet) => {
    const hash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    await base44.entities.Transaction.create({
      tx_hash: hash,
      type: 'transfer',
      from_address: fromWallet.address,
      to_address: transferForm.to_address,
      amount: Number(transferForm.amount),
      currency: transferForm.currency,
      chain: fromWallet.chain,
      status: 'confirmed',
    });
    setShowTransfer(false);
    setTransferForm({ to_address: '', amount: 0, currency: 'ETH' });
    load();
    toast({ title: 'Transfer recorded' });
  };

  const copyAddress = (addr) => {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(null), 2000);
  };

  const totalUsd = wallets.reduce((a, w) => a + (w.balance_usd || 0), 0);
  const totalOmg = wallets.reduce((a, w) => a + (w.omg_balance || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-widest flex items-center gap-2">
            <Wallet className="text-primary" size={20} /> OMEGA WALLET
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Multi-chain ledger & transfers</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus size={14} /> Add Wallet</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Connect Wallet</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Wallet Address (0x...)" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              <Input placeholder="Label (e.g. Main)" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} />
              <Select value={form.chain} onValueChange={v => setForm({ ...form, chain: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CHAINS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <div className="grid grid-cols-3 gap-2">
                <Input type="number" placeholder="ETH" value={form.balance_eth} onChange={e => setForm({ ...form, balance_eth: Number(e.target.value) })} />
                <Input type="number" placeholder="USD" value={form.balance_usd} onChange={e => setForm({ ...form, balance_usd: Number(e.target.value) })} />
                <Input type="number" placeholder="OMG" value={form.omg_balance} onChange={e => setForm({ ...form, omg_balance: Number(e.target.value) })} />
              </div>
              <Button onClick={addWallet} disabled={!form.address} className="w-full">Connect</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3">
        <div className="tile-card rounded-xl p-5 text-center">
          <div className="text-2xl font-heading font-bold text-primary">${totalUsd.toLocaleString()}</div>
          <div className="text-[10px] text-muted-foreground tracking-widest uppercase mt-1">Total USD</div>
        </div>
        <div className="tile-card rounded-xl p-5 text-center">
          <div className="text-2xl font-heading font-bold text-accent">{totalOmg.toLocaleString()}</div>
          <div className="text-[10px] text-muted-foreground tracking-widest uppercase mt-1">Total OMG</div>
        </div>
      </div>

      {/* Wallets */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : wallets.length === 0 ? (
        <div className="tile-card rounded-xl p-12 text-center text-muted-foreground text-sm">No wallets connected. Add one to get started.</div>
      ) : (
        <div className="space-y-3">
          {wallets.map(w => (
            <div key={w.id} className="tile-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: CHAIN_COLORS[w.chain] }} />
                  <span className="font-heading text-xs font-semibold tracking-wide">{w.label || w.chain}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">{w.chain}</span>
                </div>
                <Dialog open={showTransfer === w.id} onOpenChange={v => setShowTransfer(v ? w.id : false)}>
                  <DialogTrigger asChild><Button size="sm" variant="outline" className="gap-1 text-xs h-7"><Send size={12} /> Send</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Transfer from {w.label || w.address.slice(0, 10)}</DialogTitle></DialogHeader>
                    <div className="space-y-3 mt-2">
                      <Input placeholder="To Address" value={transferForm.to_address} onChange={e => setTransferForm({ ...transferForm, to_address: e.target.value })} />
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="number" placeholder="Amount" value={transferForm.amount} onChange={e => setTransferForm({ ...transferForm, amount: e.target.value })} />
                        <Input placeholder="Currency" value={transferForm.currency} onChange={e => setTransferForm({ ...transferForm, currency: e.target.value })} />
                      </div>
                      <Button onClick={() => sendTransfer(w)} className="w-full">Confirm Transfer</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <span className="truncate max-w-[200px]">{w.address}</span>
                <button onClick={() => copyAddress(w.address)}>{copied === w.address ? <Check size={12} className="text-primary" /> : <Copy size={12} />}</button>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div><div className="text-sm font-semibold">{w.balance_eth}</div><div className="text-[9px] text-muted-foreground">ETH</div></div>
                <div><div className="text-sm font-semibold">${w.balance_usd?.toLocaleString()}</div><div className="text-[9px] text-muted-foreground">USD</div></div>
                <div><div className="text-sm font-semibold text-accent">{w.omg_balance}</div><div className="text-[9px] text-muted-foreground">OMG</div></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction History */}
      <div>
        <h2 className="font-heading text-sm font-semibold tracking-widest mb-3">TRANSACTION HISTORY</h2>
        {transactions.length === 0 ? (
          <div className="tile-card rounded-xl p-8 text-center text-muted-foreground text-xs">No transactions yet</div>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => (
              <div key={tx.id} className="tile-card rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {tx.type === 'transfer' ? <ArrowUpRight size={14} className="text-destructive" /> : <ArrowDownLeft size={14} className="text-primary" />}
                  <div>
                    <div className="text-xs font-medium capitalize">{tx.type}</div>
                    <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px]">{tx.tx_hash}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold">{tx.amount} {tx.currency}</div>
                  <div className={`text-[10px] ${tx.status === 'confirmed' ? 'text-primary' : tx.status === 'pending' ? 'text-yellow-500' : 'text-destructive'}`}>{tx.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}