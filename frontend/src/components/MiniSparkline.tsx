import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

interface Point {
  date: string;
  price: number;
}

interface MiniSparklineProps {
  data: Point[];
  height?: number;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({ data, height = 112 }) => {
  const { t, formatCurrency } = useApp();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { pathD, areaD, points } = useMemo(() => {
    if (!data || data.length === 0) {
      return { pathD: '', areaD: '', points: [] };
    }

    const prices = data.map((d) => d.price);
    const rawMin = Math.min(...prices);
    const rawMax = Math.max(...prices);
    const padding = (rawMax - rawMin) * 0.15 || 50;
    const min = rawMin - padding;
    const max = rawMax + padding;
    const range = max - min || 1;

    const width = 300;
    const svgHeight = height;

    const pts = data.map((d, i) => {
      const x = (i / (data.length - 1 || 1)) * width;
      const y = svgHeight - ((d.price - min) / range) * (svgHeight - 16) - 8;
      return { x, y, date: d.date, price: d.price };
    });

    // Build smooth cubic bezier curve
    let linePath = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    const firstPt = pts[0];
    const lastPt = pts[pts.length - 1];
    const areaPath = `${linePath} L ${lastPt.x} ${svgHeight} L ${firstPt.x} ${svgHeight} Z`;

    return { pathD: linePath, areaD: areaPath, points: pts, minPrice: rawMin, maxPrice: rawMax };
  }, [data, height]);

  if (!data || data.length === 0) {
    return <div className="h-28 w-full flex items-center justify-center text-xs text-[#69776D]">{t('common.loading')}</div>;
  }

  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;

  return (
    <div
      className="relative w-full select-none"
      style={{ height }}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      <svg
        viewBox={`0 0 300 ${height}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="miniSparklineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#52785B" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#52785B" stopOpacity={0.0} />
          </linearGradient>
        </defs>

        {/* Fill Area */}
        <path d={areaD} fill="url(#miniSparklineGradient)" />

        {/* Stroke Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#52785B"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Hover Highlight Elements */}
        {activePoint && (
          <g>
            <line
              x1={activePoint.x}
              y1={0}
              x2={activePoint.x}
              y2={height}
              stroke="#52785B"
              strokeDasharray="3 3"
              strokeWidth="1"
              opacity="0.5"
            />
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="4.5"
              fill="#52785B"
              stroke="#E9EEE8"
              strokeWidth="2"
            />
          </g>
        )}

        {/* Transparent touch/click catchers for each point */}
        {points.map((pt, idx) => (
          <rect
            key={idx}
            x={Math.max(0, pt.x - 150 / points.length)}
            y={0}
            width={300 / points.length}
            height={height}
            fill="transparent"
            className="cursor-crosshair"
            onMouseEnter={() => setHoveredIndex(idx)}
          />
        ))}
      </svg>

      {/* Floating Tooltip */}
      {activePoint && (
        <div
          className="absolute z-20 pointer-events-none -top-1 bg-[#E9EEE8] border border-[#cfd8ce] rounded-lg px-2.5 py-1 shadow-md text-[11px] transform -translate-x-1/2 -translate-y-full transition-transform"
          style={{
            left: `${(activePoint.x / 300) * 100}%`,
          }}
        >
          <div className="text-[#69776D] text-[10px]">
            {t('dashboard.date_label')}: {activePoint.date}
          </div>
          <div className="font-bold text-[#26352B]">
            {formatCurrency(activePoint.price)} / {t('common.quintals')}
          </div>
        </div>
      )}
    </div>
  );
};
