import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, Plus, FileCheck, Lock, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

function sha256(message) {
  const encoder = new TextEncoder();
  return crypto.subtle.digest('SHA-256', encoder.encode(message)).then(buf => {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  });
}

export default function ProvenancePage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showCert, setShowCert] = useState(null);
  const [form, setForm] = useState({ asset_name: '', asset_type: 'nft', asset_id: '', signer_address: '', chain: 'ethereum' });
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const r = await base44.entities.ProvenanceRecord.list('-created_date', 50);
    setRecords(r);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createRecord = async () => {
    const dataToSign = `${form.asset_name}|${form.asset_type}|${form.asset_id}|${form.signer_address}|${Date.now()}`;
    const hash = await sha256(dataToSign);
    const metaSig = await sha256(`OM109:${hash}:${form.signer_address}`);
    const cert = JSON.stringify({
      protocol: 'OM109',
      asset: form.asset_name,
      type: form.asset_type,
      hash,
      signature: metaSig,
      signer: form.signer_address,
      chain: form.chain,
      timestamp: new Date().toISOString(),
      grade: 'museum',
    });

    await base44.entities.ProvenanceRecord.create({
      ...form,
      sha256_hash: hash,
      metadata_signature: metaSig,
      certificate_data: cert,
      status: 'signed',
    });

    await base44.entities.Transaction.create({
      type: 'sign',
      from_address: form.signer_address,
      amount: 0,
      currency: 'OM109',
      status: 'confirmed',
      metadata: `Provenance: ${form.asset_name}`,
    });

    setShowCreate(false);
    setForm({ asset_name: '', asset_type: 'nft', asset_id: '', signer_address: '', chain: 'ethereum' });
    load();
    toast({ title: 'Asset signed with OM109' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-widest flex items-center gap-2">
            <Shield className="text-pink-400" size={20} /> OM109 PROVENANCE
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Museum-grade signing & certificate engine</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus size={14} /> Sign Asset</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>OM109 Provenance Signing</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Asset Name" value={form.asset_name} onChange={e => setForm({ ...form, asset_name: e.target.value })} />
              <Select value={form.asset_type} onValueChange={v => setForm({ ...form, asset_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['nft', 'music', 'deed', 'game_item', 'document', 'artwork'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Asset ID (token ID, serial, etc.)" value={form.asset_id} onChange={e => setForm({ ...form, asset_id: e.target.value })} />
              <Input placeholder="Signer Address" value={form.signer_address} onChange={e => setForm({ ...form, signer_address: e.target.value })} />
              <Select value={form.chain} onValueChange={v => setForm({ ...form, chain: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['ethereum', 'polygon', 'solana', 'base'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Button onClick={createRecord} disabled={!form.asset_name || !form.signer_address} className="w-full gap-2"><Lock size={14} /> Sign & Generate COA</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Protocol Info */}
      <div className="tile-card rounded-xl p-4 border-l-2 border-pink-400/50">
        <div className="text-xs text-muted-foreground">
          <span className="font-heading text-foreground font-semibold">OM109 Protocol</span> — SHA-256 content hash + metadata signature layered for immutable provenance. Each signed asset receives a museum-grade Certificate of Authenticity (COA) / Art Passport.
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-pink-400/30 border-t-pink-400 rounded-full animate-spin" /></div>
      ) : records.length === 0 ? (
        <div className="tile-card rounded-xl p-12 text-center text-muted-foreground text-sm">No provenance records. Sign your first asset.</div>
      ) : (
        <div className="space-y-3">
          {records.map(r => (
            <div key={r.id} className="tile-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileCheck size={14} className="text-pink-400" />
                  <span className="font-heading text-xs font-semibold">{r.asset_name}</span>
                  <span className="text-[10px] uppercase text-muted-foreground">{r.asset_type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${r.status === 'signed' ? 'bg-primary/20 text-primary' : r.status === 'verified' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{r.status}</span>
                  <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => setShowCert(r)}><Eye size={12} /></Button>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono truncate">SHA256: {r.sha256_hash}</div>
              <div className="text-[10px] text-muted-foreground font-mono truncate">SIG: {r.metadata_signature}</div>
            </div>
          ))}
        </div>
      )}

      {/* Certificate Viewer */}
      <Dialog open={!!showCert} onOpenChange={v => !v && setShowCert(null)}>
        <DialogContent className="max-w-lg">
          {showCert && <CertificateView record={showCert} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CertificateView({ record }) {
  let cert = {};
  try { cert = JSON.parse(record.certificate_data || '{}'); } catch {}

  return (
    <div className="space-y-4">
      <div className="text-center border-b border-border pb-4">
        <Shield size={32} className="text-pink-400 mx-auto mb-2" />
        <h3 className="font-heading text-lg font-bold tracking-widest">CERTIFICATE OF AUTHENTICITY</h3>
        <p className="text-[10px] text-muted-foreground tracking-widest uppercase">OM109 Art Passport</p>
      </div>
      <div className="space-y-2 text-xs">
        {Object.entries(cert).map(([k, v]) => (
          <div key={k} className="flex justify-between items-start gap-4">
            <span className="text-muted-foreground capitalize min-w-[80px]">{k.replace(/_/g, ' ')}</span>
            <span className="font-mono text-right break-all">{String(v)}</span>
          </div>
        ))}
      </div>
      <div className="text-center pt-2 border-t border-border">
        <p className="text-[9px] text-muted-foreground tracking-widest">OMEGA ECOSYSTEM · IMMUTABLE PROVENANCE</p>
      </div>
    </div>
  );
}