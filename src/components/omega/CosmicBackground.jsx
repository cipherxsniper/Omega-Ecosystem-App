import React from 'react';

const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 0.5,
  delay: Math.random() * 6,
  duration: Math.random() * 4 + 3,
}));

export default function CosmicBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {STARS.map(star => (
        <div
          key={star.id}
          className="absolute rounded-full cosmic-float"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            background: star.id % 3 === 0 ? '#38d2bd' : star.id % 3 === 1 ? '#8b5cf6' : '#ffc832',
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
            opacity: 0.3,
          }}
        />
      ))}
      {/* Floating eye */}
      <div className="absolute eye-float" style={{ top: '8%', right: '12%', animationDelay: '1s' }}>
        <svg width="40" height="24" viewBox="0 0 40 24" fill="none" opacity="0.15">
          <path d="M20 2C10 2 2 12 2 12s8 10 18 10 18-10 18-10S30 2 20 2z" stroke="#38d2bd" strokeWidth="1.5" fill="none"/>
          <circle cx="20" cy="12" r="5" stroke="#8b5cf6" strokeWidth="1" fill="none"/>
          <circle cx="20" cy="12" r="2" fill="#38d2bd" opacity="0.6"/>
        </svg>
      </div>
      <div className="absolute eye-float" style={{ bottom: '15%', left: '8%', animationDelay: '3s' }}>
        <svg width="30" height="18" viewBox="0 0 40 24" fill="none" opacity="0.1">
          <path d="M20 2C10 2 2 12 2 12s8 10 18 10 18-10 18-10S30 2 20 2z" stroke="#ffc832" strokeWidth="1.5" fill="none"/>
          <circle cx="20" cy="12" r="5" stroke="#38d2bd" strokeWidth="1" fill="none"/>
          <circle cx="20" cy="12" r="2" fill="#ffc832" opacity="0.6"/>
        </svg>
      </div>
    </div>
  );
}