import React from 'react';
import { Loader2, Terminal } from 'lucide-react';
import StepNode from './StepNode';

export default function StepTimeline({ parsed, loading, interactive, onConfirm, emptyMessage }) {
  if (loading && parsed.nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="animate-spin text-primary" size={20} />
          <span className="text-[10px] text-muted-foreground">Waiting for agent…</span>
        </div>
      </div>
    );
  }

  if (parsed.nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <Terminal size={24} className="text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground/50">{emptyMessage || 'Send a task to begin'}</p>
        </div>
      </div>
    );
  }

  const { nodes, doneNode } = parsed;

  return (
    <div className="flex-1 overflow-y-auto space-y-2 px-1 pb-2">
      {doneNode && <StepNode node={doneNode} interactive={interactive} onConfirm={onConfirm} />}
      {nodes.filter(n => n.type !== 'done').map(node => (
        <StepNode key={node.id} node={node} interactive={interactive} onConfirm={onConfirm} />
      ))}
    </div>
  );
}