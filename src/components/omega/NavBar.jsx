import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Eye, Wallet, Image, Compass, Bot, Brain, Shield, FileCode, BarChart3, Gamepad2, Github, Sparkles } from 'lucide-react';
import OracleEye from '@/components/omega/OracleEye';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: Eye },
  { path: '/wallet', label: 'Wallet', icon: Wallet },
  { path: '/gallery', label: 'Gallery', icon: Image },
  { path: '/explorer', label: 'Explorer', icon: Compass },
  { path: '/trading', label: 'Trading', icon: BarChart3 },
  { path: '/lantern', label: 'Lantern RPG', icon: Gamepad2 },
  { path: '/provenance', label: 'Provenance', icon: Shield },
  { path: '/brain', label: 'Brain', icon: Brain },
  { path: '/code-export', label: 'Code Export', icon: FileCode },
  { path: '/github', label: 'GitHub', icon: Github },
  { path: '/omega-deep', label: 'Omega Deep', icon: Sparkles },
];

export default function NavBar({ oracleScore = 50 }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <OracleEye score={oracleScore} size={36} />
            <span className="font-heading text-sm font-bold tracking-widest text-primary ml-1">OMEGA</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map(item => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <item.icon size={14} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <button onClick={() => setOpen(!open)} className="lg:hidden p-2 text-muted-foreground hover:text-foreground">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute top-14 right-0 w-64 h-[calc(100vh-56px)] glass-panel p-4 overflow-y-auto" onClick={e => e.stopPropagation()}>
            {NAV_ITEMS.map(item => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium mb-1 transition-colors ${
                    active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}