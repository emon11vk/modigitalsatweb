import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  content: string;
  className?: string;
  isDark?: boolean;
  disableMath?: boolean;
}

/**
 * Parses text for inline ($...$) and display ($$...$$) math and renders using KaTeX
 * Falls back to plain text rendering if content has no math formulas
 */
export default function MathRenderer({ content, className = '', isDark = true, disableMath = false }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content) {
      if (containerRef.current) {
        containerRef.current.textContent = content || '';
      }
      return;
    }

    if (disableMath) {
      containerRef.current.textContent = content;
      return;
    }

    try {
      let processedContent = content;
      // Auto-wrap raw LaTeX if no $ exists but it contains explicit math commands (excluding _ to prevent wrapping text)
      if (!processedContent.includes('$')) {
        if (/(\\(frac|left|right|sqrt|sum|int|alpha|beta|theta|pi|mu|sigma|Delta|text|textbf|pm|times|div|approx|neq|leq|geq))/.test(processedContent)) {
          processedContent = `$${processedContent}$`;
        }
      }

      // Parse and render math formulas
      // We prevent inline math from matching across sentence boundaries (. ? !) to avoid pairing currency $ with stray $
      const regex = /(\$\$[\s\S]*?\$\$|\$(?!\s)(?:(?!\.\s|\?\s|\!\s)[^$\n])*?(?:[^\s$])?\$)/g;
      const hasMath = regex.test(processedContent);
      
      // Reset regex for actual parsing (test consumes the regex)
      const parseRegex = /(\$\$[\s\S]*?\$\$|\$(?!\s)(?:(?!\.\s|\?\s|\!\s)[^$\n])*?(?:[^\s$])?\$)/g;
      
      if (!hasMath) {
        // No math formulas, just render as plain text
        containerRef.current.textContent = processedContent;
        return;
      }

      const parts = processedContent.split(parseRegex);
      
      containerRef.current.innerHTML = '';

      parts.forEach((part) => {
        if (!part) return;

        if (part.startsWith('$$') && part.endsWith('$$')) {
          // Display math
          const mathContent = part.slice(2, -2).trim();
          const div = document.createElement('div');
          div.style.margin = '1em 0';
          div.style.textAlign = 'center';
          div.style.overflow = 'auto';
          try {
            katex.render(mathContent, div, {
              throwOnError: false,
              displayMode: true,
            });
          } catch (err) {
            div.textContent = part; // Fallback to raw text if KaTeX fails
            div.style.color = isDark ? '#ef4444' : '#dc2626';
            div.style.fontSize = '0.875rem';
          }
          containerRef.current?.appendChild(div);
        } else if (part.startsWith('$') && part.endsWith('$') && part.length > 1) {
          // Inline math
          const mathContent = part.slice(1, -1).trim();
          if (mathContent) {
            const span = document.createElement('span');
            span.style.display = 'inline';
            try {
              katex.render(mathContent, span, {
                throwOnError: false,
                displayMode: false,
              });
            } catch (err) {
              span.textContent = part; // Fallback to raw text if KaTeX fails
              span.style.color = isDark ? '#ef4444' : '#dc2626';
            }
            containerRef.current?.appendChild(span);
          } else {
            // Empty math expression
            containerRef.current?.appendChild(document.createTextNode(part));
          }
        } else {
          // Regular text
          const textNode = document.createTextNode(part);
          containerRef.current?.appendChild(textNode);
        }
      });
    } catch (err) {
      console.error('Error rendering math:', err);
      if (containerRef.current) {
        containerRef.current.textContent = content;
      }
    }
  }, [content, isDark]);

  return (
    <div
      ref={containerRef}
      className={`${className}`}
      style={{
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
      }}
    />
  );
}
