"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
  x: number;
  y: number;
  label?: string;
  tooltip?: any;
}

interface LineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  showTooltip?: boolean;
  yAxisLabel?: string;
  xAxisLabel?: string;
  maxY?: number;
  valueUnit?: string;
  showXAxisLabels?: boolean;
}

export function LineChart({ 
  data, 
  width = 600, 
  height = 300, 
  color = '#3b82f6',
  showTooltip = true,
  yAxisLabel,
  xAxisLabel,
  maxY,
  valueUnit = '',
  showXAxisLabels = true
}: LineChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  
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

  const minX = Math.min(...data.map(d => d.x));
  const maxX = Math.max(...data.map(d => d.x));
  const minY = 0;
  const calculatedMaxY = Math.max(...data.map(d => d.y));
  const finalMaxY = maxY || Math.max(calculatedMaxY, 10);

  const scaleX = (value: number) => {
    if (maxX === minX) return padding;
    return padding + ((value - minX) / (maxX - minX)) * chartWidth;
  };

  const scaleY = (value: number) => {
    if (finalMaxY === minY) return height - padding;
    return height - padding - ((value - minY) / (finalMaxY - minY)) * chartHeight;
  };

  const createLinePath = () => {
    if (data.length === 0) return '';
    
    let path = `M ${scaleX(data[0].x)} ${scaleY(data[0].y)}`;
    
    for (let i = 1; i < data.length; i++) {
      const x = scaleX(data[i].x);
      const y = scaleY(data[i].y);
      path += ` L ${x} ${y}`;
    }
    
    return path;
  };

  const hoveredData = hoveredPoint !== null ? data[hoveredPoint] : null;

  return (
    <div className="relative" style={{ width, height }}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Grid lines */}
        {Array.from({ length: 5 }).map((_, i) => {
          const y = (finalMaxY / 4) * i;
          const yPos = scaleY(y);
          return (
            <line
              key={i}
              x1={padding}
              y1={yPos}
              x2={width - padding}
              y2={yPos}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="2,2"
              opacity="0.5"
            />
          );
        })}

        {/* Line */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          d={createLinePath()}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Data points */}
        {data.map((point, index) => {
          const x = scaleX(point.x);
          const y = scaleY(point.y);
          const isHovered = hoveredPoint === index;
          
          return (
            <g key={index}>
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 6 : 4}
                fill={color}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(index)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              
              <circle
                cx={x}
                cy={y}
                r={12}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(index)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          );
        })}

        {/* Y-axis labels */}
        {Array.from({ length: 5 }).map((_, i) => {
          const y = (finalMaxY / 4) * i;
          const yPos = scaleY(y);
          return (
            <text
              key={i}
              x={padding - 10}
              y={yPos + 4}
              textAnchor="end"
              className="text-xs fill-gray-600"
            >
              {Math.round(y)}
            </text>
          );
        })}

        {/* X-axis labels */}
        {showXAxisLabels && data.map((point, index) => {
          if (index % Math.ceil(data.length / 6) !== 0 && index !== data.length - 1) return null;
          const x = scaleX(point.x);
          return (
            <text
              key={index}
              x={x}
              y={height - padding + 20}
              textAnchor="middle"
              className="text-xs fill-gray-600"
            >
              {point.label || `Test ${index + 1}`}
            </text>
          );
        })}
      </svg>

      {/* Tooltip */}
      {showTooltip && hoveredData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-10 pointer-events-none"
          style={{
            left: `${scaleX(hoveredData.x)}px`,
            top: `${scaleY(hoveredData.y) - 60}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {hoveredData.tooltip ? (
            <>
              {hoveredData.tooltip.label && (
                <div className="font-semibold mb-1">{hoveredData.tooltip.label}</div>
              )}
              <div className="text-blue-300 font-semibold">{hoveredData.y}{valueUnit ? ` ${valueUnit}` : ''}</div>
            </>
          ) : (
            <div className="font-semibold">{hoveredData.y}{valueUnit ? ` ${valueUnit}` : ''}</div>
          )}
        </motion.div>
      )}
    </div>
  );
}

