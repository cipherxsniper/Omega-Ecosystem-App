import React from 'react';
import { Github, Settings, Menu, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AgentTopBar({ connectionStatus, onOpenSettings, onToggleSidebar, reposCount }) {
  const dotColor = connectionStatus === 'connected' ? 'bg-green-500'
    : connectionStatus === 'disconnected' ? 'bg-red-500'
    : 'bg-yellow-500 animate-pulse';
  const label = connectionStatus === 'connected' ? 'Connected'
    : connectionStatus === 'disconnected' ? 'Disconnected'
    : 'Checking…';

  return (
    <div className="flex items-center justify-between px-3 py-2 tile-card rounded-xl shrink-0">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={onToggleSidebar}>
          <Menu size={16} />
        </Button>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="text-[10px] text-muted-foreground hidden sm:inline">{label}</span>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <Terminal size={14} className="text-primary" />
          <span className="font-heading text-xs font-bold tracking-widest text-primary hidden sm:inline">OMEGA AGENT</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={onOpenSettings}>
          <Github size={14} />
          {reposCount > 0 && <span className="text-[10px] bg-muted px-1.5 rounded-full">{reposCount}</span>}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onOpenSettings}>
          <Settings size={14} />
        </Button>
      </div>
    </div>
  );
}