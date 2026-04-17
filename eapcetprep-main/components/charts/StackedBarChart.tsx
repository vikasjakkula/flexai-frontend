"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';

interface StackedData {
  label: string;
  values: { label: string; value: number; color: string }[];
  tooltip?: any;
}

interface StackedBarChartProps {
  data: StackedData[];
  width?: number;
  height?: number;
  showTooltip?: boolean;
  valueUnit?: string;
}

export function StackedBarChart({ 
  data, 
  width = 600, 
  height = 300, 
  showTooltip = true,
  valueUnit = ''
}: StackedBarChartProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  const padding = 60;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  // Calculate max total value
  const maxTotal = Math.max(...data.map(d => 
    d.values.reduce((sum, v) => sum + v.value, 0)
  ), 10);

  const barWidth = chartWidth / data.length;
  const barSpacing = barWidth * 0.2;

  return (
    <div className="relative" style={{ width, height }}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Grid lines */}
        {Array.from({ length: 5 }).map((_, i) => {
          const y = padding + (chartHeight / 4) * i;
          return (
            <line
              key={i}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="2,2"
              opacity="0.5"
            />
          );
        })}

        {/* Stacked bars */}
        {data.map((item, index) => {
          const barX = padding + index * barWidth;
          const totalValue = item.values.reduce((sum, v) => sum + v.value, 0);
          let currentY = height - padding;
          const isHovered = hoveredBar === index;

          return (
            <g key={index}>
              {item.values.map((segment, segIndex) => {
                const segmentHeight = (segment.value / maxTotal) * chartHeight;
                currentY -= segmentHeight;
                
                return (
                  <motion.rect
                    key={segIndex}
                    initial={{ height: 0, y: height - padding }}
                    animate={{ 
                      height: segmentHeight,
                      y: currentY
                    }}
                    transition={{ duration: 0.8, delay: index * 0.1 + segIndex * 0.05 }}
                    x={barX + barSpacing / 2}
                    y={currentY}
                    width={barWidth - barSpacing}
                    height={segmentHeight}
                    fill={segment.color}
                    opacity={isHovered ? 0.9 : 1}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredBar(index)}
                    onMouseLeave={() => setHoveredBar(null)}
                  />
                );
              })}
              
              <text
                x={barX + barWidth / 2}
                y={height - padding + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {item.label}
              </text>
            </g>
          );
        })}

        {/* Y-axis labels */}
        {Array.from({ length: 5 }).map((_, i) => {
          const value = (maxTotal / 4) * i;
          const y = height - padding - (chartHeight / 4) * i;
          return (
            <text
              key={i}
              x={padding - 10}
              y={y + 4}
              textAnchor="end"
              className="text-xs fill-gray-600"
            >
              {Math.round(value)}
            </text>
          );
        })}
      </svg>

      {/* Tooltip */}
      {showTooltip && hoveredBar !== null && data[hoveredBar] && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-10 pointer-events-none"
          style={{
            left: `${padding + hoveredBar * barWidth + barWidth / 2}px`,
            top: `${height - padding - 100}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-semibold mb-2">{data[hoveredBar].label}</div>
          {data[hoveredBar].values.map((segment, i) => (
            <div key={i} className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded" 
                style={{ backgroundColor: segment.color }}
              />
              <span>{segment.label}: {segment.value}{valueUnit ? ` ${valueUnit}` : ''}</span>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

