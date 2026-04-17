"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';

interface BarData {
  label: string;
  value: number;
  color?: string;
  tooltip?: any;
}

interface BarChartProps {
  data: BarData[];
  width?: number;
  height?: number;
  showTooltip?: boolean;
  horizontal?: boolean;
  valueUnit?: string;
  showXAxisLabels?: boolean;
}

export function BarChart({ 
  data, 
  width = 600, 
  height = 300, 
  showTooltip = true,
  horizontal = false,
  valueUnit = '',
  showXAxisLabels = true
}: BarChartProps) {
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

  const maxValue = Math.max(...data.map(d => d.value), 10);

  if (horizontal) {
    const barHeight = chartHeight / data.length;
    const barSpacing = barHeight * 0.2;

    return (
      <div className="relative" style={{ width, height }}>
        <svg width={width} height={height} className="overflow-visible">
          {/* Grid lines */}
          {Array.from({ length: 5 }).map((_, i) => {
            const x = padding + (chartWidth / 4) * i;
            return (
              <line
                key={i}
                x1={x}
                y1={padding}
                x2={x}
                y2={height - padding}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="2,2"
                opacity="0.5"
              />
            );
          })}

          {/* Bars */}
          {data.map((item, index) => {
            const barY = padding + index * barHeight;
            const barWidth = (item.value / maxValue) * chartWidth;
            const isHovered = hoveredBar === index;

            return (
              <g key={index}>
                <motion.rect
                  initial={{ width: 0 }}
                  animate={{ width: barWidth }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  x={padding}
                  y={barY + barSpacing / 2}
                  width={barWidth}
                  height={barHeight - barSpacing}
                  fill={item.color || '#3b82f6'}
                  opacity={isHovered ? 0.8 : 1}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                />
                <text
                  x={padding - 10}
                  y={barY + barHeight / 2}
                  textAnchor="end"
                  className="text-xs fill-gray-700"
                  alignmentBaseline="middle"
                >
                  {item.label}
                </text>
                <text
                  x={padding + barWidth + 10}
                  y={barY + barHeight / 2}
                  className="text-xs fill-gray-700 font-semibold"
                  alignmentBaseline="middle"
                >
                  {item.value}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {Array.from({ length: 5 }).map((_, i) => {
            const value = (maxValue / 4) * i;
            const x = padding + (chartWidth / 4) * i;
            return (
              <text
                key={i}
                x={x}
                y={height - padding + 20}
                textAnchor="middle"
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
              left: `${padding + (data[hoveredBar].value / maxValue) * chartWidth}px`,
              top: `${padding + hoveredBar * barHeight}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-semibold">{data[hoveredBar].label}</div>
            <div className="text-blue-300">{data[hoveredBar].value}{valueUnit ? ` ${valueUnit}` : ''}</div>
          </motion.div>
        )}
      </div>
    );
  }

  // Vertical bars
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

        {/* Bars */}
        {data.map((item, index) => {
          const barX = padding + index * barWidth;
          const barHeight = (item.value / maxValue) * chartHeight;
          const isHovered = hoveredBar === index;

          return (
            <g key={index}>
              <motion.rect
                initial={{ height: 0 }}
                animate={{ height: barHeight }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                x={barX + barSpacing / 2}
                y={height - padding - barHeight}
                width={barWidth - barSpacing}
                height={barHeight}
                fill={item.color || '#3b82f6'}
                opacity={isHovered ? 0.8 : 1}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredBar(index)}
                onMouseLeave={() => setHoveredBar(null)}
              />
              {showXAxisLabels && (
                <text
                  x={barX + barWidth / 2}
                  y={height - padding + 20}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {item.label}
                </text>
              )}
              {barHeight > 20 && (
                <text
                  x={barX + barWidth / 2}
                  y={height - padding - barHeight - 5}
                  textAnchor="middle"
                  className="text-xs fill-gray-700 font-semibold"
                >
                  {item.value}
                </text>
              )}
            </g>
          );
        })}

        {/* Y-axis labels */}
        {Array.from({ length: 5 }).map((_, i) => {
          const value = (maxValue / 4) * i;
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
            top: `${height - padding - (data[hoveredBar].value / maxValue) * chartHeight - 60}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-semibold">{data[hoveredBar].label}</div>
          <div className="text-blue-300">{data[hoveredBar].value}{valueUnit ? ` ${valueUnit}` : ''}</div>
        </motion.div>
      )}
    </div>
  );
}

