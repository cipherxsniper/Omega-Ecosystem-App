import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Brain, User, Sparkles } from 'lucide-react';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const isThinking = message.role === 'assistant' && message.content === '';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        isUser
          ? 'bg-primary/20 border border-primary/30'
          : 'bg-gradient-to-br from-purple-500/30 to-primary/20 border border-purple-400/30'
      }`}>
        {isUser ? <User size={16} className="text-primary" /> : <Brain size={16} className="text-purple-400" />}
      </div>

      {/* Message */}
      <div className={`flex-1 min-w-0 max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`text-[10px] text-muted-foreground mb-1 font-heading tracking-widest ${isUser ? 'text-right' : 'text-left'}`}>
          {isUser ? 'YOU' : 'OMEGA DEEP'}
        </div>
        <div className={`rounded-xl px-4 py-3 ${
          isUser
            ? 'bg-primary/10 border border-primary/20'
            : 'bg-card border border-purple-400/15'
        }`}>
          {isThinking ? (
            <div className="flex items-center gap-1.5 py-1">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: '300ms' }} />
              <span className="text-[10px] text-muted-foreground ml-2">contemplating...</span>
            </div>
          ) : isUser ? (
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none prose-p:my-1 prose-pre:bg-background/60 prose-pre:border prose-code:text-primary prose-code:before:hidden prose-code:after:hidden prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary">
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        {message.perspective && !isUser && (
          <div className="text-[9px] text-muted-foreground/60 mt-1 flex items-center gap-1">
            <Sparkles size={8} /> {message.perspective}
          </div>
        )}
      </div>
    </div>
  );
}