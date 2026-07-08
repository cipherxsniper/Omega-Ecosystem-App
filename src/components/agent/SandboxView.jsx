import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Folder, FileText, Terminal as TerminalIcon, Cpu, MemoryStick, Wifi, Activity, Play, Square, FolderTree } from 'lucide-react';

const FILE_PATH_RE = /(?:^|\s)((?:\.?\/)?(?:src|app|base44|components|pages|lib|hooks|api|public)\/[\w@./-]+\.\w+)/g;

function extractFiles(output) {
  const files = new Map();
  let m;
  FILE_PATH_RE.lastIndex = 0;
  while ((m = FILE_PATH_RE.exec(output)) !== null) {
    const path = m[1];
    const parts = path.split('/');
    const name = parts[parts.length - 1];
    const dir = parts.slice(0, -1).join('/') || '/';
    const op = /write_file/i.test(output.slice(Math.max(0, m.index - 100), m.index + 100)) ? 'write' : 'read';
    if (!files.has(path)) files.set(path, { path, name, dir, op, modified: Date.now() });
  }
  return Array.from(files.values());
}

function extractTerminal(output) {
  return output.split('\n').slice(-60);
}

function buildFileTree(files) {
  const tree = {};
  files.forEach(f => {
    const parts = f.path.split('/');
    let node = tree;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        node[part] = { type: 'file', op: f.op };
      } else {
        node[part] = node[part] || { type: 'dir', children: {} };
        node = node[part].children;
      }
    });
  });
  return tree;
}

function FileTreeNode({ name, node, depth = 0 }) {
  const [open, setOpen] = useState(depth < 2);
  if (node.type === 'file') {
    return (
      <div className="flex items-center gap-1.5 py-0.5" style={{ paddingLeft: depth * 10 + 4 }}>
        <FileText size={9} className={node.op === 'write' ? 'text-green-400' : 'text-blue-400'} />
        <span className="text-[10px] text-muted-foreground truncate">{name}</span>
      </div>
    );
  }
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 py-0.5 hover:text-foreground" style={{ paddingLeft: depth * 10 + 4 }}>
        <Folder size={9} className="text-yellow-400" />
        <span className="text-[10px] text-muted-foreground/80">{name}</span>
      </button>
      {open && Object.entries(node.children).map(([k, v]) => <FileTreeNode key={k} name={k} node={v} depth={depth + 1} />)}
    </div>
  );
}

function ResourceGauge({ icon: Icon, label, value, color }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[9px] mb-0.5">
        <span className="text-muted-foreground flex items-center gap-1"><Icon size={9} /> {label}</span>
        <span style={{ color }}>{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

export default function SandboxView({ output, isRunning, taskStatus }) {
  const [cpu, setCpu] = useState(12);
  const [mem, setMem] = useState(34);
  const [net, setNet] = useState(5);
  const [uptime, setUptime] = useState(0);
  const [processes, setProcesses] = useState([
    { name: 'omega-agent', pid: 1001, cpu: 8, status: 'running' },
    { name: 'bash', pid: 1002, cpu: 1, status: 'running' },
    { name: 'node', pid: 1003, cpu: 3, status: 'running' },
  ]);
  const terminalRef = useRef(null);

  const files = extractFiles(output || '');
  const terminalLines = extractTerminal(output || '');
  const fileTree = buildFileTree(files);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setCpu(v => Math.min(95, Math.max(5, v + (Math.random() - 0.5) * 20)));
      setMem(v => Math.min(88, Math.max(20, v + (Math.random() - 0.5) * 8)));
      setNet(v => Math.min(80, Math.max(0, v + (Math.random() - 0.5) * 25)));
      setUptime(v => v + 1);
      setProcesses(prev => prev.map(p => ({ ...p, cpu: Math.max(0, p.cpu + (Math.random() - 0.5) * 5) })));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [terminalLines.length]);

  const fmtUptime = (s) => `${Math.floor(s / 60)}m ${s % 60}s`;
  const statusColor = taskStatus === 'error' ? '#ef4444' : taskStatus === 'done' ? '#22c55e' : '#38d2bd';

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-2 overflow-hidden min-h-0">
      {/* File Tree */}
      <div className="tile-card rounded-lg p-2 lg:w-56 shrink-0 overflow-y-auto max-h-48 lg:max-h-none">
        <div className="font-heading text-[9px] tracking-widest text-muted-foreground mb-2 px-1 flex items-center gap-1.5">
          <FolderTree size={10} /> SANDBOX FS
        </div>
        {files.length === 0 ? (
          <p className="text-[9px] text-muted-foreground/40 px-1">No files touched yet</p>
        ) : (
          Object.entries(fileTree).map(([k, v]) => <FileTreeNode key={k} name={k} node={v} />)
        )}
      </div>

      {/* Terminal */}
      <div className="tile-card rounded-lg flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/50">
          <span className="font-heading text-[9px] tracking-widest text-muted-foreground flex items-center gap-1.5">
            <TerminalIcon size={10} /> TERMINAL
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
            <span className="text-[9px] text-muted-foreground/60">{taskStatus || 'idle'}</span>
            <span className="text-[9px] text-muted-foreground/40">· {fmtUptime(uptime)}</span>
          </div>
        </div>
        <div ref={terminalRef} className="flex-1 overflow-y-auto p-2.5 bg-background/40">
          {terminalLines.length === 0 ? (
            <p className="text-[10px] text-muted-foreground/30 font-mono">$ waiting for agent output…</p>
          ) : (
            terminalLines.map((line, i) => (
              <div key={i} className="text-[10px] font-mono leading-relaxed">
                <span className="text-muted-foreground/30 select-none">{String(i + 1).padStart(2, '0')} </span>
                <span className={line.match(/^STEP|done|complete/i) ? 'text-primary' : line.match(/blocked|error/i) ? 'text-red-400' : 'text-muted-foreground/80'}>
                  {line || '\u00A0'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Resources + Processes */}
      <div className="tile-card rounded-lg p-2.5 lg:w-44 shrink-0 space-y-3 overflow-y-auto max-h-48 lg:max-h-none">
        <div className="font-heading text-[9px] tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Monitor size={10} /> RESOURCES
        </div>
        <div className="space-y-2">
          <ResourceGauge icon={Cpu} label="CPU" value={cpu} color="#38d2bd" />
          <ResourceGauge icon={MemoryStick} label="MEM" value={mem} color="#8b5cf6" />
          <ResourceGauge icon={Wifi} label="NET" value={net} color="#f97316" />
        </div>
        <div>
          <div className="font-heading text-[9px] tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Activity size={10} /> PROCESSES
          </div>
          <div className="space-y-1">
            {processes.map(p => (
              <div key={p.pid} className="flex items-center gap-1.5 text-[9px]">
                {isRunning ? <Play size={7} className="text-green-400" /> : <Square size={7} className="text-muted-foreground/40" />}
                <span className="text-muted-foreground/80 truncate flex-1">{p.name}</span>
                <span className="text-muted-foreground/40">{Math.round(p.cpu)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}