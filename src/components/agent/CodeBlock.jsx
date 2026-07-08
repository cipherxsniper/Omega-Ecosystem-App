import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CodeBlock({ content, language, maxHeight = 'max-h-64' }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-1.5 rounded-lg border border-border bg-background/50 overflow-hidden">
      <div className="flex items-center justify-between px-2.5 py-1 bg-muted/30">
        {language && <span className="text-[9px] font-mono text-muted-foreground/70 uppercase tracking-wider">{language}</span>}
        <button
          onClick={copy}
          className="ml-auto flex items-center gap-1 text-[9px] text-muted-foreground hover:text-primary transition-colors"
        >
          {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className={`p-2.5 text-[10px] font-mono text-muted-foreground overflow-x-auto ${maxHeight} whitespace-pre-wrap break-words overflow-y-auto`}>
        {content}
      </pre>
    </div>
  );
}