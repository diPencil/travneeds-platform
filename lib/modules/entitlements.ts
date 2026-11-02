/**
 * TravNeeds Modular Platform — Commercial Licensing & Entitlement Contracts
 *
 * Designed for independent single-installation commercial deployments with centralized
 * license verification (TravNeeds Central License Server model).
 *
 * Preserves backward compatibility while defining installation identity, license status,
 * licensed add-ons, offline tolerance, and grace-period rules.
 */

import type { ModuleManifest } from './types';

// ============================================================================
// 1. Installation & Customer Identity
// ============================================================================

export interface InstallationIdentity {
  /** Unique installation UUID generated upon initial setup */
  readonly installationId: string;

  /** Customer / Organization commercial name */
  readonly customerName: string;

  /** Primary commercial or administrative contact email */
  readonly contactEmail: string;

  /** The authorized origin / domain for this deployment */
  readonly domain: string;

  /** Environment mode */
  readonly environment: 'production' | 'staging' | 'development' | 'testing';

  /** Timestamp when this installation was provisioned */
  readonly provisionedAt: Date;
}

// ============================================================================
// 2. License Status & Lifecycle
// ============================================================================

export type LicenseStatus =
  | 'active'        // Valid and within current active period
  | 'trial'         // Trial period active
  | 'grace_period'  // Expired or unpaid, but within offline/commercial grace window
  | 'expired'       // Beyond grace period; access restricted
  | 'revoked'       // Explicitly revoked by product owner
  | 'unlicensed';   // No license applied or invalid installation

export interface LicenseVerificationResult {
  readonly isValid: boolean;
  readonly status: LicenseStatus;
  readonly message?: string;
  readonly checkedAt: Date;
  readonly expiresAt?: Date;
  readonly gracePeriodExpiresAt?: Date;
  readonly isOfflineVerification: boolean;
}

// ============================================================================
// 3. Licensed Modules & Add-ons
// ============================================================================

export interface LicensedModule {
  /** Module ID matching a ModuleManifest.id */
  readonly moduleId: string;

  /** Status of this specific module within the license */
  readonly status: LicenseStatus;

  /** How the module was acquired */
  readonly tier: 'core' | 'standard' | 'enterprise' | 'custom';

  /** Optional expiration date if module subscription differs from base license */
  readonly expiresAt?: Date;

  /** Optional feature flags granted within this module */
  readonly grantedFeatures?: readonly string[];
}

export interface LicenseEntitlement {
  /** Commercial License Key / Serial Number */
  readonly licenseKey: string;

  /** Associated Installation ID */
  readonly installationId: string;

  /** License status */
  readonly status: LicenseStatus;

  /** Edition name (e.g. "TravNeeds Professional", "TravNeeds Enterprise") */
  readonly edition: string;

  /** List of entitled modules and add-ons */
  readonly modules: readonly LicensedModule[];

  /** Issue date */
  readonly issuedAt: Date;

  /** Active term expiration */
  readonly expiresAt: Date;

  /** Grace period cutoff date */
  readonly gracePeriodExpiresAt: Date;

  /** Server cryptographic signature version */
  readonly signatureVersion: string;
}

// ============================================================================
// 4. Feature & Capability Resolution
// ============================================================================

export interface FeatureEntitlement {
  readonly featureKey: string;
  readonly moduleId: string;
  readonly isEntitled: boolean;
  readonly reason?: string;
}

export interface LicenseCapabilityResolution {
  readonly isOperational: boolean;
  readonly activeModuleIds: ReadonlySet<string>;
  readonly activeFeatureKeys: ReadonlySet<string>;
  readonly warnings: readonly string[];
}

// ============================================================================
// 5. Pure Evaluation Functions
// ============================================================================

/**
 * Checks whether an installation is entitled to a specific module under its active license.
 */
export function isModuleLicensed(
  manifest: ModuleManifest,
  license: LicenseEntitlement | null | undefined,
  now = new Date()
): boolean {
  // Core platform modules are ALWAYS unconditionally entitled regardless of license status
  if (manifest.isCore) {
    return true;
  }

  // Without a license, no optional add-ons are entitled
  if (!license) {
    return false;
  }

  // Revoked, expired (beyond grace), or unlicensed status disables all add-ons
  if (license.status === 'revoked' || license.status === 'unlicensed') {
    return false;
  }

  // Check overall license expiration against grace period
  if (now > license.gracePeriodExpiresAt) {
    return false;
  }

  // Locate the specific module entry in the license
  const mod = license.modules.find((m) => m.moduleId.toLowerCase() === manifest.id.toLowerCase());
  if (!mod) {
    return false;
  }

  // Check module specific status
  if (mod.status === 'revoked' || mod.status === 'unlicensed' || mod.status === 'expired') {
    return false;
  }

  // Check module specific expiration if defined
  if (mod.expiresAt && now > mod.expiresAt && now > license.gracePeriodExpiresAt) {
    return false;
  }

  return true;
}

/**
 * Evaluates whether a feature is entitled under the active license.
 */
export function isFeatureLicensed(
  featureKey: string,
  manifest: ModuleManifest,
  license: LicenseEntitlement | null | undefined,
  now = new Date()
): FeatureEntitlement {
  if (!isModuleLicensed(manifest, license, now)) {
    return {
      featureKey,
      moduleId: manifest.id,
      isEntitled: false,
      reason: `Module '${manifest.id}' is not licensed or active`,
    };
  }

  // If module is Core, feature is entitled
  if (manifest.isCore) {
    return { featureKey, moduleId: manifest.id, isEntitled: true };
  }

  const mod = license?.modules.find((m) => m.moduleId.toLowerCase() === manifest.id.toLowerCase());
  if (!mod) {
    return { featureKey, moduleId: manifest.id, isEntitled: false, reason: 'Module not found in license' };
  }

  // If module grants all features (undefined grantedFeatures), or explicitly lists the feature
  if (!mod.grantedFeatures || mod.grantedFeatures.includes(featureKey)) {
    return { featureKey, moduleId: manifest.id, isEntitled: true };
  }

  return {
    featureKey,
    moduleId: manifest.id,
    isEntitled: false,
    reason: `Feature '${featureKey}' is not included in the granted tier`,
  };
}

/**
 * Resolves all active capabilities, active modules, and warnings for an installation.
 */
export function resolveLicenseCapabilities(
  registeredManifests: readonly ModuleManifest[],
  license: LicenseEntitlement | null | undefined,
  now = new Date()
): LicenseCapabilityResolution {
  const activeModuleIds = new Set<string>();
  const activeFeatureKeys = new Set<string>();
  const warnings: string[] = [];

  const isLicenseInGrace = license
    ? (license.status === 'grace_period' || (now > license.expiresAt && now <= license.gracePeriodExpiresAt))
    : false;

  if (isLicenseInGrace) {
    warnings.push(`License is in grace period until ${license?.gracePeriodExpiresAt.toISOString()}. Please renew.`);
  }

  for (const manifest of registeredManifests) {
    if (isModuleLicensed(manifest, license, now)) {
      activeModuleIds.add(manifest.id);

      for (const feat of manifest.features) {
        const featEntitlement = isFeatureLicensed(feat.key, manifest, license, now);
        if (featEntitlement.isEntitled) {
          activeFeatureKeys.add(feat.key);
        }
      }
    }
  }

  return {
    isOperational: activeModuleIds.size > 0,
    activeModuleIds,
    activeFeatureKeys,
    warnings,
  };
}

// ============================================================================
// 6. Backward Compatibility Layer (Preserves Phase 1A interfaces)
// ============================================================================

/** @deprecated Retained for backward compatibility with Phase 1A contracts */
export type OrganizationStatus = 'active' | 'suspended' | 'trial' | 'deactivated';
/** @deprecated Retained for backward compatibility with Phase 1A contracts */
export type MembershipStatus = 'active' | 'invited' | 'suspended';
/** @deprecated Retained for backward compatibility with Phase 1A contracts */
export type SubscriptionStatus = LicenseStatus;

/** @deprecated Retained for backward compatibility with Phase 1A contracts */
export interface OrganizationContract {
  id: string;
  slug: string;
  name: string;
  status: OrganizationStatus;
  currency: string;
  defaultLocale: string;
}

/** @deprecated Retained for backward compatibility with Phase 1A contracts */
export interface ModuleEntitlement {
  moduleId: string;
  organizationId: string;
  status: SubscriptionStatus;
  grantedVia: 'core' | 'plan' | 'add_on';
}

/** @deprecated Use isModuleLicensed instead */
export function isModuleEntitled(
  manifest: ModuleManifest,
  activeEntitlements: ReadonlyMap<string, ModuleEntitlement>
): boolean {
  if (manifest.isCore) return true;
  const ent = activeEntitlements.get(manifest.id);
  if (!ent) return false;
  return ent.status === 'active' || ent.status === 'trial' || ent.status === 'grace_period';
}

/**
 * Evaluates whether a module is subscription/license ready based on its lifecycle status.
 */
export function isModuleSubscriptionEligible(manifest: ModuleManifest): boolean {
  return manifest.lifecycle === 'available_for_subscription';
}
