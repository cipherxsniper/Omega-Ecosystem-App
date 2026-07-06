import React, { useRef, useEffect, useState, useCallback } from 'react';

// Tile types: '#' wall, '.' grass, 'T' tree, 'W' water, 'P' path, 'I' item(nft), 'C' coin(omg), 'E' enemy, 'S' shrine, 'B' boss, 'O' portal, 'H' heart
const MAPS = {
  void_nexus: [
    '####################',
    '#..................#',
    '#..II....EE....OO..#',
    '#..................#',
    '#..####......####..#',
    '#..#............#..#',
    '#..#....SS......#..#',
    '#..#............#..#',
    '#..####......####..#',
    '#..................#',
    '#..CC....EE....BB..#',
    '#..................#',
    '#..HH..............#',
    '####################',
  ],
  mirror_depths: [
    '####################',
    '#..TT..WWWWWW..TT..#',
    '#..TT..W....W..TT..#',
    '#......W.II.W.......#',
    '#......W.WW.W.......#',
    '#..EE..W.PP.W..EE...#',
    '#......W.PP.W.......#',
    '#......W.WW.W.......#',
    '#......W.CC.W.......#',
    '#..TT..W.WW.W..TT...#',
    '#..TT..W.SS.W..TT...#',
    '#......WWWWWW........#',
    '#..OO..........BB...#',
    '####################',
  ],
  ember_wastes: [
    '####################',
    '#..................#',
    '#..##..........##..#',
    '#..##..PPPP....##..#',
    '#......PPPP........#',
    '#..EE..PPPP....II..#',
    '#......PPPP........#',
    '#..####....####....#',
    '#............SS....#',
    '#..CC..EE......BB..#',
    '#..................#',
    '#..####....####....#',
    '#..OO........HH....#',
    '####################',
  ],
  chronos_spire: [
    '####################',
    '#........WW........#',
    '#..II....WW....EE..#',
    '#........WW........#',
    '#..####......####..#',
    '#..#............#..#',
    '#..#....SS......#..#',
    '#..#............#..#',
    '#..####......####..#',
    '#........WW........#',
    '#..CC....WW....BB..#',
    '#........WW........#',
    '#..OO....HH........#',
    '####################',
  ],
  oracle_sanctum: [
    '####################',
    '#..................#',
    '#..TTTTTT..TTTTTT..#',
    '#..T....T..T....T..#',
    '#..T.II.T..T.CC.T..#',
    '#..T....T..T....T..#',
    '#..TTTTTT..TTTTTT..#',
    '#........SS........#',
    '#..EE..........EE..#',
    '#..................#',
    '#..####......####..#',
    '#..#............#..#',
    '#..OO..........BB..#',
    '####################',
  ],
};

const TILE_SIZE = 28;
const MAP_COLS = 20;
const MAP_ROWS = 14;
const PLAYER_SPEED = 2;
const ENEMY_SPEED = 0.8;

const TILE_COLORS = {
  void_nexus: { grass: '#0d2818', grass2: '#0a2214', path: '#1a1a2e', wall: '#2a2a4a', water: '#0a3d3d', accent: '#38d2bd' },
  mirror_depths: { grass: '#0f0a1e', grass2: '#120c24', path: '#1e1235', wall: '#2d1f4a', water: '#2a1d4d', accent: '#8b5cf6' },
  ember_wastes: { grass: '#1e140a', grass2: '#241810', path: '#2e2010', wall: '#3d2818', water: '#2d1808', accent: '#f97316' },
  chronos_spire: { grass: '#0a1a1e', grass2: '#0e1e24', path: '#102028', wall: '#1a2d3d', water: '#0a2030', accent: '#3b82f6' },
  oracle_sanctum: { grass: '#1e1a0a', grass2: '#242010', path: '#2e2814', wall: '#3d3818', water: '#2d2808', accent: '#ffc832' },
};

export default function ZeldaCanvas({ gameState, world, worldKey, onItemFound, onEnemyEncounter, onPortalEnter, onShrineRest, onBossFight }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const keysRef = useRef({});
  const playerRef = useRef({ x: 120, y: 200, dir: 'down', animFrame: 0 });
  const enemiesRef = useRef([]);
  const itemsRef = useRef([]);
  const interactedRef = useRef(new Set());
  const [touchDir, setTouchDir] = useState(null);

  const mapData = MAPS[worldKey] || MAPS.void_nexus;
  const colors = TILE_COLORS[worldKey] || TILE_COLORS.void_nexus;

  useEffect(() => {
    playerRef.current = { x: 4 * TILE_SIZE + 8, y: 7 * TILE_SIZE + 4, dir: 'down', animFrame: 0 };
    interactedRef.current = new Set();

    const enemies = [];
    const items = [];
    for (let r = 0; r < mapData.length; r++) {
      for (let c = 0; c < mapData[r].length; c++) {
        const ch = mapData[r][c];
        const id = `${r},${c}`;
        if (ch === 'E') {
          enemies.push({ x: c * TILE_SIZE + 4, y: r * TILE_SIZE + 4, id, dir: Math.random() * Math.PI * 2, alive: true });
        }
        if (ch === 'I' || ch === 'C' || ch === 'H') {
          items.push({ x: c * TILE_SIZE, y: r * TILE_SIZE, type: ch, id, collected: false });
        }
      }
    }
    enemiesRef.current = enemies;
    itemsRef.current = items;
  }, [worldKey, mapData]);

  useEffect(() => {
    const down = (e) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(e.key.toLowerCase())) e.preventDefault();
    };
    const up = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const isWall = useCallback((px, py) => {
    const col = Math.floor(px / TILE_SIZE);
    const row = Math.floor(py / TILE_SIZE);
    if (row < 0 || row >= mapData.length || col < 0 || col >= mapData[0].length) return true;
    const tile = mapData[row][col];
    return tile === '#' || tile === 'W' || tile === 'T';
  }, [mapData]);

  const getTile = useCallback((col, row) => {
    if (row < 0 || row >= mapData.length || col < 0 || col >= mapData[0].length) return '#';
    return mapData[row][col];
  }, [mapData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const canvasW = MAP_COLS * TILE_SIZE;
    const canvasH = MAP_ROWS * TILE_SIZE;

    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    ctx.scale(dpr, dpr);

    let running = true;

    const animate = (t) => {
      if (!running) return;
      const phase = t * 0.003;

      // === UPDATE PLAYER ===
      const p = playerRef.current;
      let dx = 0, dy = 0;
      const keys = keysRef.current;
      const touch = touchDir;
      if (keys['arrowleft'] || keys['a'] || touch === 'left') { dx -= PLAYER_SPEED; p.dir = 'left'; }
      if (keys['arrowright'] || keys['d'] || touch === 'right') { dx += PLAYER_SPEED; p.dir = 'right'; }
      if (keys['arrowup'] || keys['w'] || touch === 'up') { dy -= PLAYER_SPEED; p.dir = 'up'; }
      if (keys['arrowdown'] || keys['s'] || touch === 'down') { dy += PLAYER_SPEED; p.dir = 'down'; }

      if (dx !== 0 || dy !== 0) {
        p.animFrame += 0.15;
        const size = 14;
        const newX = p.x + dx;
        const newY = p.y + dy;
        const checkX = dx !== 0 && !isWall(newX + (dx > 0 ? size : -2), p.y + 4) && !isWall(newX + (dx > 0 ? size : -2), p.y + size - 4);
        const checkY = dy !== 0 && !isWall(p.x + 4, newY + (dy > 0 ? size : 0)) && !isWall(p.x + size - 4, newY + (dy > 0 ? size : 0));
        if (checkX) p.x = newX;
        if (checkY) p.y = newY;
      }

      p.x = Math.max(2, Math.min(canvasW - 16, p.x));
      p.y = Math.max(2, Math.min(canvasH - 16, p.y));

      // === UPDATE ENEMIES ===
      enemiesRef.current.forEach(e => {
        if (!e.alive) return;
        if (Math.random() < 0.02) e.dir = Math.random() * Math.PI * 2;
        e.x += Math.cos(e.dir) * ENEMY_SPEED;
        e.y += Math.sin(e.dir) * ENEMY_SPEED;
        if (isWall(e.x + 4, e.y + 4) || isWall(e.x + 12, e.y + 12)) {
          e.dir += Math.PI;
          e.x -= Math.cos(e.dir) * ENEMY_SPEED * 2;
          e.y -= Math.sin(e.dir) * ENEMY_SPEED * 2;
        }
        e.x = Math.max(4, Math.min(canvasW - 16, e.x));
        e.y = Math.max(4, Math.min(canvasH - 16, e.y));
      });

      // === CHECK INTERACTIONS ===
      const pCol = Math.floor((p.x + 8) / TILE_SIZE);
      const pRow = Math.floor((p.y + 8) / TILE_SIZE);
      const tile = getTile(pCol, pRow);

      // Item pickup
      itemsRef.current.forEach(item => {
        if (item.collected) return;
        const dist = Math.hypot(p.x + 8 - (item.x + 14), p.y + 8 - (item.y + 14));
        if (dist < 16) {
          item.collected = true;
          if (item.type === 'I') onItemFound?.('nft');
          else if (item.type === 'C') onItemFound?.('coin');
          else if (item.type === 'H') onItemFound?.('heart');
        }
      });

      // Enemy encounter
      enemiesRef.current.forEach(e => {
        if (!e.alive) return;
        const dist = Math.hypot(p.x + 8 - (e.x + 8), p.y + 8 - (e.y + 8));
        if (dist < 18 && !interactedRef.current.has(e.id + '_enc')) {
          interactedRef.current.add(e.id + '_enc');
          onEnemyEncounter?.(e);
          setTimeout(() => interactedRef.current.delete(e.id + '_enc'), 1500);
        }
      });

      // Portal
      if (tile === 'O' && !interactedRef.current.has('portal')) {
        interactedRef.current.add('portal');
        onPortalEnter?.();
        setTimeout(() => interactedRef.current.delete('portal'), 2000);
      }

      // Shrine
      if (tile === 'S' && !interactedRef.current.has('shrine')) {
        interactedRef.current.add('shrine');
        onShrineRest?.();
        setTimeout(() => interactedRef.current.delete('shrine'), 3000);
      }

      // Boss
      if (tile === 'B' && !interactedRef.current.has('boss')) {
        interactedRef.current.add('boss');
        onBossFight?.();
        setTimeout(() => interactedRef.current.delete('boss'), 3000);
      }

      // === RENDER ===
      ctx.fillStyle = colors.grass;
      ctx.fillRect(0, 0, canvasW, canvasH);

      for (let r = 0; r < mapData.length; r++) {
        for (let c = 0; c < mapData[r].length; c++) {
          const ch = mapData[r][c];
          const x = c * TILE_SIZE;
          const y = r * TILE_SIZE;

          if (ch === '.') {
            ctx.fillStyle = ((r + c) % 3 === 0) ? colors.grass2 : colors.grass;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            if ((r * 7 + c * 3) % 5 === 0) {
              ctx.fillStyle = colors.accent + '15';
              ctx.fillRect(x + 6, y + 6, 2, 4);
              ctx.fillRect(x + 16, y + 12, 2, 3);
            }
          }

          if (ch === 'P') {
            ctx.fillStyle = colors.path;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(x + 4, y + 6, 3, 2);
            ctx.fillRect(x + 16, y + 18, 3, 2);
          }

          if (ch === '#') {
            ctx.fillStyle = colors.wall;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, 3);
          }

          if (ch === 'W') {
            const ripple = Math.sin(phase * 2 + c * 0.5 + r * 0.3) * 3;
            ctx.fillStyle = colors.water;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x + 14, y + 14, 6 + ripple, 0, Math.PI);
            ctx.stroke();
          }

          if (ch === 'T') {
            ctx.fillStyle = colors.grass;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#3d2810';
            ctx.fillRect(x + 11, y + 16, 6, 10);
            ctx.fillStyle = '#1a3d1a';
            ctx.beginPath();
            ctx.arc(x + 14, y + 12, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2a5d2a';
            ctx.beginPath();
            ctx.arc(x + 12, y + 10, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Draw items
      itemsRef.current.forEach(item => {
        if (item.collected) return;
        const bob = Math.sin(phase * 3 + item.x) * 2;
        const cx = item.x + 14;
        const cy = item.y + 14 + bob;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12);
        if (item.type === 'I') {
          grad.addColorStop(0, world.accent + '80');
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fillRect(cx - 12, cy - 12, 24, 24);
          ctx.fillStyle = world.accent;
          ctx.beginPath();
          ctx.moveTo(cx, cy - 6);
          ctx.lineTo(cx + 5, cy);
          ctx.lineTo(cx, cy + 6);
          ctx.lineTo(cx - 5, cy);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#ffffff80';
          ctx.beginPath();
          ctx.moveTo(cx, cy - 4);
          ctx.lineTo(cx + 2, cy - 1);
          ctx.lineTo(cx, cy + 1);
          ctx.lineTo(cx - 2, cy - 1);
          ctx.closePath();
          ctx.fill();
        } else if (item.type === 'C') {
          grad.addColorStop(0, '#ffc83280');
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fillRect(cx - 12, cy - 12, 24, 24);
          ctx.fillStyle = '#ffc832';
          ctx.beginPath();
          ctx.arc(cx, cy, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffe080';
          ctx.beginPath();
          ctx.arc(cx - 1, cy - 1, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === 'H') {
          grad.addColorStop(0, '#ef444480');
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fillRect(cx - 12, cy - 12, 24, 24);
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(cx, cy + 5);
          ctx.bezierCurveTo(cx - 8, cy - 2, cx - 4, cy - 7, cx, cy - 2);
          ctx.bezierCurveTo(cx + 4, cy - 7, cx + 8, cy - 2, cx, cy + 5);
          ctx.closePath();
          ctx.fill();
        }
      });

      // Draw enemies
      enemiesRef.current.forEach(e => {
        if (!e.alive) return;
        const cx = e.x + 8;
        const cy = e.y + 8;
        const bob = Math.sin(phase * 4 + e.id.charCodeAt(0)) * 2;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 8, 7, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(139, 92, 246, 0.8)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + bob, 8, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a0a2e';
        ctx.beginPath();
        ctx.arc(cx, cy + bob - 1, 4, 0, Math.PI * 2);
        ctx.fill();
        const angle = Math.atan2(p.y - e.y, p.x - e.x);
        ctx.fillStyle = '#38d2bd';
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * 2, cy + bob - 1 + Math.sin(angle) * 2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * 2 + 0.5, cy + bob - 1 + Math.sin(angle) * 2, 0.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw portals, shrines, bosses
      for (let r = 0; r < mapData.length; r++) {
        for (let c = 0; c < mapData[r].length; c++) {
          const ch = mapData[r][c];
          if (ch === 'O') {
            const cx = c * TILE_SIZE + 14;
            const cy = r * TILE_SIZE + 14;
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
            grad.addColorStop(0, world.accent + '90');
            grad.addColorStop(0.5, world.accent + '40');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(cx - 14, cy - 14, 28, 28);
            ctx.strokeStyle = world.accent + '80';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let s = 0; s < 20; s++) {
              const sa = (s / 20) * Math.PI * 4 + phase * 5;
              const sr = s * 0.6;
              const sx = cx + Math.cos(sa) * sr;
              const sy = cy + Math.sin(sa) * sr;
              s === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
            }
            ctx.stroke();
          }
          if (ch === 'S') {
            const cx = c * TILE_SIZE + 14;
            const cy = r * TILE_SIZE + 14;
            ctx.fillStyle = '#3d3d3d';
            ctx.fillRect(cx - 8, cy + 2, 16, 8);
            ctx.fillStyle = '#5d5d5d';
            ctx.fillRect(cx - 6, cy - 2, 12, 6);
            const flameH = 6 + Math.sin(phase * 6) * 2;
            ctx.fillStyle = '#ffc832';
            ctx.beginPath();
            ctx.ellipse(cx, cy - flameH / 2 - 2, 3, flameH, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff8c00';
            ctx.beginPath();
            ctx.ellipse(cx, cy - flameH / 2, 2, flameH * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            const grad = ctx.createRadialGradient(cx, cy - 4, 0, cx, cy - 4, 20);
            grad.addColorStop(0, '#ffc83230');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(cx - 20, cy - 24, 40, 40);
          }
          if (ch === 'B') {
            const cx = c * TILE_SIZE + 14;
            const cy = r * TILE_SIZE + 14;
            const pulse = Math.sin(phase * 2) * 0.3 + 0.7;
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20);
            grad.addColorStop(0, `rgba(239, 68, 68, ${pulse * 0.4})`);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(cx - 20, cy - 20, 40, 40);
            ctx.fillStyle = '#1a0a0a';
            ctx.beginPath();
            ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(cx - 3, cy - 1, 1.5, 0, Math.PI * 2);
            ctx.arc(cx + 3, cy - 1, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ef4444';
            for (let i = -2; i <= 2; i++) {
              ctx.beginPath();
              ctx.moveTo(cx + i * 4, cy - 8);
              ctx.lineTo(cx + i * 4 - 2, cy - 12);
              ctx.lineTo(cx + i * 4 + 2, cy - 12);
              ctx.closePath();
              ctx.fill();
            }
          }
        }
      }

      // Draw player
      const px = p.x;
      const py = p.y;
      const walkBob = (dx !== 0 || dy !== 0) ? Math.sin(p.animFrame) * 1.5 : 0;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(px + 8, py + 16, 6, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      const lanternR = (gameState.lantern_fuel / 100) * 60 + 30;
      const lgrad = ctx.createRadialGradient(px + 8, py + 8, 0, px + 8, py + 8, lanternR);
      lgrad.addColorStop(0, 'rgba(255, 200, 50, 0.12)');
      lgrad.addColorStop(0.5, 'rgba(255, 200, 50, 0.04)');
      lgrad.addColorStop(1, 'transparent');
      ctx.fillStyle = lgrad;
      ctx.fillRect(px + 8 - lanternR, py + 8 - lanternR, lanternR * 2, lanternR * 2);
      ctx.fillStyle = world.accent;
      ctx.fillRect(px + 4, py + 6 + walkBob, 8, 8);
      ctx.fillStyle = '#f0d0a0';
      ctx.beginPath();
      ctx.arc(px + 8, py + 4 + walkBob, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a1a4a';
      ctx.beginPath();
      ctx.arc(px + 8, py + 3 + walkBob, 4, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a0a2e';
      if (p.dir === 'right') {
        ctx.fillRect(px + 9, py + 4 + walkBob, 1.5, 1.5);
      } else if (p.dir === 'left') {
        ctx.fillRect(px + 5, py + 4 + walkBob, 1.5, 1.5);
      } else if (p.dir === 'down') {
        ctx.fillRect(px + 6, py + 5 + walkBob, 1, 1);
        ctx.fillRect(px + 9, py + 5 + walkBob, 1, 1);
      }
      ctx.fillStyle = '#ffc832';
      ctx.beginPath();
      ctx.arc(px + 14, py + 10 + walkBob, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff8e0';
      ctx.beginPath();
      ctx.arc(px + 14, py + 10 + walkBob, 1, 0, Math.PI * 2);
      ctx.fill();

      // Darkness vignette
      const vgrad = ctx.createRadialGradient(px + 8, py + 8, lanternR * 0.6, px + 8, py + 8, Math.max(canvasW, canvasH));
      vgrad.addColorStop(0, 'transparent');
      vgrad.addColorStop(1, colors.grass + 'ee');
      ctx.fillStyle = vgrad;
      ctx.fillRect(0, 0, canvasW, canvasH);

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
    };
  }, [worldKey, world, gameState.lantern_fuel, gameState.level, touchDir, isWall, getTile, colors, onItemFound, onEnemyEncounter, onPortalEnter, onShrineRest, onBossFight]);

  const handleTouch = (dir) => setTouchDir(dir);
  const releaseTouch = () => setTouchDir(null);

  return (
    <div className="space-y-2">
      <div className="tile-card rounded-xl overflow-hidden relative">
        <canvas
          ref={canvasRef}
          className="w-full block"
          style={{ imageRendering: 'pixelated', aspectRatio: `${MAP_COLS} / ${MAP_ROWS}`, maxHeight: '420px' }}
        />
        <div className="absolute bottom-2 left-3 text-[9px] font-mono text-muted-foreground/60 pointer-events-none">
          {world.name} · WASD to move · walk into things to interact
        </div>
      </div>

      {/* Mobile D-pad */}
      <div className="flex lg:hidden justify-center">
        <div className="grid grid-cols-3 gap-1 w-36">
          <div />
          <button
            className="h-12 tile-card rounded-lg flex items-center justify-center active:bg-primary/20 text-lg"
            onTouchStart={() => handleTouch('up')} onTouchEnd={releaseTouch} onMouseDown={() => handleTouch('up')} onMouseUp={releaseTouch} onMouseLeave={releaseTouch}
          >▲</button>
          <div />
          <button
            className="h-12 tile-card rounded-lg flex items-center justify-center active:bg-primary/20 text-lg"
            onTouchStart={() => handleTouch('left')} onTouchEnd={releaseTouch} onMouseDown={() => handleTouch('left')} onMouseUp={releaseTouch} onMouseLeave={releaseTouch}
          >◀</button>
          <button
            className="h-12 tile-card rounded-lg flex items-center justify-center active:bg-primary/20 text-lg"
            onTouchStart={() => handleTouch('down')} onTouchEnd={releaseTouch} onMouseDown={() => handleTouch('down')} onMouseUp={releaseTouch} onMouseLeave={releaseTouch}
          >▼</button>
          <button
            className="h-12 tile-card rounded-lg flex items-center justify-center active:bg-primary/20 text-lg"
            onTouchStart={() => handleTouch('right')} onTouchEnd={releaseTouch} onMouseDown={() => handleTouch('right')} onMouseUp={releaseTouch} onMouseLeave={releaseTouch}
          >▶</button>
        </div>
      </div>
    </div>
  );
}