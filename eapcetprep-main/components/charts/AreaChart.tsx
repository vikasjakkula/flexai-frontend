"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
  x: number;
  y: number;
  label?: string;
  tooltip?: {
    testName?: string;
    date?: string;
    attemptNumber?: number;
    score?: number;
  };
}

interface AreaChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  showTooltip?: boolean;
  showXAxisLabels?: boolean;
}

export function AreaChart({ 
  data, 
  width = 600, 
  height = 300, 
  color = '#3b82f6',
  showTooltip = true,
  showXAxisLabels = true
}: AreaChartProps) {
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

  // Calculate min/max for scaling
  const minX = Math.min(...data.map(d => d.x));
  const maxX = Math.max(...data.map(d => d.x));
  const minY = 0;
  const maxY = Math.max(...data.map(d => d.y), 160);

  const scaleX = (value: number) => {
    if (maxX === minX) return padding;
    return padding + ((value - minX) / (maxX - minX)) * chartWidth;
  };

  const scaleY = (value: number) => {
    if (maxY === minY) return height - padding;
    return height - padding - ((value - minY) / (maxY - minY)) * chartHeight;
  };

  // Create path for area
  const createAreaPath = () => {
    if (data.length === 0) return '';
    
    let path = `M ${scaleX(data[0].x)} ${scaleY(data[0].y)}`;
    
    for (let i = 1; i < data.length; i++) {
      const x = scaleX(data[i].x);
      const y = scaleY(data[i].y);
      path += ` L ${x} ${y}`;
    }
    
    // Close the area
    path += ` L ${scaleX(data[data.length - 1].x)} ${height - padding}`;
    path += ` L ${scaleX(data[0].x)} ${height - padding}`;
    path += ' Z';
    
    return path;
  };

  // Create path for line
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
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 25, 50, 75, 100, 125, 150].map((y) => {
          const yPos = scaleY(y);
          return (
            <line
              key={y}
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

        {/* Area */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          d={createAreaPath()}
          fill="url(#areaGradient)"
        />

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
              
              {/* Invisible larger hit area */}
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
        {[0, 40, 80, 120, 160].map((y) => {
          const yPos = scaleY(y);
          return (
            <text
              key={y}
              x={padding - 10}
              y={yPos + 4}
              textAnchor="end"
              className="text-xs fill-gray-600"
            >
              {y}
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
      {showTooltip && hoveredData && hoveredData.tooltip && (
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
          <div className="font-semibold mb-1">
            {hoveredData.tooltip.testName || `Test ${hoveredData.x}`}
          </div>
          {hoveredData.tooltip.date && (
            <div className="text-gray-300">Date: {hoveredData.tooltip.date}</div>
          )}
          {hoveredData.tooltip.attemptNumber && (
            <div className="text-gray-300">Attempt: {hoveredData.tooltip.attemptNumber}</div>
          )}
          {hoveredData.tooltip.score !== undefined && (
            <div className="text-blue-300 font-semibold mt-1">
              Score: {hoveredData.tooltip.score} / 160
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}




