import React, { useState, useEffect, useCallback } from 'react';
import { GitBranch, Play, CheckCircle, XCircle, Loader2, Clock, RotateCw, Workflow, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_CONFIG = {
  completed: { color: '#22c55e', icon: CheckCircle, label: 'Success' },
  success: { color: '#22c55e', icon: CheckCircle, label: 'Success' },
  failure: { color: '#ef4444', icon: XCircle, label: 'Failed' },
  failed: { color: '#ef4444', icon: XCircle, label: 'Failed' },
  in_progress: { color: '#38d2bd', icon: Loader2, label: 'Running' },
  queued: { color: '#ffc832', icon: Clock, label: 'Queued' },
  cancelled: { color: '#6b7280', icon: XCircle, label: 'Cancelled' },
  neutral: { color: '#6b7280', icon: Clock, label: 'Neutral' },
};

const PIPELINE_STAGES = ['Lint', 'Build', 'Test', 'Deploy'];

export default function CICDPanel({ selectedRepo, token, ghApi }) {
  const [workflows, setWorkflows] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(null);
  const [refInput, setRefInput] = useState('');
  const { toast } = useToast();

  const load = useCallback(async () => {
    if (!selectedRepo) return;
    setLoading(true);
    try {
      const [wf, runList] = await Promise.all([
        ghApi(`/repos/${selectedRepo.owner}/${selectedRepo.repo}/actions/workflows`, token).catch(() => ({ workflows: [] })),
        ghApi(`/repos/${selectedRepo.owner}/${selectedRepo.repo}/actions/runs?per_page=20`, token).catch(() => ({ workflow_runs: [] })),
      ]);
      setWorkflows(wf.workflows || []);
      setRuns(runList.workflow_runs || []);
    } catch (e) {
      toast({ title: 'CI/CD load failed', description: e.message, variant: 'destructive' });
    }
    setLoading(false);
  }, [selectedRepo, token, ghApi, toast]);

  useEffect(() => {
    setRefInput(selectedRepo?.defaultBranch || 'main');
    load();
  }, [selectedRepo, load]);

  const triggerWorkflow = async (workflow) => {
    if (!token) {
      toast({ title: 'Token required', description: 'Add a GitHub token to trigger workflows.', variant: 'destructive' });
      return;
    }
    setTriggering(workflow.id);
    try {
      await ghApi(
        `/repos/${selectedRepo.owner}/${selectedRepo.repo}/actions/workflows/${workflow.id}/dispatches`,
        token, 'POST',
        { ref: refInput || selectedRepo.defaultBranch || 'main' }
      );
      toast({ title: 'Workflow triggered', description: `${workflow.name} dispatched on ${refInput || 'main'}` });
      setTimeout(load, 2000);
    } catch (e) {
      toast({ title: 'Trigger failed', description: e.message, variant: 'destructive' });
    }
    setTriggering(null);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  const latestRun = runs[0];
  const successRate = runs.length > 0
    ? Math.round((runs.filter(r => r.conclusion === 'success' || r.conclusion === 'completed').length / runs.length) * 100)
    : 0;

  // Pipeline stages derived from latest run jobs (simulated stages if no real data)
  const stages = PIPELINE_STAGES.map((stage, i) => {
    if (!latestRun) return { name: stage, status: 'pending' };
    if (latestRun.conclusion === 'failure' && i >= 1) return { name: stage, status: 'skipped' };
    if (latestRun.status === 'in_progress') {
      const progressIdx = 1;
      if (i < progressIdx) return { name: stage, status: 'completed' };
      if (i === progressIdx) return { name: stage, status: 'running' };
      return { name: stage, status: 'pending' };
    }
    return { name: stage, status: latestRun.conclusion === 'success' ? 'completed' : 'failed' };
  });

  return (
    <div className="space-y-4">
      {/* CI/CD Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="tile-card rounded-xl p-3 text-center">
          <Workflow size={16} className="text-primary mx-auto mb-1" />
          <div className="text-lg font-heading font-bold text-primary">{workflows.length}</div>
          <div className="text-[9px] text-muted-foreground tracking-wider uppercase">Workflows</div>
        </div>
        <div className="tile-card rounded-xl p-3 text-center">
          <Rocket size={16} className="text-accent mx-auto mb-1" />
          <div className="text-lg font-heading font-bold text-accent">{runs.length}</div>
          <div className="text-[9px] text-muted-foreground tracking-wider uppercase">Total Runs</div>
        </div>
        <div className="tile-card rounded-xl p-3 text-center">
          <CheckCircle size={16} className="text-green-400 mx-auto mb-1" />
          <div className="text-lg font-heading font-bold text-green-400">{successRate}%</div>
          <div className="text-[9px] text-muted-foreground tracking-wider uppercase">Success Rate</div>
        </div>
        <div className="tile-card rounded-xl p-3 text-center">
          <Clock size={16} className="text-purple-400 mx-auto mb-1" />
          <div className="text-lg font-heading font-bold text-purple-400">{latestRun ? timeAgo(latestRun.created_at) : '—'}</div>
          <div className="text-[9px] text-muted-foreground tracking-wider uppercase">Last Run</div>
        </div>
      </div>

      {/* Pipeline Visualization */}
      {latestRun && (
        <div className="tile-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-heading text-xs tracking-widest">LATEST PIPELINE</span>
              <span className="text-[10px] text-muted-foreground">{latestRun.name}</span>
            </div>
            <a href={latestRun.html_url} target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline">View on GitHub →</a>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto">
            {stages.map((stage, i) => {
              const colors = { completed: '#22c55e', running: '#38d2bd', failed: '#ef4444', pending: '#3a3a4a', skipped: '#2a2a3a' };
              const icons = { completed: CheckCircle, running: Loader2, failed: XCircle, pending: Clock, skipped: XCircle };
              const StageIcon = icons[stage.status];
              return (
                <React.Fragment key={stage.name}>
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center border" style={{ borderColor: `${colors[stage.status]}40`, background: `${colors[stage.status]}15` }}>
                      <StageIcon size={14} style={{ color: colors[stage.status] }} className={stage.status === 'running' ? 'animate-spin' : ''} />
                    </div>
                    <span className="text-[9px] text-muted-foreground">{stage.name}</span>
                  </div>
                  {i < stages.length - 1 && <div className="h-0.5 w-4 sm:w-8 shrink-0" style={{ background: stage.status === 'completed' ? '#22c55e40' : '#3a3a4a' }} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Workflows */}
      {workflows.length > 0 && (
        <div className="tile-card rounded-xl p-4">
          <h3 className="font-heading text-xs tracking-widest mb-3">WORKFLOWS</h3>
          <div className="space-y-2">
            {workflows.map(wf => (
              <div key={wf.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                <Workflow size={14} className="text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{wf.name}</div>
                  <div className="text-[9px] text-muted-foreground font-mono">{wf.path}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Input
                    placeholder="ref"
                    value={refInput}
                    onChange={e => setRefInput(e.target.value)}
                    className="h-7 w-20 text-[10px] font-mono"
                  />
                  <Button
                    onClick={() => triggerWorkflow(wf)}
                    disabled={triggering === wf.id || !token}
                    size="sm"
                    className="h-7 gap-1 text-[10px]"
                  >
                    {triggering === wf.id ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
                    Run
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {!token && <p className="text-[9px] text-yellow-400 mt-2">Token required to trigger workflow dispatches.</p>}
        </div>
      )}

      {/* Recent Runs */}
      <div className="tile-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-xs tracking-widest">RECENT RUNS</h3>
          <Button onClick={load} size="sm" variant="ghost" className="h-6 text-[10px] gap-1"><RotateCw size={10} /> Refresh</Button>
        </div>
        {runs.length === 0 ? (
          <p className="text-[10px] text-muted-foreground">No workflow runs found. Connect a repo with GitHub Actions enabled.</p>
        ) : (
          <div className="space-y-1">
            {runs.map(run => {
              const cfg = STATUS_CONFIG[run.conclusion || run.status] || STATUS_CONFIG.neutral;
              return (
                <div key={run.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors">
                  <cfg.icon size={14} style={{ color: cfg.color }} className={run.status === 'in_progress' ? 'animate-spin shrink-0' : 'shrink-0'} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{run.name || run.head_commit?.message?.split('\n')[0] || 'Workflow run'}</div>
                    <div className="text-[9px] text-muted-foreground flex items-center gap-1.5">
                      <GitBranch size={8} /> {run.head_branch}
                      <span>·</span>
                      <span>{cfg.label}</span>
                      <span>·</span>
                      <span>{timeAgo(run.created_at)}</span>
                    </div>
                  </div>
                  <a href={run.html_url} target="_blank" rel="noreferrer" className="text-[9px] text-primary hover:underline shrink-0">View</a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}