import React from 'react';

export default function OracleEye({ score = 50, size = 80 }) {
  const color = score >= 80 ? '#38d2bd' : score >= 60 ? '#ffc832' : score >= 40 ? '#f97316' : '#ef4444';
  const irisScale = 0.3 + (score / 100) * 0.4;
  const r = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center eye-float" style={{ width: size, height: size * 0.6 }}>
      <svg width={size} height={size * 0.6} viewBox="0 0 100 60" fill="none">
        {/* Outer glow */}
        <defs>
          <radialGradient id={`oracleGlow-${size}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
          <filter id="blur">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>
        <ellipse cx="50" cy="30" rx="48" ry="28" fill={`url(#oracleGlow-${size})`} />
        {/* Eye shape */}
        <path d="M50 4C25 4 4 30 4 30s21 26 46 26 46-26 46-26S75 4 50 4z" stroke={color} strokeWidth="1.5" fill="none" opacity="0.8"/>
        {/* Iris */}
        <circle cx="50" cy="30" r={16 * irisScale + 6} fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
        <circle cx="50" cy="30" r={10 * irisScale + 3} fill={color} opacity="0.15" />
        {/* Pupil */}
        <circle cx="50" cy="30" r={6 * irisScale + 1} fill={color} opacity="0.6" />
        <circle cx="50" cy="30" r={3 * irisScale} fill="white" opacity="0.2" />
        {/* Highlight */}
        <circle cx="44" cy="24" r="2" fill="white" opacity="0.4" />
      </svg>
      <div className="absolute -bottom-5 text-center w-full">
        <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}