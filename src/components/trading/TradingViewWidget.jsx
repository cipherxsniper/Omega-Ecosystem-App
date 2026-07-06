import React, { useEffect, useRef, useState } from 'react';

export default function TradingViewWidget({ symbol = 'ETHUSDT', interval = '60', height = 350 }) {
  const containerRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      toolbar_bg: '#0a0a1a',
      enable_publishing: false,
      allow_symbol_change: true,
      hide_side_toolbar: false,
      studies: ['STD;RSI'],
      backgroundColor: '#0a0a1a',
      gridColor: '#ffffff10',
    });

    widgetContainer.appendChild(script);
    container.appendChild(widgetContainer);
    setLoaded(true);

    return () => { container.innerHTML = ''; };
  }, [symbol, interval]);

  return (
    <div className="tile-card rounded-xl overflow-hidden relative" style={{ height }}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}