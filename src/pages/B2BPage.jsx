import React from 'react';
import { Briefcase, Users, FileText, BarChart3, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WORKFLOWS = [
  { title: 'Enterprise Onboarding', desc: 'Guided setup for B2B partners with wallet and gallery access', icon: Users, color: '#84cc16' },
  { title: 'Bulk NFT Licensing', desc: 'License collections for commercial use with provenance tracking', icon: FileText, color: '#38d2bd' },
  { title: 'Analytics Dashboard', desc: 'Portfolio performance, trading volume, and agent metrics', icon: BarChart3, color: '#8b5cf6' },
  { title: 'API Access Portal', desc: 'Manage API keys and webhook configurations for integrations', icon: ArrowRight, color: '#f97316' },
];

export default function B2BPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-bold tracking-widest flex items-center gap-2">
          <Briefcase className="text-lime-400" size={20} /> B2B PORTAL
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Enterprise access workflows</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {WORKFLOWS.map(w => (
          <div key={w.title} className="tile-card rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${w.color}15`, color: w.color }}>
                <w.icon size={18} />
              </div>
              <div>
                <h3 className="font-heading text-xs font-semibold tracking-wide">{w.title}</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{w.desc}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="w-full text-xs gap-1.5">
              Launch Workflow <ArrowRight size={12} />
            </Button>
          </div>
        ))}
      </div>

      <div className="tile-card rounded-xl p-4 text-xs text-muted-foreground border-l-2 border-lime-400/50">
        <span className="font-heading text-foreground font-semibold">Enterprise Ready</span> — These workflows are placeholder entry points. Wire custom backend logic via external Python agents or Base44 backend functions to activate full enterprise flows.
      </div>
    </div>
  );
}