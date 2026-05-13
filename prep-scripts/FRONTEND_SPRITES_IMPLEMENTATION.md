# Sprite CSS Implementation for EAMCET Test Frontend

This document explains how to load and display sprite-based images in your Next.js/React frontend for EAMCET test questions.

## Overview

The scraper uploads:
1. **Sprite sheets** (PNG) - Single images containing all option/solution graphics
2. **CSS files** - Defines classes with `background-position` to show correct portion of sprite

When a test is loaded, you fetch `sprite_css_url` from the `tests` table and dynamically inject it into the page.

---

## 1. Database Schema Update

Run this SQL in Supabase:

```sql
ALTER TABLE tests ADD COLUMN sprite_css_url TEXT;
```

---

## 2. Hook: `useSpriteCSS.ts`

Create this file in your `hooks` folder:

```typescript
// hooks/useSpriteCSS.ts
import { useEffect, useState } from 'react';

interface UseSpritesCSSReturn {
  loaded: boolean;
  error: string | null;
}

/**
 * Dynamically loads sprite CSS for a test
 * Injects a <link rel="stylesheet"> into document head
 * 
 * @param spriteCssUrl - The Supabase Storage URL to the sprite CSS file
 * @returns { loaded, error } - Loading state
 * 
 * @example
 * const { loaded } = useSpriteCSS(test.sprite_css_url);
 * if (!loaded) return <Loading />;
 */
export function useSpriteCSS(spriteCssUrl: string | null | undefined): UseSpritesCSSReturn {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // No sprite URL - nothing to load
    if (!spriteCssUrl) {
      setLoaded(true);
      return;
    }

    // Generate unique ID from URL to prevent duplicate injections
    const cssFilename = spriteCssUrl.split('/').pop()?.replace('.css', '') || 'sprite';
    const linkId = `sprite-css-${cssFilename}`;

    // Check if already loaded (from previous navigation)
    const existingLink = document.getElementById(linkId);
    if (existingLink) {
      setLoaded(true);
      return;
    }

    // Create and inject link element
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = spriteCssUrl;

    link.onload = () => {
      console.log(`[Sprites] ✓ Loaded: ${cssFilename}`);
      setLoaded(true);
    };

    link.onerror = () => {
      console.warn(`[Sprites] ✗ Failed to load: ${spriteCssUrl}`);
      setError(`Failed to load sprite CSS: ${cssFilename}`);
      setLoaded(true); // Continue anyway - text content will still show
    };

    document.head.appendChild(link);

    // Cleanup function (optional - keeping CSS cached is usually better)
    // return () => {
    //   const el = document.getElementById(linkId);
    //   if (el) document.head.removeChild(el);
    // };
  }, [spriteCssUrl]);

  return { loaded, error };
}
```

---

## 3. Component: `QuestionContent.tsx`

Create a reusable component to render HTML content safely:

```tsx
// components/QuestionContent.tsx
'use client';

interface QuestionContentProps {
  html: string;
  className?: string;
}

/**
 * Renders HTML content (questions, options, solutions)
 * Sprites render automatically when CSS is loaded
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
```

---

## 4. Usage in Test Page

Example of using the hook in your test page:

```tsx
// app/test/[testId]/page.tsx (or your test page component)
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useSpriteCSS } from '@/hooks/useSpriteCSS';
import { QuestionContent } from '@/components/QuestionContent';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Test {
  test_id: number;
  test_name: string;
  sprite_css_url: string | null;
}

interface Question {
  question_id: number;
  question_number: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  answer: string;
}

export default function TestPage({ params }: { params: { testId: string } }) {
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // ⭐ IMPORTANT: Load sprite CSS when test data is available
  const { loaded: spritesLoaded, error: spriteError } = useSpriteCSS(test?.sprite_css_url);

  useEffect(() => {
    async function fetchTestData() {
      try {
        // 1. Fetch test info (includes sprite_css_url)
        const { data: testData, error: testError } = await supabase
          .from('tests')
          .select('test_id, test_name, sprite_css_url')
          .eq('test_id', params.testId)
          .single();

        if (testError) throw testError;
        if (!testData) throw new Error('Test not found');

        setTest(testData);

        // 2. Fetch questions for this test
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select(`
            question_id,
            question_number,
            question_text,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_option,
            answer,
            sections!inner(test_id)
          `)
          .eq('sections.test_id', testData.test_id)
          .order('question_number');

        if (questionsError) throw questionsError;
        setQuestions(questionsData || []);

      } catch (err) {
        console.error('Error fetching test:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTestData();
  }, [params.testId]);

  // Show loading state while fetching data OR loading sprites
  if (loading || !spritesLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3">Loading test...</span>
      </div>
    );
  }

  if (!test) {
    return <div className="text-center p-8 text-red-500">Test not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{test.test_name}</h1>
      
      {spriteError && (
        <div className="bg-yellow-100 text-yellow-800 p-2 rounded mb-4 text-sm">
          Note: Some images may not display correctly
        </div>
      )}

      <div className="space-y-8">
        {questions.map((q) => (
          <div key={q.question_id} className="bg-white rounded-lg shadow p-6">
            {/* Question Header */}
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                Q{q.question_number}
              </span>
            </div>

            {/* Question Text - sprites render automatically */}
            <div className="mb-4">
              <QuestionContent html={q.question_text} />
            </div>

            {/* Options - sprites in options also render */}
            <div className="grid gap-3">
              {['A', 'B', 'C', 'D'].map((label) => {
                const optionKey = `option_${label.toLowerCase()}` as keyof Question;
                const optionHtml = q[optionKey] as string;
                
                return (
                  <label 
                    key={label}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input 
                      type="radio" 
                      name={`question-${q.question_id}`} 
                      value={label}
                      className="mt-1"
                    />
                    <span className="font-medium text-gray-600">{label})</span>
                    <div className="flex-1">
                      <QuestionContent html={optionHtml} />
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Solution (collapsible) */}
            <details className="mt-4 border-t pt-4">
              <summary className="cursor-pointer text-blue-600 font-medium">
                Show Solution (Answer: {q.correct_option})
              </summary>
              <div className="mt-3 p-4 bg-green-50 rounded-lg">
                <QuestionContent html={q.answer} />
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 5. Global CSS Styles

Add these base styles to your `globals.css`:

```css
/* ========================================
   SPRITE & MATH CONTENT STYLES
   ======================================== */

/* Base sprite class - sprites from Supabase CSS will extend this */
.sprite {
  display: inline-block;
  background-repeat: no-repeat;
  vertical-align: middle;
}

/* Question content container */
.question-content {
  font-size: 1rem;
  line-height: 1.6;
  word-wrap: break-word;
}

.question-content img {
  max-width: 100%;
  height: auto;
}

/* Math formula styles (fmath elements from scraped HTML) */
fmath,
.fm-math {
  font-family: STIXGeneral, 'DejaVu Serif', 'DejaVu Sans', Times, 'Times New Roman', serif;
  line-height: 1.2;
}

fmath mtext {
  line-height: normal;
}

.fm-mo,
.ma-sans-serif,
fmath mi[mathvariant*="sans-serif"],
fmath mn[mathvariant*="sans-serif"],
fmath mo,
fmath ms[mathvariant*="sans-serif"],
fmath mtext[mathvariant*="sans-serif"] {
  font-family: STIXGeneral, 'DejaVu Sans', 'DejaVu Serif', 'Arial Unicode MS', 'Lucida Grande', Times, sans-serif;
}

.fm-separator {
  padding: 0 0.56ex 0 0;
}

.fm-infix-loose {
  padding: 0 0.56ex;
}

.fm-infix {
  padding: 0 0.44ex;
}

.fm-vert,
fmath menclose {
  display: inline-block;
  vertical-align: middle;
}

.fm-large-op {
  font-size: 1.3em;
}

.fm-frac {
  padding: 0 1px !important;
}

td.fm-den-frac {
  border-top: solid thin !important;
}

.fm-root {
  font-size: 0.6em;
}

.fm-radicand {
  padding: 0 1px 0 0;
  border-top: solid;
  margin-top: 0.1em;
}

.fm-script {
  font-size: 0.71em;
}

fmath table,
fmath tbody,
fmath td,
fmath tr {
  border: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
}

fmath table {
  border-collapse: collapse !important;
  text-align: center !important;
}

td.fm-mtd {
  padding: 0.5ex 0.4em !important;
  vertical-align: baseline !important;
}
```

---

## 6. How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  1. User navigates to /test/123                             │
├─────────────────────────────────────────────────────────────┤
│  2. Component fetches from Supabase:                        │
│     SELECT test_name, sprite_css_url FROM tests             │
│     WHERE test_id = 123                                     │
│                                                             │
│     Returns:                                                │
│     {                                                       │
│       test_name: "TG EAMCET 2 May 2025 Shift 1",           │
│       sprite_css_url: "https://xxx.supabase.co/.../x.css"  │
│     }                                                       │
├─────────────────────────────────────────────────────────────┤
│  3. useSpriteCSS hook injects:                              │
│     <link rel="stylesheet" href="...sprite.css">           │
│                                                             │
│     CSS contains rules like:                                │
│     .sprite { display: inline-block; }                      │
│     .tg_eap_2_may_2025_s1_q_138a {                         │
│       background-image: url('https://.../sprite.png');     │
│       background-position: -10px -500px;                    │
│       width: 200px;                                         │
│       height: 50px;                                         │
│     }                                                       │
├─────────────────────────────────────────────────────────────┤
│  4. Questions are fetched and rendered                      │
│     HTML contains: <span class="sprite tg_eap..."></span>  │
│                                                             │
│  5. Browser applies CSS → Sprite images appear!             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Troubleshooting

### Sprites not showing?

1. **Check browser DevTools Network tab** - Is the CSS file loading? (200 status)
2. **Check DevTools Elements tab** - Does the `<link>` element exist in `<head>`?
3. **Check if sprite classes exist** - Inspect the element, see if background-image is applied
4. **CORS issues?** - Make sure Supabase bucket is public

### CSS loaded but images broken?

1. **Check sprite PNG URL** - Is it accessible?
2. **Bucket permissions** - Ensure `images` bucket is set to public in Supabase

### Testing locally

```javascript
// Quick test in browser console
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://bnnpmfdnsngxhxydvecx.supabase.co/storage/v1/object/public/images/sprites/tg_eamcet_2_may_2025_shift_1_paper.css';
document.head.appendChild(link);
// Check if sprites appear after this
```

---

## 8. File Structure

```
your-nextjs-app/
├── app/
│   ├── globals.css          # Add sprite & math styles here
│   └── test/
│       └── [testId]/
│           └── page.tsx     # Test page using useSpriteCSS
├── components/
│   └── QuestionContent.tsx  # Reusable HTML content renderer
├── hooks/
│   └── useSpriteCSS.ts      # Dynamic CSS loader hook
└── ...
```

---

## 9. Quick Copy-Paste Checklist

- [ ] Run SQL: `ALTER TABLE tests ADD COLUMN sprite_css_url TEXT;`
- [ ] Create `hooks/useSpriteCSS.ts`
- [ ] Create `components/QuestionContent.tsx`
- [ ] Add sprite/math styles to `globals.css`
- [ ] Update test page to use `useSpriteCSS(test?.sprite_css_url)`
- [ ] Run `upload_to_supabase.py` to populate `sprite_css_url` column













