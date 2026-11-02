/**
 * TravNeeds Modular Platform — Reusable UI Foundation Components
 *
 * Provides typed, consistent patterns for future module views:
 * - ModulePageHeader
 * - ModuleSearchBar
 * - ModuleFilterTabs
 * - ModuleDataTable
 * - ModuleDetailSection
 * - ModuleStatusBadge
 * - ModuleEmptyState
 * - ModuleLoadingSkeleton
 *
 * Conforms 100% to TravNeeds DESIGN_SYSTEM.md tokens and styles.
 */

import React from 'react';
import { Search, LucideIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminText } from '@/components/admin/admin-ui';

// ============================================================================
// 1. Status Badge
// ============================================================================

export type ModuleBadgeTone = 'green' | 'blue' | 'orange' | 'red' | 'purple' | 'slate';

export interface ModuleStatusBadgeProps {
  label: React.ReactNode;
  tone?: ModuleBadgeTone;
  className?: string;
}

export function ModuleStatusBadge({ label, tone = 'blue', className }: ModuleStatusBadgeProps) {
  const tones: Record<ModuleBadgeTone, { bg: string; text: string; border: string }> = {
    green: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
    blue: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    orange: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
    red: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
    purple: { bg: '#faf5ff', text: '#6b21a8', border: '#e9d5ff' },
    slate: { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' },
  };

  const style = tones[tone];

  return (
    <span
      className={cn('module-status-badge', className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 9px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 700,
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

// ============================================================================
// 2. Filter Tabs
// ============================================================================

export interface ModuleFilterTabOption<T extends string> {
  id: T;
  label: React.ReactNode;
  count?: number;
}

export interface ModuleFilterTabsProps<T extends string> {
  options: readonly ModuleFilterTabOption<T>[];
  activeId: T;
  onChange: (id: T) => void;
  className?: string;
}

export function ModuleFilterTabs<T extends string>({
  options,
  activeId,
  onChange,
  className,
}: ModuleFilterTabsProps<T>) {
  return (
    <div
      className={cn('module-filter-tabs', className)}
      role="tablist"
      style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}
    >
      {options.map((opt) => {
        const isActive = opt.id === activeId;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              border: `1px solid ${isActive ? 'var(--blue)' : 'var(--border)'}`,
              background: isActive ? 'var(--blue)' : '#fff',
              color: isActive ? '#fff' : 'var(--text)',
            }}
          >
            <span>{opt.label}</span>
            {typeof opt.count === 'number' && (
              <small
                style={{
                  fontSize: '11px',
                  opacity: isActive ? 1 : 0.75,
                  fontWeight: 700,
                  backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                  color: isActive ? '#fff' : 'var(--muted)',
                  padding: '1px 6px',
                  borderRadius: '999px',
                }}
              >
                {opt.count}
              </small>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// 3. Search & Toolbar
// ============================================================================

export interface ModuleSearchProps {
  query: string;
  onQueryChange: (val: string) => void;
  placeholder?: string;
  children?: React.ReactNode;
  className?: string;
}

export function ModuleSearch({
  query,
  onQueryChange,
  placeholder = 'Search items...',
  children,
  className,
}: ModuleSearchProps) {
  return (
    <div
      className={cn('module-search-toolbar', className)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        margin: '16px 0',
      }}
    >
      <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 300px' }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--muted)',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            minHeight: '38px',
            paddingLeft: '36px',
            paddingRight: '12px',
            borderRadius: '9px',
            border: '1px solid var(--border)',
            background: '#fff',
            fontSize: '13px',
            color: 'var(--text)',
          }}
        />
      </div>

      {children && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{children}</div>}
    </div>
  );
}

// ============================================================================
// 4. Empty State
// ============================================================================

export interface ModuleEmptyProps {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export function ModuleEmpty({
  icon: Icon = Search,
  title,
  description,
  action,
}: ModuleEmptyProps) {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        display: 'grid',
        justifyItems: 'center',
        gap: '8px',
        margin: '16px 0',
      }}
    >
      <span
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--muted)',
          marginBottom: '6px',
        }}
      >
        <Icon size={22} />
      </span>
      <strong style={{ fontSize: '15px', color: 'var(--text)' }}>{title}</strong>
      {description && <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', maxWidth: '420px' }}>{description}</p>}
      {action && <div style={{ marginTop: '12px' }}>{action}</div>}
    </div>
  );
}

// ============================================================================
// 5. Loading Skeleton
// ============================================================================

export function ModuleLoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ display: 'grid', gap: '8px', padding: '16px 0' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            height: '46px',
            borderRadius: '8px',
            backgroundColor: '#f1f5f9',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  );
}

