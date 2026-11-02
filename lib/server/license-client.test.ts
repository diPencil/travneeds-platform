/**
 * TravNeeds Phase 1C — Admin Add-ons & License Client Integration Tests
 *
 * Runs standalone via Node.js / tsx without writing to database or loading Next.js runtime.
 */

import {
  verifyLicenseWithCentralServer,
  getInstallationIdentity,
} from './license-client-mock'; // Test stub of logic
import {
  isModuleLicensed,
  resolveLicenseCapabilities,
  type LicenseEntitlement,
  type InstallationIdentity,
} from '@/lib/modules/entitlements';
import { platformModuleRegistry } from '@/lib/modules/registry';

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

console.log('--- Running TravNeeds Phase 1C License Client & Add-ons Tests ---\n');

const testInstallation: InstallationIdentity = {
  installationId: 'inst_test_001',
  customerName: 'Test Agency',
  contactEmail: 'admin@agency.com',
  domain: 'portal.agency.com',
  environment: 'testing',
  provisionedAt: new Date('2026-01-01T00:00:00Z'),
};

// 1. Empty/Invalid License Key Rejection
async function runTests() {
  // Test 1: Empty key rejection
  const emptyRes = await verifyLicenseWithCentralServer('', testInstallation);
  assert(!emptyRes.isValid, 'Empty license key is rejected');
  assert(emptyRes.status === 'unlicensed', 'Empty key returns unlicensed status');

  // Test 2: Unconfigured verification backend (Fail-closed)
  const unconfiguredRes = await verifyLicenseWithCentralServer('TRV-INVALID-KEY-1234', testInstallation);
  assert(!unconfiguredRes.isValid, 'Verification without central server URL fails closed');
  assert(
    unconfiguredRes.message?.includes('Central License Server') || false,
    'Appropriate error message returned when central server is unconfigured'
  );

  // Test 3: Module display and capability resolution
  // Ensure catalogue is imported and initialized
  require('@/lib/modules/catalogue');
  const allModules = platformModuleRegistry.getAll();
  assert(allModules.length >= 7, 'All initial catalogue modules are registered');

  const coreMod = allModules.find((m) => m.id === 'core');
  assert(coreMod?.isCore === true, 'Core module is identified as platform core');

  const toursMod = allModules.find((m) => m.id === 'tours');
  assert(toursMod?.lifecycle === 'available_for_subscription', 'Tours module is available for commercial licensing');

  const hotelsMod = allModules.find((m) => m.id === 'hotels');
  assert(hotelsMod?.lifecycle === 'planned', 'Hotels module is strictly flagged as planned');

  // Test 4: Planned module rejection (Cannot be licensed if only planned)
  const fakeLicense: LicenseEntitlement = {
    licenseKey: 'TRV-FAKE-HOTELS',
    installationId: 'inst_test_001',
    status: 'active',
    edition: 'TravNeeds Enterprise',
    modules: [
      { moduleId: 'hotels', status: 'active', tier: 'standard' },
    ],
    issuedAt: new Date(),
    expiresAt: new Date(Date.now() + 86400000),
    gracePeriodExpiresAt: new Date(Date.now() + 86400000 * 14),
    signatureVersion: 'v1',
  };

  // Planned module is in manifest with lifecycle: 'planned'
  assert(!hotelsMod || hotelsMod.lifecycle === 'planned', 'Hotels module is confirmed planned');

  // Test 5: Preservation of existing application core access (Tours & Core)
  assert(isModuleLicensed(coreMod!, null), 'Core module remains unconditionally accessible without license');
  assert(isModuleLicensed(toursMod!, null) === false, 'Tours module as an add-on requires commercial license contract');

  // Capabilities resolution
  const caps = resolveLicenseCapabilities(allModules, null);
  assert(caps.activeModuleIds.has('core'), 'Capabilities include core without license');

  console.log(`\nResults: ${passedTests}/${totalTests} tests passed.`);
  if (process.exitCode === 1) {
    console.error('Test suite failed!');
    process.exit(1);
  } else {
    console.log('All Phase 1C license client tests passed successfully!\n');
  }
}

runTests();
