// Copyright 2025 varun
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     https://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from 'react';

interface ShimmerProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean | 'full';
}

export function Shimmer({ className = '', width, height, rounded = false }: ShimmerProps) {
  let widthClass = '';
  let widthStyle: React.CSSProperties | undefined = undefined;
  
  if (width) {
    if (typeof width === 'number') {
      widthStyle = { width: `${width}px` };
    } else {
      widthClass = width;
    }
  } else {
    widthClass = 'w-full';
  }
  
  let heightClass = '';
  let heightStyle: React.CSSProperties | undefined = undefined;
  
  if (height) {
    if (typeof height === 'number') {
      heightStyle = { height: `${height}px` };
    } else {
      heightClass = height;
    }
  } else {
    heightClass = 'h-4';
  }
  
  let roundedClass = '';
  if (rounded === true) {
    roundedClass = 'rounded';
  } else if (rounded === 'full') {
    roundedClass = 'rounded-full';
  }

  return (
    <div
      className={`bg-gray-200 animate-pulse ${widthClass} ${heightClass} ${roundedClass} ${className}`}
      style={{ ...widthStyle, ...heightStyle }}
    />
  );
}

// Pre-built shimmer components for common patterns
export function CardShimmer() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100">
      <Shimmer height="h-6" width="w-3/4" className="mb-4" />
      <Shimmer height="h-4" width="w-full" className="mb-2" />
      <Shimmer height="h-4" width="w-5/6" />
    </div>
  );
}

export function TableRowShimmer() {
  return (
    <tr className="border-b">
      <td className="py-3 px-4"><Shimmer height="h-4" width="w-24" /></td>
      <td className="py-3 px-4"><Shimmer height="h-4" width="w-20" /></td>
      <td className="py-3 px-4"><Shimmer height="h-4" width="w-16" /></td>
      <td className="py-3 px-4"><Shimmer height="h-4" width="w-16" /></td>
    </tr>
  );
}

export function ButtonShimmer() {
  return <Shimmer height="h-10" width="w-32" rounded className="mx-auto" />;
}

export function TestQuestionShimmer() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4">
      <Shimmer height="h-6" width="w-1/4" className="mb-4" />
      <Shimmer height="h-20" width="w-full" className="mb-4" />
      <div className="space-y-3">
        <Shimmer height="h-12" width="w-full" rounded />
        <Shimmer height="h-12" width="w-full" rounded />
        <Shimmer height="h-12" width="w-full" rounded />
        <Shimmer height="h-12" width="w-full" rounded />
      </div>
    </div>
  );
}

