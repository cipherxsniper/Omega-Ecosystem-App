import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Plus, Search, Image, Tag, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function GalleryPage() {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showMint, setShowMint] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', collection: '', image_url: '', token_id: '', chain: 'ethereum', mint_price: 0 });
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const items = await base44.entities.NFT.list('-created_date', 100);
    setNfts(items);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const mint = async () => {
    const tokenId = form.token_id || `OMG-${Date.now()}`;
    await base44.entities.NFT.create({ ...form, token_id: tokenId, status: 'minted' });
    setShowMint(false);
    setForm({ name: '', description: '', collection: '', image_url: '', token_id: '', chain: 'ethereum', mint_price: 0 });
    load();
    toast({ title: 'NFT minted' });
  };

  const listForSale = async (nft, price) => {
    await base44.entities.NFT.update(nft.id, { listed_for_sale: true, listing_price: price, status: 'listed' });
    await base44.entities.Transaction.create({ type: 'listing', nft_id: nft.id, amount: price, currency: 'ETH', status: 'confirmed' });
    setSelected(null);
    load();
    toast({ title: 'NFT listed for sale' });
  };

  const filtered = nfts.filter(n => !search || n.name?.toLowerCase().includes(search.toLowerCase()) || n.collection?.toLowerCase().includes(search.toLowerCase()));
  const collections = [...new Set(nfts.map(n => n.collection).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-widest flex items-center gap-2">
            <Image className="text-purple-400" size={20} /> OMEGA GALLERY
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{nfts.length} items across {collections.length} collections</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9 h-8 text-xs w-40" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Dialog open={showMint} onOpenChange={setShowMint}>
            <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus size={14} /> Mint</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Mint NFT</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <Input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="Collection" value={form.collection} onChange={e => setForm({ ...form, collection: e.target.value })} />
                <Input placeholder="Image URL" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
                <Input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Select value={form.chain} onValueChange={v => setForm({ ...form, chain: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{['ethereum', 'polygon', 'solana', 'base'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" placeholder="Mint Price (ETH)" value={form.mint_price} onChange={e => setForm({ ...form, mint_price: Number(e.target.value) })} />
                </div>
                <Button onClick={mint} disabled={!form.name || !form.collection} className="w-full">Mint NFT</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="tile-card rounded-xl p-12 text-center text-muted-foreground text-sm">No NFTs found. Mint your first one!</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(nft => (
            <button key={nft.id} onClick={() => setSelected(nft)} className="tile-card rounded-xl overflow-hidden text-left group">
              <div className="aspect-square bg-muted/50 relative overflow-hidden">
                {nft.image_url ? (
                  <img src={nft.image_url} alt={nft.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image size={32} className="text-muted-foreground/30" />
                  </div>
                )}
                {nft.listed_for_sale && (
                  <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-[9px] px-2 py-0.5 rounded-full font-bold">{nft.listing_price} ETH</div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <div className="text-[10px] font-heading font-semibold truncate">{nft.name}</div>
                  <div className="text-[9px] text-muted-foreground">{nft.collection}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selected} onOpenChange={v => !v && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && <NFTDetail nft={selected} onList={listForSale} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NFTDetail({ nft, onList }) {
  const [listPrice, setListPrice] = useState('');
  let attrs = [];
  try { attrs = JSON.parse(nft.attributes || '[]'); } catch {}

  return (
    <div className="space-y-4">
      <div className="aspect-square bg-muted/30 rounded-lg overflow-hidden max-h-64 mx-auto">
        {nft.image_url ? <img src={nft.image_url} alt={nft.name} className="w-full h-full object-contain" /> : <div className="w-full h-full flex items-center justify-center"><Image size={48} className="text-muted-foreground/30" /></div>}
      </div>
      <div>
        <h3 className="font-heading text-lg font-bold">{nft.name}</h3>
        <p className="text-xs text-muted-foreground">{nft.collection} · {nft.chain} · #{nft.token_id}</p>
        {nft.description && <p className="text-sm text-muted-foreground mt-2">{nft.description}</p>}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="tile-card rounded-lg p-2"><div className="font-semibold">{nft.mint_price} ETH</div><div className="text-[9px] text-muted-foreground">Mint</div></div>
        <div className="tile-card rounded-lg p-2"><div className="font-semibold capitalize">{nft.status}</div><div className="text-[9px] text-muted-foreground">Status</div></div>
        <div className="tile-card rounded-lg p-2"><div className="font-semibold">{nft.rarity_rank || '—'}</div><div className="text-[9px] text-muted-foreground">Rarity</div></div>
      </div>
      {attrs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {attrs.map((a, i) => (
            <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
              <Tag size={10} />{a.trait_type}: {a.value}
            </span>
          ))}
        </div>
      )}
      {!nft.listed_for_sale && (
        <div className="flex gap-2 items-center">
          <Input type="number" placeholder="List price (ETH)" value={listPrice} onChange={e => setListPrice(e.target.value)} className="text-xs h-8" />
          <Button size="sm" onClick={() => onList(nft, Number(listPrice))} disabled={!listPrice}>List for Sale</Button>
        </div>
      )}
    </div>
  );
}