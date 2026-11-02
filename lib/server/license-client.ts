/**
 * TravNeeds Modular Platform — Server-Side License Client & Verification Foundation
 *
 * Implements secure storage and verification abstractions for commercial license keys.
 * Prepared for future integration with the central TravNeeds License Server.
 *
 * Security Principles:
 * - Central License Server owns private signing keys; customer installations NEVER hold private keys.
 * - Fails closed: unverified optional add-ons are inactive.
 * - Zero bypass: client-side inputs are untrusted and must be verified server-side.
 * - Does not enforce restrictions on existing core business modules (Tours, Bookings, Payments).
 */

import { db } from './db';
import type {
  InstallationIdentity,
  LicenseEntitlement,
  LicenseVerificationResult,
} from '@/lib/modules/entitlements';
import { platformModuleRegistry } from '@/lib/modules/registry';
import { resolveLicenseCapabilities } from '@/lib/modules/entitlements';

const SETTING_KEY_INSTALLATION = 'license:installation_identity';
const SETTING_KEY_ACTIVE_LICENSE = 'license:active_entitlement';
const SETTING_KEY_SERVER_ENDPOINT = 'license:server_endpoint';

/**
 * Returns the unique Installation Identity for this deployment.
 * If one has not been initialized yet, generates a stable one and persists it in site_settings.
 */
export async function getInstallationIdentity(): Promise<InstallationIdentity> {
  const row = await db.siteSetting.findUnique({
    where: { key: SETTING_KEY_INSTALLATION },
  });

  if (row?.value) {
    try {
      const parsed = JSON.parse(row.value);
      return {
        ...parsed,
        provisionedAt: new Date(parsed.provisionedAt),
      };
    } catch {
      // Fall through to generate fresh if corrupted
    }
  }

  // Generate fresh installation record
  const fresh: InstallationIdentity = {
    installationId: `inst_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`,
    customerName: 'TravNeeds Customer Deployment',
    contactEmail: 'admin@travneeds.local',
    domain: typeof window === 'undefined' ? (process.env.APP_URL || 'localhost:3000') : window.location.host,
    environment: (process.env.NODE_ENV as any) || 'production',
    provisionedAt: new Date(),
  };

  try {
    await db.siteSetting.create({
      data: {
        key: SETTING_KEY_INSTALLATION,
        value: JSON.stringify(fresh),
        description: 'Commercial software installation identity',
      },
    });
  } catch {
    // Concurrent create safe ignore
  }

  return fresh;
}

/**
 * Returns the currently stored License Entitlement, if any.
 */
export async function getStoredLicenseEntitlement(): Promise<LicenseEntitlement | null> {
  const row = await db.siteSetting.findUnique({
    where: { key: SETTING_KEY_ACTIVE_LICENSE },
  });

  if (!row?.value) return null;

  try {
    const parsed = JSON.parse(row.value);
    return {
      ...parsed,
      issuedAt: new Date(parsed.issuedAt),
      expiresAt: new Date(parsed.expiresAt),
      gracePeriodExpiresAt: new Date(parsed.gracePeriodExpiresAt),
      modules: parsed.modules.map((m: any) => ({
        ...m,
        expiresAt: m.expiresAt ? new Date(m.expiresAt) : undefined,
      })),
    };
  } catch {
    return null;
  }
}

/**
 * Simulates / prepares verification against the future Central License Server.
 * Currently returns "not configured" status unless verified signature payload is present.
 */
export async function verifyLicenseWithCentralServer(
  licenseKey: string,
  installation: InstallationIdentity
): Promise<LicenseVerificationResult> {
  const cleanKey = licenseKey.trim();

  if (!cleanKey) {
    return {
      isValid: false,
      status: 'unlicensed',
      message: 'License key cannot be empty.',
      checkedAt: new Date(),
      isOfflineVerification: false,
    };
  }

  const serverEndpoint = process.env.TRAVNEEDS_LICENSE_SERVER_URL;

  // If central server is not configured, do NOT fake successful activation
  if (!serverEndpoint) {
    return {
      isValid: false,
      status: 'unlicensed',
      message: 'Central License Server endpoint is not configured (TRAVNEEDS_LICENSE_SERVER_URL is missing). Activation cannot be verified.',
      checkedAt: new Date(),
      isOfflineVerification: false,
    };
  }

  // Future phase: Call https://license.travneeds.com/api/v1/verify
  // with installationId, domain, and licenseKey, signed with Public Verification Key.
  return {
    isValid: false,
    status: 'unlicensed',
    message: 'Central License Server integration pending deployment.',
    checkedAt: new Date(),
    isOfflineVerification: false,
  };
}

/**
 * Returns full administrative diagnostics for the Add-ons and Licensing dashboard.
 */
export async function getAddonsDashboardState() {
  const installation = await getInstallationIdentity();
  const license = await getStoredLicenseEntitlement();
  const allModules = platformModuleRegistry.getAll();
  const capabilities = resolveLicenseCapabilities(allModules, license);

  const serverConfigured = Boolean(process.env.TRAVNEEDS_LICENSE_SERVER_URL);

  return {
    installation: {
      installationId: installation.installationId,
      customerName: installation.customerName,
      contactEmail: installation.contactEmail,
      domain: installation.domain,
      environment: installation.environment,
      provisionedAt: installation.provisionedAt.toISOString(),
    },
    license: license
      ? {
          licenseKey: `${license.licenseKey.slice(0, 8)}...${license.licenseKey.slice(-4)}`, // Masked for security
          edition: license.edition,
          status: license.status,
          issuedAt: license.issuedAt.toISOString(),
          expiresAt: license.expiresAt.toISOString(),
          gracePeriodExpiresAt: license.gracePeriodExpiresAt.toISOString(),
          licensedModules: license.modules,
        }
      : null,
    capabilities: {
      isOperational: capabilities.isOperational,
      activeModuleIds: Array.from(capabilities.activeModuleIds),
      activeFeatureKeys: Array.from(capabilities.activeFeatureKeys),
      warnings: capabilities.warnings,
    },
    modules: allModules.map((m) => {
      const isLicensed = capabilities.activeModuleIds.has(m.id);
      return {
        id: m.id,
        name: m.name,
        displayName: m.displayName,
        description: m.description,
        version: m.version,
        category: m.category,
        lifecycle: m.lifecycle,
        isCore: m.isCore,
        requiredDependencies: m.requiredDependencies,
        optionalDependencies: m.optionalDependencies,
        isLicensed,
        features: m.features.map((f) => ({
          key: f.key,
          name: f.name,
          isEntitled: capabilities.activeFeatureKeys.has(f.key),
        })),
      };
    }),
    serverStatus: {
      configured: serverConfigured,
      endpoint: serverConfigured ? 'Configured (Encrypted)' : 'Not Configured',
    },
  };
}

