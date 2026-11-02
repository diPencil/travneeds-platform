/**
 * TravNeeds Modular Platform — Safe Rich Text Display Renderer
 *
 * Lightweight reader component that safely renders HTML or legacy plain text.
 * DOES NOT import or bundle any Tiptap editor code on public pages.
 */

import React from 'react';
import { sanitizeRichText, isHtmlContent } from '@/lib/rich-text';
import { cn } from '@/lib/utils';

export interface RichTextRendererProps {
  content: string | readonly string[] | string[] | null | undefined;
  className?: string;
  dir?: 'ltr' | 'rtl' | 'auto';
  fallbackTag?: 'p' | 'div';
}

export function RichTextRenderer({
  content,
  className,
  dir,
  fallbackTag: FallbackTag = 'div',
}: RichTextRendererProps) {
  if (!content) return null;

  // If array of strings (e.g. legacy overview paragraphs: string[])
  if (Array.isArray(content)) {
    const rawJoined = content.join('\n\n');
    if (!isHtmlContent(rawJoined)) {
      return (
        <div className={cn('rich-text-content plain-text-paragraphs', className)} dir={dir}>
          {content.map((p, index) => (
            <p key={index}>{p}</p>
          ))}
        </div>
      );
    }
    // Array containing HTML
    const sanitizedHtml = sanitizeRichText(content.join(''));
    return (
      <div
        className={cn('rich-text-content', className)}
        dir={dir}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  }

  // Single string
  if (typeof content === 'string') {
    if (!isHtmlContent(content)) {
      // Legacy plain text: split newlines into paragraphs or render with pre-line
      const paragraphs = content.split(/\r?\n\r?\n/).filter(Boolean);
      if (paragraphs.length > 1) {
        return (
          <div className={cn('rich-text-content plain-text-paragraphs', className)} dir={dir}>
            {paragraphs.map((p, index) => (
              <p key={index}>{p}</p>
            ))}
          </div>
        );
      }
      return (
        <FallbackTag
          className={cn('rich-text-content plain-text-content', className)}
          dir={dir}
          style={{ whiteSpace: 'pre-line' }}
        >
          {content}
        </FallbackTag>
      );
    }

    // Sanitized HTML rendering
    const sanitizedHtml = sanitizeRichText(content);
    return (
      <div
        className={cn('rich-text-content', className)}
        dir={dir}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  }

  return null;
}

