'use client';

/**
 * TravNeeds Modular Platform — Tiptap 3 Safe Rich Text Editor Component
 *
 * Implements:
 * - Bold, italic, underline
 * - Paragraphs and H2/H3 headings
 * - Bulleted and numbered lists
 * - Safe hyperlinks (url validation & modal/prompt)
 * - Left, center, right text alignment
 * - Undo & redo
 * - Clear formatting
 * - Safe Word / website paste normalization
 * - Design system conformity (styles match TravNeeds input tokens)
 */

import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
  RemoveFormatting,
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
  minHeight = '140px',
  dir = 'auto',
  disabled = false,
  className,
}: RichTextEditorProps) {
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
      }),
    ],
    content: initialContent,
    editable: !disabled,
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
          border: '1px solid var(--border)',
          borderRadius: '9px',
          background: '#fff',
          padding: '12px',
          color: 'var(--muted)',
          fontSize: '13px',
        }}
      >
        Loading editor...
      </div>
    );
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter link URL (https://...):', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div
      className={cn('sp-rich-editor', className, disabled && 'disabled')}
      style={{
        border: '1px solid var(--border)',
        borderRadius: '9px',
        background: '#fff',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Editor Toolbar */}
      <div
        className="sp-editor-toolbar"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '3px',
          padding: '6px 8px',
          background: '#f8fafc',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn('sp-toolbar-btn', editor.isActive('bold') && 'active')}
          title="Bold"
          aria-label="Bold"
        >
          <Bold size={15} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn('sp-toolbar-btn', editor.isActive('italic') && 'active')}
          title="Italic"
          aria-label="Italic"
        >
          <Italic size={15} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn('sp-toolbar-btn', editor.isActive('underline') && 'active')}
          title="Underline"
          aria-label="Underline"
        >
          <UnderlineIcon size={15} />
        </button>

        <span className="sp-toolbar-sep" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn('sp-toolbar-btn', editor.isActive('heading', { level: 2 }) && 'active')}
          title="Heading 2"
          aria-label="Heading 2"
        >
          <Heading2 size={15} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn('sp-toolbar-btn', editor.isActive('heading', { level: 3 }) && 'active')}
          title="Heading 3"
          aria-label="Heading 3"
        >
          <Heading3 size={15} />
        </button>

        <span className="sp-toolbar-sep" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn('sp-toolbar-btn', editor.isActive('bulletList') && 'active')}
          title="Bullet List"
          aria-label="Bullet List"
        >
          <List size={15} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn('sp-toolbar-btn', editor.isActive('orderedList') && 'active')}
          title="Numbered List"
          aria-label="Numbered List"
        >
          <ListOrdered size={15} />
        </button>

        <span className="sp-toolbar-sep" />

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={cn('sp-toolbar-btn', editor.isActive({ textAlign: 'left' }) && 'active')}
          title="Align Left"
          aria-label="Align Left"
        >
          <AlignLeft size={15} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={cn('sp-toolbar-btn', editor.isActive({ textAlign: 'center' }) && 'active')}
          title="Align Center"
          aria-label="Align Center"
        >
          <AlignCenter size={15} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={cn('sp-toolbar-btn', editor.isActive({ textAlign: 'right' }) && 'active')}
          title="Align Right"
          aria-label="Align Right"
        >
          <AlignRight size={15} />
        </button>

        <span className="sp-toolbar-sep" />

        <button
          type="button"
          onClick={setLink}
          className={cn('sp-toolbar-btn', editor.isActive('link') && 'active')}
          title="Insert Link"
          aria-label="Insert Link"
        >
          <LinkIcon size={15} />
        </button>

        {editor.isActive('link') && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="sp-toolbar-btn"
            title="Remove Link"
            aria-label="Remove Link"
          >
            <Unlink size={15} />
          </button>
        )}

        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          className="sp-toolbar-btn"
          title="Clear Formatting"
          aria-label="Clear Formatting"
        >
          <RemoveFormatting size={15} />
        </button>

        <span className="sp-toolbar-sep" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="sp-toolbar-btn"
          title="Undo"
          aria-label="Undo"
        >
          <Undo size={15} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="sp-toolbar-btn"
          title="Redo"
          aria-label="Redo"
        >
          <Redo size={15} />
        </button>
      </div>

      {/* Editor Content Area */}
      <div
        style={{
          padding: '10px 14px',
          minHeight,
          flex: 1,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
        dir={dir}
        onClick={() => {
          if (!editor.isFocused) editor.chain().focus().run();
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

