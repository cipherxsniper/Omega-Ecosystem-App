import React from 'react';
import { Link } from 'react-router-dom';

export default function TileCard({ title, icon, description, to, accentColor = '#38d2bd', children }) {
  const Wrapper = to ? Link : 'div';
  const props = to ? { to } : {};

  return (
    <Wrapper {...props} className="tile-card rounded-xl p-5 flex flex-col gap-3 cursor-pointer group shift-geometry relative overflow-hidden">
      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />
      
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: `${accentColor}15`, color: accentColor }}>
          {icon}
        </div>
        <div>
          <h3 className="font-heading text-sm font-semibold tracking-wide text-foreground">{title}</h3>
          {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </Wrapper>
  );
}