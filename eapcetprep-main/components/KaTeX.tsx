'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface InlineMathProps {
  math: string;
  [key: string]: any;
}

interface BlockMathProps {
  math: string;
  [key: string]: any;
}

/**
 * Renders inline LaTeX math expressions
 * Compatible with React 19 - uses katex directly instead of react-katex
 */
export function InlineMath({ math, ...props }: InlineMathProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current || !math) return;

    try {
      // Clear previous content before rendering
      ref.current.innerHTML = '';
      katex.render(math, ref.current, {
        throwOnError: false,
        displayMode: false,
      });
    } catch (error) {
      console.error('KaTeX rendering error:', error);
      if (ref.current) {
        ref.current.textContent = math;
      }
    }
  }, [math]);

  return <span ref={ref} {...props} />;
}

/**
 * Renders block LaTeX math expressions
 * Compatible with React 19 - uses katex directly instead of react-katex
 */
export function BlockMath({ math, ...props }: BlockMathProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !math) return;

    try {
      // Clear previous content before rendering
      ref.current.innerHTML = '';
      katex.render(math, ref.current, {
        throwOnError: false,
        displayMode: true,
      });
    } catch (error) {
      console.error('KaTeX rendering error:', error);
      if (ref.current) {
        ref.current.textContent = math;
      }
    }
  }, [math]);

  return <div ref={ref} {...props} />;
}

