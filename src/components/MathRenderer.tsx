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
      
      if (!disableMath && !processedContent.includes('$')) {
        // Pre-process common ascii math
        processedContent = processedContent.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
        processedContent = processedContent.replace(/<=/g, '\\le ');
        processedContent = processedContent.replace(/>=/g, '\\ge ');
        processedContent = processedContent.replace(/\(\s*([^()]+)\s*\)\s*\/\s*\(\s*([^()]+)\s*\)/g, '\\frac{$1}{$2}');
        processedContent = processedContent.replace(/\b(\d+)\s*\/\s*(\d+)\b/g, '\\frac{$1}{$2}');
        processedContent = processedContent.replace(/\^(\d{2,})/g, '^{$1}');
        processedContent = processedContent.replace(/\^\(([^)]+)\)/g, '^{$1}');

        let tokens = processedContent.split(/(\s+)/);
        let isMathToken = (t: string) => {
          if (!t.trim()) return false;
          if (/^[\^=<>≤≥]+$/.test(t)) return true;
          if (/\\(?:le|ge|sqrt|frac|pi|theta|alpha|beta|pm|times|div)/.test(t)) return true;
          if (t.includes('^') || t.includes('=')) return true;
          if (/^[()+\-*/.,?]+$/.test(t)) return true; // pure operators/punctuation
          if (/^[()]*[-+]?\d*\.?\d+[(),.?]*$/.test(t)) return true; // numbers with parens/punct
          if (/^[()]*[a-zA-Z][().,?]*$/.test(t)) return true; // single letters with parens/punct
          if (/^[a-zA-Z0-9()+\-*/.,?]+$/.test(t)) {
            // e.g. 7p, 5x, (6/7)p, (x-4)
            if (!/[\d()+\*/\\]/.test(t)) {
              if (/^[a-zA-Z]-[a-zA-Z][.,?]*$/.test(t)) return true;
              return false;
            }
            return true;
          }
          return false;
        };

        let isAllMath = tokens.every(t => !t.trim() || isMathToken(t));
        
        if (isAllMath && processedContent.length < 100) {
          processedContent = `$${processedContent}$`;
        } else {
          let result = '';
          let currentMathSeq: string[] = [];
          let currentHasStrong = false;

          let isStrongMathToken = (t: string) => {
            if (/[\^=<>≤≥]|\\(?:le|ge|sqrt|frac|pi|theta|alpha|beta)/.test(t)) return true;
            if (/^(?=.*\d)(?=.*[a-zA-Z])[a-zA-Z0-9()]+[.,?]*$/.test(t)) return true; // e.g. 7p, 5x
            if (/(?:[a-zA-Z].*[\+\-\*/])|(?:[\+\-\*/].*[a-zA-Z])/.test(t)) return true; // e.g. x-4, x+y
            return false;
          };

          const flushMath = () => {
            if (currentMathSeq.length > 0) {
              let seqStr = currentMathSeq.join('');
              if (currentHasStrong) {
                let trailingSpace = seqStr.match(/\s+$/)?.[0] || '';
                let core = seqStr.substring(0, seqStr.length - trailingSpace.length);
                let punctuation = '';
                let match = core.match(/[.,?]+$/);
                if (match) {
                  punctuation = match[0];
                  core = core.substring(0, core.length - punctuation.length);
                }
                result += `$${core}$${punctuation}${trailingSpace}`;
              } else {
                result += seqStr;
              }
              currentMathSeq = [];
              currentHasStrong = false;
            }
          };

          for (let token of tokens) {
            if (token.trim() === '') {
              if (currentMathSeq.length > 0) currentMathSeq.push(token);
              else result += token;
            } else if (isMathToken(token)) {
              currentMathSeq.push(token);
              if (isStrongMathToken(token)) currentHasStrong = true;
            } else {
              flushMath();
              result += token;
            }
          }
          flushMath();
          processedContent = result;
        }
      } else if (!processedContent.includes('$')) {
        // Fallback for verbal/other if they happen to have explicit LaTeX
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
