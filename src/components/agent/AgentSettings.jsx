import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Github, Save, AlertCircle } from 'lucide-react';

export default function AgentSettings({ open, onClose, settings, onSave, onFetchRepos, reposError }) {
  const [local, setLocal] = useState(settings);

  useEffect(() => { setLocal(settings); }, [settings]);

  const handleSave = () => { onSave(local); };
  const handleFetchRepos = () => { onSave(local); onFetchRepos(local.serverUrl, local.bearerToken); };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agent Server Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Server URL</Label>
            <Input
              placeholder="https://your-agent-server.com"
              value={local.serverUrl || ''}
              onChange={e => setLocal({ ...local, serverUrl: e.target.value })}
              className="text-sm font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Bearer Token</Label>
            <Input
              type="password"
              placeholder="token…"
              value={local.bearerToken || ''}
              onChange={e => setLocal({ ...local, bearerToken: e.target.value })}
              className="text-sm font-mono"
            />
            <p className="text-[9px] text-muted-foreground">Required for all endpoints except /api/health</p>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-border">
            <Label className="text-xs flex items-center gap-1.5">
              <Github size={12} /> GitHub Connector
            </Label>
            <Input
              placeholder="username or repo URL"
              value={local.githubHandle || ''}
              onChange={e => setLocal({ ...local, githubHandle: e.target.value })}
              className="text-sm"
            />
            <Button onClick={handleFetchRepos} size="sm" variant="outline" className="w-full mt-2 gap-1.5">
              <Github size={12} /> Connect & Fetch Repos
            </Button>
            {reposError && (
              <p className="text-[10px] text-yellow-400 flex items-center gap-1 mt-1">
                <AlertCircle size={10} /> {reposError}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} className="flex-1 gap-1.5">
              <Save size={14} /> Save
            </Button>
            <Button onClick={onClose} variant="outline">Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}