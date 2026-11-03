'use client';

/**
 * TravNeeds Modular Platform — Tiptap 3 Safe Rich Text Editor Component
 *
 * Implements:
 * - Bold, italic, underline
 * - Paragraphs and H2/H3 headings via Format Select Dropdown
 * - Bulleted and numbered lists with visible styled markers
 * - Modern inline Link Popover Dialog (no native window.prompt)
 * - Real-time reactive toolbar with active states for Align Left/Center/Right
 * - Undo & redo
 * - Clear formatting (Tx glyph)
 * - Safe Word / website paste normalization
 * - Distinct toolbar card + separate rounded content container with focus state
 * - Robust focus management: toolbar actions execute onMouseDown to preserve
 *   the text selection and prevent focus loss.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeRichText, isHtmlContent } from '@/lib/rich-text';

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string | number;
  dir?: 'ltr' | 'rtl' | 'auto';
  disabled?: boolean;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = '150px',
  dir = 'auto',
  disabled = false,
  className,
}: RichTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [, setTick] = useState(0);

  // Modern link popover state
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  // Normalize initial content
  const initialContent = React.useMemo(() => {
    if (!value) return '';
    if (isHtmlContent(value)) {
      return sanitizeRichText(value);
    }
    // Convert plain text newlines into paragraphs for editor editing
    return value
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map((line) => `<p>${line.trim()}</p>`)
      .join('');
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
        dropcursor: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
        validate: (href) => /^https?:\/\//i.test(href) || /^mailto:/i.test(href) || /^tel:/i.test(href),
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write here...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: initialContent,
    editable: !disabled,
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    onTransaction: () => {
      // Force toolbar re-render on any editor state change or selection move
      setTick((t) => t + 1);
    },
    onSelectionUpdate: () => {
      setTick((t) => t + 1);
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // If editor only has an empty paragraph, send empty string
      if (html === '<p></p>' || html === '') {
        onChange('');
      } else {
        onChange(sanitizeRichText(html));
      }
    },
  });

  // Keep editor content in sync when value changes from outside (e.g. locale tab switch)
  const lastSetContent = useRef(initialContent);
  useEffect(() => {
    if (!editor) return;

    // NEVER overwrite editor state from props while user is actively typing in it!
    if (editor.isFocused) {
      return;
    }

    const currentHtml = editor.getHTML();
    const normalizedNew = isHtmlContent(value)
      ? sanitizeRichText(value)
      : value
          ? value
              .split(/\r?\n/)
              .filter(Boolean)
              .map((line) => `<p>${line.trim()}</p>`)
              .join('')
          : '';

    if (normalizedNew !== currentHtml && normalizedNew !== lastSetContent.current) {
      lastSetContent.current = normalizedNew;
      editor.commands.setContent(normalizedNew, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div
        style={{
          minHeight,
          border: '1.5px solid var(--border)',
          borderRadius: '14px',
          background: '#fff',
          padding: '16px',
          color: 'var(--muted)',
          fontSize: '13px',
        }}
      >
        Loading editor...
      </div>
    );
  }

  const openLinkPopover = () => {
    const existing = editor.getAttributes('link')?.href || '';
    setLinkUrl(existing || 'https://');
    setLinkPopoverOpen(true);
  };

  const applyLink = () => {
    const clean = linkUrl.trim();
    if (!clean || clean === 'https://' || clean === 'http://') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      const href = /^https?:\/\//i.test(clean) || /^mailto:/i.test(clean) || /^tel:/i.test(clean)
        ? clean
        : `https://${clean}`;
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    setLinkPopoverOpen(false);
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setLinkPopoverOpen(false);
  };

  const activeFormat = editor.isActive('heading', { level: 2 })
    ? 'h2'
    : editor.isActive('heading', { level: 3 })
    ? 'h3'
    : 'p';

  const isCenterAlign = editor.isActive({ textAlign: 'center' });
  const isRightAlign = editor.isActive({ textAlign: 'right' });
  const isLeftAlign = editor.isActive({ textAlign: 'left' }) || (!isCenterAlign && !isRightAlign);

  return (
    <div className={cn('sp-rich-editor-wrapper', className, disabled && 'disabled')}>
      {/* Top Standalone Toolbar Card */}
      <div className="sp-editor-toolbar" role="toolbar" aria-label="Text editor toolbar" style={{ position: 'relative' }}>
        {/* Paragraph / Headings Select Dropdown */}
        <div className="sp-format-select-container">
          <select
            value={activeFormat}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'h2') {
                editor.chain().focus().toggleHeading({ level: 2 }).run();
              } else if (val === 'h3') {
                editor.chain().focus().toggleHeading({ level: 3 }).run();
              } else {
                editor.chain().focus().setParagraph().run();
              }
            }}
            className="sp-format-select"
            disabled={disabled}
            aria-label="Text formatting style"
          >
            <option value="p">Paragraph</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
          <ChevronDown size={14} className="sp-format-select-icon" aria-hidden="true" />
        </div>

        {/* Bold */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBold().run();
          }}
          className={cn('sp-toolbar-btn', editor.isActive('bold') && 'active')}
          disabled={disabled}
          title="Bold"
          aria-label="Bold"
        >
          <Bold size={15} />
        </button>

        {/* Italic */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleItalic().run();
          }}
          className={cn('sp-toolbar-btn', editor.isActive('italic') && 'active')}
          disabled={disabled}
          title="Italic"
          aria-label="Italic"
        >
          <Italic size={15} />
        </button>

        {/* Underline */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleUnderline().run();
          }}
          className={cn('sp-toolbar-btn', editor.isActive('underline') && 'active')}
          disabled={disabled}
          title="Underline"
          aria-label="Underline"
        >
          <UnderlineIcon size={15} />
        </button>

        {/* Bullet List */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBulletList().run();
          }}
          className={cn('sp-toolbar-btn', editor.isActive('bulletList') && 'active')}
          disabled={disabled}
          title="Bullet List"
          aria-label="Bullet List"
        >
          <List size={16} />
        </button>

        {/* Numbered List */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleOrderedList().run();
          }}
          className={cn('sp-toolbar-btn', editor.isActive('orderedList') && 'active')}
          disabled={disabled}
          title="Numbered List"
          aria-label="Numbered List"
        >
          <ListOrdered size={16} />
        </button>

        {/* Modern Link Button */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            openLinkPopover();
          }}
          className={cn('sp-toolbar-btn', (editor.isActive('link') || linkPopoverOpen) && 'active')}
          disabled={disabled}
          title="Insert / Edit Link"
          aria-label="Insert / Edit Link"
        >
          <LinkIcon size={15} />
        </button>

        {/* Unlink */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().unsetLink().run();
          }}
          className="sp-toolbar-btn"
          disabled={disabled || !editor.isActive('link')}
          title="Remove Link"
          aria-label="Remove Link"
        >
          <Unlink size={15} />
        </button>

        {/* Align Left */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().setTextAlign('left').run();
          }}
          className={cn('sp-toolbar-btn', isLeftAlign && 'active')}
          disabled={disabled}
          title="Align Left"
          aria-label="Align Left"
        >
          <AlignLeft size={16} />
        </button>

        {/* Align Center */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().setTextAlign('center').run();
          }}
          className={cn('sp-toolbar-btn', isCenterAlign && 'active')}
          disabled={disabled}
          title="Align Center"
          aria-label="Align Center"
        >
          <AlignCenter size={16} />
        </button>

        {/* Align Right */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().setTextAlign('right').run();
          }}
          className={cn('sp-toolbar-btn', isRightAlign && 'active')}
          disabled={disabled}
          title="Align Right"
          aria-label="Align Right"
        >
          <AlignRight size={16} />
        </button>

        {/* Undo */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().undo().run();
          }}
          className="sp-toolbar-btn"
          disabled={disabled || !editor.can().undo()}
          title="Undo"
          aria-label="Undo"
        >
          <Undo size={15} />
        </button>

        {/* Redo */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().redo().run();
          }}
          className="sp-toolbar-btn"
          disabled={disabled || !editor.can().redo()}
          title="Redo"
          aria-label="Redo"
        >
          <Redo size={15} />
        </button>

        {/* Clear formatting (Tx glyph) */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().clearNodes().unsetAllMarks().unsetTextAlign().run();
          }}
          className="sp-toolbar-btn"
          disabled={disabled}
          title="Clear formatting"
          aria-label="Clear formatting"
        >
          <span className="sp-tx-glyph" aria-hidden="true">
            T<small>x</small>
          </span>
        </button>

        {/* Modern Link Popover */}
        {linkPopoverOpen && (
          <div
            className="sp-link-popover"
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              insetInlineStart: '100px',
              zIndex: 70,
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '12px 14px',
              boxShadow: '0 12px 30px rgba(13, 34, 80, 0.16)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              minWidth: '320px',
              maxWidth: 'calc(100vw - 40px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text, #0f172a)' }}>
                {editor.isActive('link') ? 'Edit Link' : 'Insert Link'}
              </strong>
              <button
                type="button"
                onClick={() => setLinkPopoverOpen(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: 'var(--muted, #64748b)',
                  fontSize: '18px',
                  lineHeight: 1,
                  padding: '2px 4px',
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyLink();
                } else if (e.key === 'Escape') {
                  setLinkPopoverOpen(false);
                }
              }}
              placeholder="https://example.com"
              autoFocus
              style={{
                width: '100%',
                minHeight: '38px',
                padding: '6px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#0f172a',
                outline: 'none',
                background: '#fff',
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
              {editor.isActive('link') && (
                <button
                  type="button"
                  onClick={removeLink}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '7px',
                    border: '1px solid #fecaca',
                    background: '#fef2f2',
                    color: '#dc2626',
                    cursor: 'pointer',
                    marginInlineEnd: 'auto',
                  }}
                >
                  Remove
                </button>
              )}
              <button
                type="button"
                onClick={() => setLinkPopoverOpen(false)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '7px',
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyLink}
                style={{
                  padding: '6px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '7px',
                  border: 'none',
                  background: '#f7951d',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Save Link
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content Container (Rounded with Focus Border) */}
      <div
        className={cn('sp-editor-content-box', isFocused && 'focused')}
        onClick={() => {
          if (editor && !editor.isFocused) {
            editor.commands.focus('end');
          }
        }}
        style={{ minHeight }}
      >
        <EditorContent editor={editor} dir={dir} />
      </div>
    </div>
  );
}
