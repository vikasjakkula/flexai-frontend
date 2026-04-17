"use client";

import { motion } from 'framer-motion';

interface RadarData {
  label: string;
  value: number;
  maxValue?: number;
}

interface RadarChartProps {
  data: RadarData[];
  width?: number;
  height?: number;
  colors?: string[];
}

export function RadarChart({ 
  data, 
  width = 400, 
  height = 400,
  colors = ['#3b82f6', '#10b981', '#f59e0b']
}: RadarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 60;
  const angleStep = (2 * Math.PI) / data.length;

  // Calculate max value
  const maxValue = Math.max(...data.map(d => d.maxValue || d.value), 10);

  // Convert value to point
  const getPoint = (index: number, value: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const normalizedValue = value / maxValue;
    const r = radius * normalizedValue;
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
    };
  };

  // Create path for radar
  const createPath = (values: number[]) => {
    if (values.length === 0) return '';
    
    const firstPoint = getPoint(0, values[0]);
    let path = `M ${firstPoint.x} ${firstPoint.y}`;
    
    for (let i = 1; i < values.length; i++) {
      const point = getPoint(i, values[i]);
      path += ` L ${point.x} ${point.y}`;
    }
    
    path += ' Z';
    return path;
  };

  const values = data.map(d => d.value);

  return (
    <div className="relative" style={{ width, height }}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Grid circles */}
        {[0.25, 0.5, 0.75, 1].map((scale) => {
          const r = radius * scale;
          return (
            <circle
              key={scale}
              cx={centerX}
              cy={centerY}
              r={r}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
              opacity="0.5"
            />
          );
        })}

        {/* Grid lines */}
        {data.map((_, index) => {
          const angle = index * angleStep - Math.PI / 2;
          const endX = centerX + radius * Math.cos(angle);
          const endY = centerY + radius * Math.sin(angle);
          
          return (
            <line
              key={index}
              x1={centerX}
              y1={centerY}
              x2={endX}
              y2={endY}
              stroke="#e5e7eb"
              strokeWidth="1"
              opacity="0.5"
            />
          );
        })}

        {/* Radar area */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.3 }}
          transition={{ duration: 1.5 }}
          d={createPath(values)}
          fill={colors[0]}
          stroke={colors[0]}
          strokeWidth="2"
        />

        {/* Data points */}
        {data.map((item, index) => {
          const point = getPoint(index, item.value);
          return (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r={4}
                fill={colors[0]}
                stroke="white"
                strokeWidth="2"
              />
              
              {/* Label */}
              <text
                x={point.x}
                y={point.y - 15}
                textAnchor="middle"
                className="text-xs fill-gray-700 font-semibold"
              >
                {item.value}
              </text>
              
              {/* Axis label */}
              {(() => {
                const angle = index * angleStep - Math.PI / 2;
                const labelX = centerX + (radius + 30) * Math.cos(angle);
                const labelY = centerY + (radius + 30) * Math.sin(angle);
                return (
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    className="text-xs fill-gray-600"
                    alignmentBaseline="middle"
                  >
                    {item.label}
                  </text>
                );
              })()}
            </g>
          );
        })}
      </svg>
    </div>
  );
}











