import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import CosmicBackground from '@/components/omega/CosmicBackground';
import NavBar from '@/components/omega/NavBar';

export default function AppLayout() {
  const [oracleScore, setOracleScore] = useState(50);

  useEffect(() => {
    base44.entities.GameState.list('-created_date', 1).then(states => {
      if (states.length > 0) setOracleScore(states[0].oracle_score || 50);
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen cosmic-bg relative">
      <CosmicBackground />
      <NavBar oracleScore={oracleScore} />
      <main className="relative z-10 pt-16 pb-8 px-4 max-w-7xl mx-auto">
        <Outlet context={{ oracleScore, setOracleScore }} />
      </main>
    </div>
  );
}