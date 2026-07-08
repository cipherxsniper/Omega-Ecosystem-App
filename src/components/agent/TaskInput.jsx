import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function TaskInput({ onSend, disabled, placeholder }) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 items-end px-1 pt-2 pb-1 border-t border-border shrink-0">
      <Textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder || 'Describe a task for the agent…'}
        disabled={disabled}
        className="resize-none text-sm min-h-[40px] max-h-32"
        rows={1}
      />
      <Button onClick={handleSend} disabled={disabled || !value.trim()} size="icon" className="h-10 w-10 shrink-0">
        {disabled ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
      </Button>
    </div>
  );
}