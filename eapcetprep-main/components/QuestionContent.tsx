// components/QuestionContent.tsx
// Renders HTML content (questions, options, solutions) with sprite support

'use client';

interface QuestionContentProps {
  html: string;
  className?: string;
}

/**
 * Renders HTML content (questions, options, solutions)
 * Sprites render automatically when CSS is loaded via useSpriteCSS hook
 * 
 * @param html - The HTML content to render (may contain sprite spans)
 * @param className - Optional additional CSS classes
 * 
 * @example
 * <QuestionContent html={question.question_text} />
 * <QuestionContent html={question.option_a} className="text-sm" />
 */
export function QuestionContent({ html, className = '' }: QuestionContentProps) {
  if (!html) return null;
  
  return (
    <div
      className={`question-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default QuestionContent;



















