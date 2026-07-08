import React, { useState } from 'react';
import { ChevronRight, ChevronDown, AlertCircle, ShieldAlert, CheckCircle, FileCode, AlertTriangle, Terminal, FilePen } from 'lucide-react';
import CodeBlock from './CodeBlock';

const TYPE_CONFIG = {
  step: { color: '#38d2bd', bg: 'rgba(56,210,189,0.05)', border: 'rgba(56,210,189,0.15)', icon: ChevronRight, label: 'STEP' },
  self_proposed: { color: '#ffc832', bg: 'rgba(255,200,50,0.08)', border: 'rgba(255,200,50,0.25)', icon: AlertCircle, label: 'SELF-PROPOSED' },
  oracle_blocked: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', icon: ShieldAlert, label: 'BLOCKED' },
  done: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', icon: CheckCircle, label: 'DONE' },
};

function DiffPreview({ changes }) {
  return (
    <div className="mt-2 rounded-lg border border-border bg-background/40 overflow-hidden">
      <div className="px-3 py-1.5 bg-muted/30 text-[10px] font-mono text-muted-foreground flex items-center gap-1.5">
        <FileCode size={10} /> File Changes
      </div>
      {changes.map((change, i) => (
        <div key={i} className="px-3 py-1.5 flex items-center gap-2 text-[10px] font-mono border-t border-border/50">
          <span className={change.type === 'write_file' ? 'text-green-400' : 'text-blue-400'}>
            {change.type === 'write_file' ? '✎ WRITE' : '↻ APPLY'}
          </span>
          <FilePen size={9} className="text-muted-foreground/50" />
          <span className="text-muted-foreground truncate">{change.path}</span>
        </div>
      ))}
    </div>
  );
}

export default function StepNode({ node, interactive, onConfirm }) {
  const [expanded, setExpanded] = useState(false);
  const config = TYPE_CONFIG[node.type] || TYPE_CONFIG.step;
  const isStep = node.type === 'step';
  const isDone = node.type === 'done';
  const isSelfProposed = node.type === 'self_proposed';
  const isBlocked = node.type === 'oracle_blocked';
  const showContent = expanded || isDone || isSelfProposed || isBlocked;

  return (
    <div className="rounded-lg border overflow-hidden" style={{ background: config.bg, borderColor: config.border }}>
      <button
        onClick={() => isStep && setExpanded(!expanded)}
        className={`flex items-center gap-2 w-full px-3 py-2 text-left ${isStep ? 'cursor-pointer' : 'cursor-default'}`}
      >
        {isStep ? (
          showContent ? <ChevronDown size={12} style={{ color: config.color }} /> : <ChevronRight size={12} style={{ color: config.color }} />
        ) : (
          <config.icon size={14} style={{ color: config.color }} />
        )}
        <span className="text-[9px] font-heading tracking-widest font-bold shrink-0" style={{ color: config.color }}>
          {config.label}{node.number != null ? ` ${node.number}` : ''}
        </span>
        <span className="text-xs text-foreground truncate flex-1">{node.title || node.text}</span>
        {node.possibleStall && (
          <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 shrink-0">
            <AlertTriangle size={8} /> possible stall
          </span>
        )}
      </button>

      {showContent && (
        <div className="px-3 pb-3 pt-1">
          {isBlocked && <p className="text-[11px] text-red-400/90 font-mono mt-1">{node.text}</p>}
          {isSelfProposed && <p className="text-[11px] text-yellow-400/90 mt-1">{node.text}</p>}
          {isDone && <p className="text-[11px] text-green-400/90 mt-1">{node.text}</p>}

          {node.lines && node.lines.length > 1 && isStep && (
            <CodeBlock content={node.lines.slice(1).join('\n')} />
          )}

          {node.fileChanges && node.fileChanges.length > 0 && <DiffPreview changes={node.fileChanges} />}

          {isSelfProposed && (
            interactive ? (
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => onConfirm?.(true)} className="text-[10px] px-3 py-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">
                  ✓ Proceed
                </button>
                <button onClick={() => onConfirm?.(false)} className="text-[10px] px-3 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                  ✗ Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-yellow-400/60">
                <Terminal size={10} /> waiting on terminal
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}