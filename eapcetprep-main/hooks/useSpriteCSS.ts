// hooks/useSpriteCSS.ts
// Dynamically loads sprite CSS for test images

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



















