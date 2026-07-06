import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Brain, Plus, Play, Pause, RotateCcw, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const AGENT_COLORS = { trading: '#f97316', provenance: '#ec4899', oracle: '#ffc832', rpg: '#8b5cf6', general: '#38d2bd' };

export default function BrainPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ agent_name: '', agent_type: 'general', config: '{}' });
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const a = await base44.entities.AgentMemory.list('-updated_date', 50);
    setAgents(a);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createAgent = async () => {
    await base44.entities.AgentMemory.create(form);
    setShowCreate(false);
    setForm({ agent_name: '', agent_type: 'general', config: '{}' });
    load();
    toast({ title: 'Agent spawned' });
  };

  const toggleAgent = async (agent) => {
    const newStatus = agent.status === 'active' ? 'paused' : 'active';
    await base44.entities.AgentMemory.update(agent.id, { status: newStatus, last_action: `Status changed to ${newStatus} at ${new Date().toISOString()}` });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-widest flex items-center gap-2">
            <Brain className="text-cyan-400" size={20} /> OMEGA BRAIN
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Multi-agent orchestration console</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus size={14} /> Spawn Agent</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Spawn Agent</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Agent Name" value={form.agent_name} onChange={e => setForm({ ...form, agent_name: e.target.value })} />
              <Select value={form.agent_type} onValueChange={v => setForm({ ...form, agent_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['trading', 'provenance', 'oracle', 'rpg', 'general'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Config JSON" value={form.config} onChange={e => setForm({ ...form, config: e.target.value })} />
              <Button onClick={createAgent} disabled={!form.agent_name} className="w-full gap-2"><Zap size={14} /> Spawn</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info */}
      <div className="tile-card rounded-xl p-4 border-l-2 border-cyan-400/50 text-xs text-muted-foreground">
        <span className="font-heading text-foreground font-semibold">Integration Hub</span> — Agents are entry points for external Python scripts, quantum predictors, and custom logic. Each agent tracks its memory log and performance. Wire external code via entity API calls.
        <div className="mt-2 text-primary/70 font-mono text-[10px]">Note: LLM interaction requires integration credits (resets Aug 1, 2026)</div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" /></div>
      ) : agents.length === 0 ? (
        <div className="tile-card rounded-xl p-12 text-center text-muted-foreground text-sm">No agents spawned. Create one to begin.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {agents.map(agent => {
            const color = AGENT_COLORS[agent.agent_type] || '#38d2bd';
            let memory = [];
            try { memory = JSON.parse(agent.memory_log || '[]'); } catch {}

            return (
              <div key={agent.id} className="tile-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: agent.status === 'active' ? color : '#555' }} />
                    <span className="font-heading text-xs font-semibold">{agent.agent_name}</span>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: `${color}20`, color }}>{agent.agent_type}</span>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toggleAgent(agent)}>
                    {agent.status === 'active' ? <Pause size={12} /> : <Play size={12} />}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-[10px] mb-2">
                  <div className="bg-muted/30 rounded p-1.5"><div className="font-semibold">{agent.status}</div><div className="text-muted-foreground">Status</div></div>
                  <div className="bg-muted/30 rounded p-1.5"><div className="font-semibold">{agent.performance_score}</div><div className="text-muted-foreground">Score</div></div>
                </div>
                {agent.last_action && <div className="text-[10px] text-muted-foreground truncate">Last: {agent.last_action}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}