import React, { useState } from 'react';
import { MessageSquare, FolderGit2, ChevronDown, ChevronRight, Clock, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export function SidebarContent({ tasks, currentTaskId, onSelectTask, repos, selectedRepo, onSelectRepo, reposError }) {
  const [reposExpanded, setReposExpanded] = useState(true);

  return (
    <div className="space-y-3">
      <div>
        <div className="font-heading text-[10px] tracking-widest text-muted-foreground mb-2 px-1">TASK HISTORY</div>
        {tasks.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/50 px-1">No tasks yet</p>
        ) : (
          <div className="space-y-0.5">
            {tasks.map(task => (
              <button
                key={task.id}
                onClick={() => onSelectTask(task.id)}
                className={`w-full text-left px-2 py-2 rounded-lg text-xs transition-colors ${
                  currentTaskId === task.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={12} className="shrink-0" />
                  <span className="truncate flex-1">{task.prompt}</span>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    task.status === 'done' ? 'bg-green-500' : task.status === 'error' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
                  }`} />
                </div>
                {task.createdAt && (
                  <div className="text-[9px] text-muted-foreground/50 ml-5 flex items-center gap-1 mt-0.5">
                    <Clock size={8} /> {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="tile-card rounded-lg p-2">
        <button onClick={() => setReposExpanded(!reposExpanded)} className="flex items-center justify-between w-full px-1 py-1">
          <span className="font-heading text-[10px] tracking-widest text-muted-foreground flex items-center gap-1.5">
            <FolderGit2 size={12} /> REPOS
          </span>
          {reposExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        {reposExpanded && (
          <div className="mt-1 space-y-0.5">
            {reposError && <p className="text-[9px] text-yellow-400 px-2 py-1">{reposError}</p>}
            {repos.length === 0 && !reposError && <p className="text-[9px] text-muted-foreground/50 px-2 py-1">No repos loaded</p>}
            {repos.map(repo => (
              <button
                key={repo.name}
                onClick={() => onSelectRepo(selectedRepo === repo.name ? null : repo.name)}
                className={`w-full text-left px-2 py-1.5 rounded text-[10px] transition-colors ${
                  selectedRepo === repo.name ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <div className="font-medium truncate">{repo.name}</div>
                <div className="flex items-center gap-2 text-[9px] text-muted-foreground/60 mt-0.5">
                  <span>{repo.file_count ?? '—'} files</span>
                  {repo.oracle_score != null && <span className="text-yellow-400">Oracle: {repo.oracle_score}</span>}
                </div>
              </button>
            ))}
            {selectedRepo && (
              <button onClick={() => onSelectRepo(null)} className="w-full text-center text-[9px] text-primary hover:underline mt-1">
                Clear filter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgentSidebar({ variant, open, onClose, collapsed, onToggleCollapse, ...contentProps }) {
  const content = <SidebarContent {...contentProps} />;

  if (variant === 'mobile') {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onClose}>
        <div className="absolute left-0 top-0 w-72 h-full glass-panel p-3 overflow-y-auto" onClick={e => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
          {content}
        </div>
      </div>
    );
  }

  if (collapsed) {
    return (
      <div className="w-9 shrink-0 hidden lg:flex flex-col items-center pt-2">
        <button onClick={onToggleCollapse} className="p-1.5 rounded-lg tile-card text-muted-foreground hover:text-primary transition-colors" title="Expand sidebar">
          <PanelLeftOpen size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-56 shrink-0 overflow-y-auto hidden lg:flex flex-col pr-1">
      <button onClick={onToggleCollapse} className="flex items-center gap-1.5 px-2 py-1.5 mb-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/30">
        <PanelLeftClose size={14} /> Collapse
      </button>
      {content}
    </div>
  );
}