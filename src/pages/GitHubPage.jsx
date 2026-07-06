import React, { useState, useEffect, useCallback } from 'react';
import { Github, Plus, Star, GitFork, GitBranch, GitCommit, FileCode, ArrowDownToLine, ArrowUpFromLine, Check, AlertCircle, ExternalLink, Trash2, Settings, RefreshCw, Folder, FileText, Clock, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import PushFullProject from '@/components/github/PushFullProject';

function parseRepoUrl(url) {
  const match = url.match(/github\.com[/:]([^/]+)\/([^/\s?#]+)/);
  if (match) return { owner: match[1], repo: match[2].replace('.git', '') };
  return null;
}

async function ghApi(endpoint, token, method = 'GET', body = null) {
  const headers = { 'Accept': 'application/vnd.github.v3+json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`https://api.github.com${endpoint}`, opts);
  if (res.status === 403) {
    const remaining = res.headers.get('X-RateLimit-Remaining');
    throw new Error(remaining === '0' ? 'Rate limited. Add a token for 5000 req/hr.' : 'Forbidden — check token permissions.');
  }
  if (res.status === 404) throw new Error('Repository or resource not found.');
  if (res.status === 401) throw new Error('Invalid token. Check your Personal Access Token.');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error: ${res.status}`);
  }
  return res.json();
}

function encodeContent(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

function decodeContent(b64) {
  return decodeURIComponent(escape(atob(b64.replace(/\n/g, ''))));
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function GitHubPage() {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [repoData, setRepoData] = useState(null);
  const [commits, setCommits] = useState([]);
  const [branches, setBranches] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [fileContent, setFileContent] = useState(null);
  const [syncStates, setSyncStates] = useState({});
  const [syncLog, setSyncLog] = useState([]);
  const [pushForm, setPushForm] = useState({ path: '', content: '', message: 'Update from Omega Ecosystem' });
  const [pushing, setPushing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedRepos = JSON.parse(localStorage.getItem('omega_github_repos') || '[]');
    const savedToken = localStorage.getItem('omega_github_token') || '';
    const savedSync = JSON.parse(localStorage.getItem('omega_github_sync') || '{}');
    setRepos(savedRepos);
    setToken(savedToken);
    setSyncStates(savedSync);
  }, []);

  const saveRepos = (updated) => {
    setRepos(updated);
    localStorage.setItem('omega_github_repos', JSON.stringify(updated));
  };

  const saveToken = (t) => {
    setToken(t);
    localStorage.setItem('omega_github_token', t);
  };

  const saveSyncStates = (updated) => {
    setSyncStates(updated);
    localStorage.setItem('omega_github_sync', JSON.stringify(updated));
  };

  const addLog = (msg, type = 'info') => {
    setSyncLog(prev => [...prev.slice(-29), { msg, type, time: new Date().toISOString() }]);
  };

  const addRepo = async () => {
    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) {
      toast({ title: 'Invalid URL', description: 'Paste a GitHub repo URL like github.com/owner/repo', variant: 'destructive' });
      return;
    }
    if (repos.some(r => r.owner === parsed.owner && r.repo === parsed.repo)) {
      toast({ title: 'Already connected', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const data = await ghApi(`/repos/${parsed.owner}/${parsed.repo}`, token);
      const newRepo = { owner: parsed.owner, repo: parsed.repo, url: repoUrl, defaultBranch: data.default_branch, addedAt: new Date().toISOString() };
      const updated = [...repos, newRepo];
      saveRepos(updated);
      setRepoUrl('');
      addLog(`Connected repo ${parsed.owner}/${parsed.repo}`, 'success');
      toast({ title: 'Repo connected', description: `${parsed.owner}/${parsed.repo}` });
    } catch (e) {
      toast({ title: 'Failed to connect', description: e.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const removeRepo = (repo) => {
    const updated = repos.filter(r => !(r.owner === repo.owner && r.repo === repo.repo));
    saveRepos(updated);
    if (selectedRepo?.owner === repo.owner) {
      setSelectedRepo(null);
      setRepoData(null);
    }
    addLog(`Disconnected ${repo.owner}/${repo.repo}`, 'info');
  };

  const selectRepo = async (repo) => {
    setSelectedRepo(repo);
    setCurrentPath('');
    setFileContent(null);
    setRepoData(null);
    setCommits([]);
    setBranches([]);
    setFiles([]);
    setLoading(true);
    try {
      const [info, commitList, branchList, rootFiles] = await Promise.all([
        ghApi(`/repos/${repo.owner}/${repo.repo}`, token),
        ghApi(`/repos/${repo.owner}/${repo.repo}/commits?per_page=15`, token),
        ghApi(`/repos/${repo.owner}/${repo.repo}/branches`, token),
        ghApi(`/repos/${repo.owner}/${repo.repo}/contents?ref=${repo.defaultBranch || 'main'}`, token),
      ]);
      setRepoData(info);
      setCommits(commitList);
      setBranches(branchList);
      setFiles(Array.isArray(rootFiles) ? rootFiles : []);
      addLog(`Loaded ${repo.owner}/${repo.repo} — ${commitList.length} commits, ${branchList.length} branches`, 'info');
    } catch (e) {
      toast({ title: 'Failed to load repo', description: e.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const browsePath = async (path) => {
    if (!selectedRepo) return;
    setCurrentPath(path);
    setFileContent(null);
    setLoading(true);
    try {
      const ref = selectedRepo.defaultBranch || 'main';
      const contents = await ghApi(`/repos/${selectedRepo.owner}/${selectedRepo.repo}/contents/${path}?ref=${ref}`, token);
      if (Array.isArray(contents)) {
        setFiles(contents);
      } else {
        setFiles([]);
        setFileContent({ name: contents.name, path: contents.path, content: decodeContent(contents.content || ''), sha: contents.sha, size: contents.size });
      }
    } catch (e) {
      toast({ title: 'Failed to browse', description: e.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const pullFromGithub = async () => {
    if (!selectedRepo) return;
    setLoading(true);
    try {
      const ref = selectedRepo.defaultBranch || 'main';
      const commitList = await ghApi(`/repos/${selectedRepo.owner}/${selectedRepo.repo}/commits?per_page=50`, token);
      const latestSha = commitList[0]?.sha;
      const prevSha = syncStates[`${selectedRepo.owner}/${selectedRepo.repo}`]?.lastSha;
      const newCommits = prevSha ? commitList.findIndex(c => c.sha === prevSha) : commitList.length;

      const updated = { ...syncStates };
      updated[`${selectedRepo.owner}/${selectedRepo.repo}`] = {
        lastSha: latestSha,
        lastPull: new Date().toISOString(),
        status: 'synced',
      };
      saveSyncStates(updated);
      setCommits(commitList);
      addLog(`Pulled from GitHub — ${newCommits > 0 ? newCommits : 0} new commits`, 'success');
      toast({ title: 'Pull complete', description: `${newCommits > 0 ? newCommits : 0} new commits fetched` });
    } catch (e) {
      addLog(`Pull failed: ${e.message}`, 'error');
      toast({ title: 'Pull failed', description: e.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const pushToGithub = async () => {
    if (!selectedRepo) return;
    if (!token) {
      toast({ title: 'Token required', description: 'Add a GitHub Personal Access Token with repo scope to push.', variant: 'destructive' });
      setShowToken(true);
      return;
    }
    if (!pushForm.path || !pushForm.content) {
      toast({ title: 'Missing data', description: 'File path and content are required.', variant: 'destructive' });
      return;
    }
    setPushing(true);
    try {
      const ref = selectedRepo.defaultBranch || 'main';
      let existingSha = null;
      try {
        const existing = await ghApi(`/repos/${selectedRepo.owner}/${selectedRepo.repo}/contents/${pushForm.path}?ref=${ref}`, token);
        if (!Array.isArray(existing)) existingSha = existing.sha;
      } catch {}

      const body = {
        message: pushForm.message || 'Update from Omega Ecosystem',
        content: encodeContent(pushForm.content),
        branch: ref,
      };
      if (existingSha) body.sha = existingSha;

      const result = await ghApi(`/repos/${selectedRepo.owner}/${selectedRepo.repo}/contents/${pushForm.path}`, token, 'PUT', body);
      const updated = { ...syncStates };
      updated[`${selectedRepo.owner}/${selectedRepo.repo}`] = {
        lastSha: result.commit.sha,
        lastPush: new Date().toISOString(),
        status: 'synced',
      };
      saveSyncStates(updated);
      addLog(`Pushed ${pushForm.path} — commit ${result.commit.sha.slice(0, 7)}`, 'success');
      toast({ title: 'Push successful', description: `Commit ${result.commit.sha.slice(0, 7)} created on ${ref}` });
      setPushForm({ ...pushForm, path: '', content: '' });
      pullFromGithub();
    } catch (e) {
      addLog(`Push failed: ${e.message}`, 'error');
      toast({ title: 'Push failed', description: e.message, variant: 'destructive' });
    }
    setPushing(false);
  };

  const getSyncStatus = (repo) => {
    const key = `${repo.owner}/${repo.repo}`;
    const state = syncStates[key];
    if (!state) return { label: 'Not synced', color: '#6b7280', icon: Clock };
    return { label: state.status || 'synced', color: '#22c55e', icon: Check, lastSync: state.lastPull || state.lastPush };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-bold tracking-widest flex items-center gap-2">
          <Github className="text-foreground" size={20} /> GITHUB SYNC
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Two-way repository sync · Real GitHub REST API</p>
      </div>

      {/* Token Settings */}
      <div className="tile-card rounded-xl p-4">
        <button onClick={() => setShowToken(!showToken)} className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Settings size={14} className="text-muted-foreground" />
            <span className="font-heading text-xs tracking-widest uppercase">GitHub Token</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${token ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {token ? 'Authenticated · 5000 req/hr' : 'Unauthenticated · 60 req/hr'}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">{showToken ? 'Hide' : 'Show'}</span>
        </button>
        {showToken && (
          <div className="mt-3 space-y-2">
            <Input type="password" placeholder="ghp_xxxxxxxxxxxx" value={token} onChange={e => saveToken(e.target.value)} className="font-mono text-xs" />
            <div className="flex items-center justify-between">
              <a href="https://github.com/settings/tokens/new?scopes=repo&description=Omega%20Ecosystem" target="_blank" rel="noreferrer" className="text-[10px] text-primary flex items-center gap-1 hover:underline">
                <ExternalLink size={10} /> Create token on GitHub (needs repo scope for push)
              </a>
              {token && <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => saveToken('')}>Clear</Button>}
            </div>
            <p className="text-[10px] text-muted-foreground">Token stored locally in your browser. Required for push operations and private repos.</p>
          </div>
        )}
      </div>

      {/* Add Repo */}
      <div className="flex gap-2">
        <Input placeholder="Paste GitHub repo URL (github.com/owner/repo)" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && addRepo()} className="text-xs" />
        <Button onClick={addRepo} disabled={loading || !repoUrl} className="gap-1.5 shrink-0"><Plus size={14} /> Connect</Button>
      </div>

      {/* Connected Repos */}
      {repos.length === 0 ? (
        <div className="tile-card rounded-xl p-12 text-center text-muted-foreground text-sm">No repos connected. Paste a GitHub URL above.</div>
      ) : (
        <div className="grid gap-2">
          {repos.map(repo => {
            const key = `${repo.owner}/${repo.repo}`;
            const status = getSyncStatus(repo);
            const isSelected = selectedRepo?.owner === repo.owner && selectedRepo?.repo === repo.repo;
            return (
              <div key={key} className={`tile-card rounded-xl p-3 flex items-center justify-between ${isSelected ? 'border-primary/50' : ''}`}>
                <button onClick={() => selectRepo(repo)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0"><Github size={14} /></div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{key}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <status.icon size={10} style={{ color: status.color }} />
                      {status.label}
                      {status.lastSync && <span>· {timeAgo(status.lastSync)}</span>}
                    </div>
                  </div>
                </button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeRepo(repo)}>
                  <Trash2 size={12} />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Sync Banner */}
      {selectedRepo && token && (
        <div className="tile-card rounded-xl p-4 border-l-2 border-green-400/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
              <Github size={18} className="text-green-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate">{selectedRepo.owner}/{selectedRepo.repo}</div>
              <div className="text-[10px] text-green-400 flex items-center gap-1">
                <Check size={10} /> Authenticated & ready to sync
              </div>
            </div>
          </div>
          <Button
            onClick={() => document.getElementById('full-sync-trigger')?.click()}
            className="gap-2 shrink-0"
            size="sm"
          >
            <Rocket size={14} /> Sync Now
          </Button>
        </div>
      )}

      {/* Selected Repo Detail */}
      {selectedRepo && (
        <div className="space-y-4">
          {loading && !repoData ? (
            <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" /></div>
          ) : repoData ? (
            <Tabs defaultValue={token ? "sync" : "overview"}>
              <TabsList className="bg-muted/50 flex-wrap h-auto">
                <TabsTrigger value="overview" className="text-xs gap-1"><FileCode size={12} /> Overview</TabsTrigger>
                <TabsTrigger value="commits" className="text-xs gap-1"><GitCommit size={12} /> Commits</TabsTrigger>
                <TabsTrigger value="branches" className="text-xs gap-1"><GitBranch size={12} /> Branches</TabsTrigger>
                <TabsTrigger value="files" className="text-xs gap-1"><Folder size={12} /> Files</TabsTrigger>
                <TabsTrigger value="sync" className="text-xs gap-1"><RefreshCw size={12} /> Two-Way Sync</TabsTrigger>
              </TabsList>

              {/* Overview */}
              <TabsContent value="overview" className="mt-4 space-y-3">
                <div className="tile-card rounded-xl p-4">
                  <h3 className="font-heading text-sm font-bold mb-1">{repoData.full_name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{repoData.description || 'No description'}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                    <Metric icon={Star} label="Stars" value={repoData.stargazers_count} color="#ffc832" />
                    <Metric icon={GitFork} label="Forks" value={repoData.forks_count} color="#38d2bd" />
                    <Metric icon={GitBranch} label="Branch" value={repoData.default_branch} color="#8b5cf6" />
                    <Metric icon={FileCode} label="Language" value={repoData.language || '—'} color="#f97316" />
                  </div>
                </div>
                <a href={repoData.html_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 text-xs text-primary hover:underline">
                  <ExternalLink size={12} /> View on GitHub
                </a>
              </TabsContent>

              {/* Commits */}
              <TabsContent value="commits" className="mt-4 space-y-2">
                {commits.map(c => (
                  <div key={c.sha} className="tile-card rounded-xl p-3 flex items-center gap-3">
                    <GitCommit size={14} className="text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{c.commit.message.split('\n')[0]}</div>
                      <div className="text-[10px] text-muted-foreground">{c.commit.author?.login || c.commit.author?.name} · {timeAgo(c.commit.author?.date)}</div>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">{c.sha.slice(0, 7)}</span>
                  </div>
                ))}
              </TabsContent>

              {/* Branches */}
              <TabsContent value="branches" className="mt-4 space-y-2">
                {branches.map(b => (
                  <div key={b.name} className="tile-card rounded-xl p-3 flex items-center gap-3">
                    <GitBranch size={14} className="text-purple-400 shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-medium">{b.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{b.commit?.sha?.slice(0, 7)}</div>
                    </div>
                    {b.protected && <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">Protected</span>}
                  </div>
                ))}
              </TabsContent>

              {/* Files */}
              <TabsContent value="files" className="mt-4 space-y-2">
                {currentPath && (
                  <button onClick={() => browsePath(currentPath.split('/').slice(0, -1).join('/'))} className="flex items-center gap-2 text-xs text-primary hover:underline">
                    <Folder size={12} /> ../ (up)
                  </button>
                )}
                {fileContent ? (
                  <div className="tile-card rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
                      <span className="font-mono text-[11px] text-muted-foreground">{fileContent.path}</span>
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1" onClick={() => { navigator.clipboard.writeText(fileContent.content); toast({ title: 'Copied' }); }}>
                        <FileText size={10} /> Copy
                      </Button>
                    </div>
                    <pre className="p-4 text-[10px] font-mono text-muted-foreground overflow-x-auto max-h-96 whitespace-pre-wrap break-all">{fileContent.content}</pre>
                  </div>
                ) : (
                  files.map(f => (
                    <button key={f.path} onClick={() => browsePath(f.path)} className="tile-card rounded-xl p-3 flex items-center gap-3 w-full text-left">
                      {f.type === 'dir' ? <Folder size={14} className="text-yellow-400" /> : <FileText size={14} className="text-blue-400" />}
                      <span className="text-xs font-medium flex-1 truncate">{f.name}</span>
                      {f.size && <span className="text-[10px] text-muted-foreground">{f.size > 1024 ? `${(f.size / 1024).toFixed(1)} KB` : `${f.size} B`}</span>}
                    </button>
                  ))
                )}
              </TabsContent>

              {/* Two-Way Sync */}
              <TabsContent value="sync" className="mt-4 space-y-4">
                <div className="tile-card rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-heading text-xs tracking-widest">SYNC STATUS</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {syncStates[`${selectedRepo.owner}/${selectedRepo.repo}`]?.lastSha ? `Last SHA: ${syncStates[`${selectedRepo.owner}/${selectedRepo.repo}`].lastSha.slice(0, 12)}` : 'No sync data'}
                      </p>
                    </div>
                    <span className="text-[10px] px-3 py-1 rounded-full bg-green-500/20 text-green-400 font-semibold">{getSyncStatus(selectedRepo).label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={pullFromGithub} disabled={loading} variant="outline" className="gap-1.5 text-xs h-10">
                      <ArrowDownToLine size={14} /> Pull from GitHub
                    </Button>
                    <Button onClick={() => toast({ title: 'Push ready', description: 'Use the form below to push files' })} variant="outline" className="gap-1.5 text-xs h-10 border-primary/30 text-primary">
                      <ArrowUpFromLine size={14} /> Push to GitHub
                    </Button>
                  </div>
                </div>

                {/* Full Project Sync */}
                <PushFullProject
                  selectedRepo={selectedRepo}
                  token={token}
                  ghApi={ghApi}
                  encodeContent={encodeContent}
                  addLog={addLog}
                  onComplete={pullFromGithub}
                />

                {/* Push Form */}
                <div className="tile-card rounded-xl p-4 space-y-3">
                  <h3 className="font-heading text-xs tracking-widest">PUSH FILE TO GITHUB</h3>
                  <Input placeholder="File path (e.g. src/new-file.jsx)" value={pushForm.path} onChange={e => setPushForm({ ...pushForm, path: e.target.value })} className="text-xs font-mono" />
                  <Input placeholder="Commit message" value={pushForm.message} onChange={e => setPushForm({ ...pushForm, message: e.target.value })} className="text-xs" />
                  <Textarea placeholder="File content..." value={pushForm.content} onChange={e => setPushForm({ ...pushForm, content: e.target.value })} className="text-xs font-mono min-h-32" rows={8} />
                  <Button onClick={pushToGithub} disabled={pushing || !pushForm.path || !pushForm.content} className="w-full gap-2">
                    {pushing ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <ArrowUpFromLine size={14} />}
                    Push Commit
                  </Button>
                  {!token && (
                    <p className="text-[10px] text-yellow-400 flex items-center gap-1">
                      <AlertCircle size={10} /> Token required for push operations. Add one in the token settings above.
                    </p>
                  )}
                </div>

                {/* Sync Log */}
                <div className="tile-card rounded-xl p-4">
                  <h3 className="font-heading text-xs tracking-widest mb-2">SYNC LOG</h3>
                  {syncLog.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground">No sync activity yet.</p>
                  ) : (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {syncLog.slice().reverse().map((log, i) => (
                        <div key={i} className="text-[10px] flex items-start gap-2">
                          <span className={`shrink-0 ${log.type === 'success' ? 'text-green-400' : log.type === 'error' ? 'text-red-400' : 'text-muted-foreground'}`}>
                            {log.type === 'success' ? '✓' : log.type === 'error' ? '✗' : '•'}
                          </span>
                          <span className="text-muted-foreground">{log.msg}</span>
                          <span className="text-muted-foreground/50 shrink-0 ml-auto">{timeAgo(log.time)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : null}
        </div>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-muted/30 rounded-lg p-2">
      <div className="flex items-center justify-center mb-1"><Icon size={14} style={{ color }} /></div>
      <div className="text-xs font-semibold truncate" style={{ color }}>{value}</div>
      <div className="text-[9px] text-muted-foreground">{label}</div>
    </div>
  );
}