/**
 * TravNeeds Phase 1B — Isolated Licensing & Module Registry Unit Tests
 *
 * Runs standalone via Node.js / tsx without writing to database or loading Next.js runtime.
 */

import { ModuleRegistry, ModuleRegistryError } from './registry';
import {
  isModuleLicensed,
  isFeatureLicensed,
  resolveLicenseCapabilities,
  isModuleSubscriptionEligible,
  type LicenseEntitlement,
  type InstallationIdentity,
} from './entitlements';
import type { ModuleManifest } from './types';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exitCode = 1;
  } else {
    passedTests++;
    console.log(`✅ PASSED: ${message}`);
  }
}

function assertThrows(fn: () => void, expectedCode: string, message: string) {
  totalTests++;
  try {
    fn();
    console.error(`❌ FAILED: ${message} (Expected error '${expectedCode}' but none was thrown)`);
    process.exitCode = 1;
  } catch (err: any) {
    if (err instanceof ModuleRegistryError && err.code === expectedCode) {
      passedTests++;
      console.log(`✅ PASSED: ${message}`);
    } else {
      console.error(`❌ FAILED: ${message} (Expected code '${expectedCode}', got '${err?.code || err?.message}')`);
      process.exitCode = 1;
    }
  }
}

console.log('--- Running TravNeeds Phase 1B Licensing & Registry Tests ---\n');

// ============================================================================
// 1. Module Registry & Validation (Preserved from Phase 1A)
// ============================================================================

const registry = new ModuleRegistry();

const validCoreManifest: ModuleManifest = {
  id: 'core',
  name: 'Core Platform',
  displayName: { en: 'Core Platform', ar: 'المنصة الأساسية' },
  description: { en: 'Core platform identity and billing', ar: 'الهوية الأساسية' },
  version: '1.0.0',
  category: 'core_operations',
  lifecycle: 'implemented',
  isCore: true,
  requiredDependencies: [],
  optionalDependencies: [],
  permissions: [],
  features: [{ key: 'core.audit', name: { en: 'Audit', ar: 'تدقيق' } }],
  navigation: [],
  routes: {},
};

const validToursManifest: ModuleManifest = {
  id: 'tours',
  name: 'Tours & Packages',
  displayName: { en: 'Tours & Packages', ar: 'الرحلات والبرامج' },
  description: { en: 'Tours booking and management', ar: 'إدارة الرحلات' },
  version: '1.0.0',
  category: 'travel_products',
  lifecycle: 'available_for_subscription',
  isCore: false,
  requiredDependencies: ['core'],
  optionalDependencies: ['transfers'],
  permissions: [],
  features: [
    { key: 'tours.builder', name: { en: 'Trip Builder', ar: 'منشئ الرحلات' } },
    { key: 'tours.advanced_pricing', name: { en: 'Advanced Pricing', ar: 'تسعير متقدم' } },
  ],
  navigation: [],
  routes: {},
};

const plannedHotelsManifest: ModuleManifest = {
  id: 'hotels',
  name: 'Hotel Reservations',
  displayName: { en: 'Hotels', ar: 'الفنادق' },
  description: { en: 'Hotel booking', ar: 'حجز الفنادق' },
  version: '0.1.0',
  category: 'travel_products',
  lifecycle: 'planned',
  isCore: false,
  requiredDependencies: ['core'],
  optionalDependencies: [],
  permissions: [],
  features: [],
  navigation: [],
  routes: {},
};

registry.register(validCoreManifest);
registry.register(validToursManifest);
registry.register(plannedHotelsManifest);

assert(registry.get('tours')?.id === 'tours', 'Module registered and retrievable');

assertThrows(
  () => registry.register(validToursManifest),
  'DUPLICATE_MODULE_ID',
  'Duplicate module ID is rejected'
);

assertThrows(
  () => registry.register({ ...validToursManifest, id: '' }),
  'INVALID_MODULE_ID',
  'Empty module ID is rejected'
);

assertThrows(
  () => registry.register({ ...validToursManifest, id: 'no_ar', displayName: { en: 'Only En', ar: '' } }),
  'MISSING_REQUIRED_LOCALIZATION',
  'Missing Arabic display name is rejected'
);

// Dependencies validation
const depResult = registry.validateDependencies(['tours']);
assert(depResult.valid, 'Valid dependency resolution with implicit core inclusion');

// Circular Dependency Detection
const cycleReg = new ModuleRegistry();
cycleReg.register({ ...validToursManifest, id: 'node_a', requiredDependencies: ['node_b'] });
cycleReg.register({ ...validToursManifest, id: 'node_b', requiredDependencies: ['node_c'] });
cycleReg.register({ ...validToursManifest, id: 'node_c', requiredDependencies: ['node_a'] });
const cycleResult = cycleReg.validateDependencies(['node_a', 'node_b', 'node_c']);
assert(!cycleResult.valid && cycleResult.circularDependencies.length > 0, 'Circular dependency chain detected');

// Lifecycle checks
assert(!isModuleSubscriptionEligible(plannedHotelsManifest), 'Planned (unimplemented) modules are not subscription eligible');
assert(isModuleSubscriptionEligible(validToursManifest), 'Implemented available modules are subscription eligible');

// ============================================================================
// 2. Commercial Installation & License Validation
// ============================================================================

const testInstallation: InstallationIdentity = {
  installationId: 'inst_abc123',
  customerName: 'Acme Travel Agency',
  contactEmail: 'admin@acmetravel.com',
  domain: 'portal.acmetravel.com',
  environment: 'production',
  provisionedAt: new Date('2026-01-01T00:00:00Z'),
};

assert(testInstallation.installationId === 'inst_abc123', 'Installation identity contract verified');

const baseDate = new Date('2026-06-01T12:00:00Z');

const activeLicense: LicenseEntitlement = {
  licenseKey: 'TRV-2026-PRO-9988',
  installationId: 'inst_abc123',
  status: 'active',
  edition: 'TravNeeds Professional',
  modules: [
    {
      moduleId: 'tours',
      status: 'active',
      tier: 'standard',
      grantedFeatures: ['tours.builder'], // Only tours.builder granted; advanced_pricing not granted
    },
  ],
  issuedAt: new Date('2026-01-01T00:00:00Z'),
  expiresAt: new Date('2026-12-31T23:59:59Z'),
  gracePeriodExpiresAt: new Date('2027-01-14T23:59:59Z'),
  signatureVersion: 'v1',
};

// 2.1 Core module is unconditionally licensed with or without license
assert(isModuleLicensed(validCoreManifest, null, baseDate), 'Core module is unconditionally licensed without license');
assert(isModuleLicensed(validCoreManifest, activeLicense, baseDate), 'Core module is licensed under active license');

// 2.2 Optional Add-on under active license
assert(isModuleLicensed(validToursManifest, activeLicense, baseDate), 'Add-on is licensed under active license');
assert(!isModuleLicensed(validToursManifest, null, baseDate), 'Add-on is NOT licensed without a license file');

// 2.3 Unlicensed Add-on (not in license)
const unlicensedAddOn: ModuleManifest = {
  ...validToursManifest,
  id: 'visa',
  name: 'Visa Processing',
};
assert(!isModuleLicensed(unlicensedAddOn, activeLicense, baseDate), 'Unlicensed Add-on (not in modules list) is rejected');

// 2.4 Expired License within Grace Period
const licenseInGrace: LicenseEntitlement = {
  ...activeLicense,
  status: 'grace_period',
  expiresAt: new Date('2026-05-31T23:59:59Z'), // expired yesterday
  gracePeriodExpiresAt: new Date('2026-06-14T23:59:59Z'), // grace period active
};
assert(
  isModuleLicensed(validToursManifest, licenseInGrace, baseDate),
  'Add-on remains functional within grace period window'
);

// 2.5 Expired License past Grace Period
const pastGraceDate = new Date('2026-06-20T00:00:00Z');
assert(
  !isModuleLicensed(validToursManifest, licenseInGrace, pastGraceDate),
  'Add-on is disabled when beyond grace period cutoff'
);

// 2.6 Revoked License
const revokedLicense: LicenseEntitlement = {
  ...activeLicense,
  status: 'revoked',
};
assert(!isModuleLicensed(validToursManifest, revokedLicense, baseDate), 'Revoked license completely disables Add-ons');
assert(isModuleLicensed(validCoreManifest, revokedLicense, baseDate), 'Core platform remains accessible even if license revoked');

// ============================================================================
// 3. Feature Entitlement Evaluation
// ============================================================================

const grantedFeat = isFeatureLicensed('tours.builder', validToursManifest, activeLicense, baseDate);
assert(grantedFeat.isEntitled, 'Granted module feature is entitled');

const ungrantedFeat = isFeatureLicensed('tours.advanced_pricing', validToursManifest, activeLicense, baseDate);
assert(!ungrantedFeat.isEntitled, 'Un-granted tier feature is correctly rejected');

const coreFeat = isFeatureLicensed('core.audit', validCoreManifest, null, baseDate);
assert(coreFeat.isEntitled, 'Core module feature is entitled without license');

// ============================================================================
// 4. Full Capability Resolution & Warning Reporting
// ============================================================================

const fullCaps = resolveLicenseCapabilities(
  [validCoreManifest, validToursManifest, plannedHotelsManifest],
  licenseInGrace,
  baseDate
);

assert(fullCaps.isOperational, 'Installation is operational');
assert(fullCaps.activeModuleIds.has('core'), 'Capabilities include core');
assert(fullCaps.activeModuleIds.has('tours'), 'Capabilities include licensed tours');
assert(!fullCaps.activeModuleIds.has('hotels'), 'Unlicensed/planned hotels excluded');
assert(fullCaps.activeFeatureKeys.has('tours.builder'), 'Features include tours.builder');
assert(!fullCaps.activeFeatureKeys.has('tours.advanced_pricing'), 'Features exclude ungranted pricing');
assert(fullCaps.warnings.length > 0, 'Grace period warning emitted');

console.log(`\nResults: ${passedTests}/${totalTests} tests passed.`);
if (process.exitCode === 1) {
  console.error('Test suite failed!');
  process.exit(1);
} else {
  console.log('All Phase 1B commercial licensing and contract tests passed successfully!\n');
}
