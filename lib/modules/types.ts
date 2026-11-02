/**
 * TravNeeds Modular Platform — Core Module Manifest & Types
 *
 * Provides a decoupled, extensible registry for core features and subscription add-ons.
 * Does not depend on a hardcoded union of every possible module ID, allowing future
 * dynamic extension without breaking existing contracts.
 */

export type ModuleCategory =
  | 'core_operations'
  | 'travel_products'
  | 'specialized_tourism'
  | 'transport_fleet'
  | 'travel_operations'
  | 'business_management'
  | 'distribution_growth';

export type ModuleLifecycle =
  | 'planned'
  | 'implemented'
  | 'available_for_subscription'
  | 'deprecated';

export type LocalizedText = {
  en: string;
  ar: string;
  es?: string;
  it?: string;
  [key: string]: string | undefined;
};

export interface ModulePermissionDef {
  key: string;       // e.g. "tours.view", "hotels.book"
  action: string;    // e.g. "view", "edit", "book"
  label: LocalizedText;
  description?: LocalizedText;
}

export interface ModuleFeatureDef {
  key: string;       // e.g. "tours.multi_day", "hotels.channel_manager"
  name: LocalizedText;
  description?: LocalizedText;
  requiresSubscription?: boolean;
}

export interface ModuleRouteConfig {
  adminPrefix?: string;     // e.g. "/admin/trips"
  publicPrefix?: string;    // e.g. "/all-tours"
  apiPrefix?: string;       // e.g. "/api/tours"
}

export interface ModuleNavigationItem {
  key: string;
  section: 'main' | 'operations' | 'catalogue' | 'distribution' | 'settings';
  label: LocalizedText;
  href: string;
  icon?: string;
  requiredPermission?: string;
  order?: number;
}

export interface ModuleManifest {
  /** Stable identifier (e.g. 'core', 'tours', 'hotels', 'transfers') */
  readonly id: string;

  /** Technical internal system name */
  readonly name: string;

  /** Localized display titles */
  readonly displayName: LocalizedText;

  /** Localized description */
  readonly description: LocalizedText;

  /** Semantic versioning string (e.g. '1.0.0') */
  readonly version: string;

  /** Primary business category */
  readonly category: ModuleCategory;

  /** Current lifecycle readiness */
  readonly lifecycle: ModuleLifecycle;

  /** Whether this is a platform-required core module (cannot be disabled or uninstalled) */
  readonly isCore: boolean;

  /** Other module IDs that must be active for this module to function */
  readonly requiredDependencies: readonly string[];

  /** Optional module IDs that enhance this module if present */
  readonly optionalDependencies: readonly string[];

  /** Granular permissions introduced by this module */
  readonly permissions: readonly ModulePermissionDef[];

  /** Feature flags or granular capabilities */
  readonly features: readonly ModuleFeatureDef[];

  /** Navigation entries exposed in admin/storefront */
  readonly navigation: readonly ModuleNavigationItem[];

  /** URL and route prefixes owned by this module */
  readonly routes: ModuleRouteConfig;

  /** Configuration schema metadata or default key-values */
  readonly defaultSettings?: Record<string, unknown>;
}

