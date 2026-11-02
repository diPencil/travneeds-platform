/**
 * Test stub for pure verification logic without database access
 */
import type { InstallationIdentity, LicenseVerificationResult } from '@/lib/modules/entitlements';

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

  if (!serverEndpoint) {
    return {
      isValid: false,
      status: 'unlicensed',
      message: 'Central License Server endpoint is not configured (TRAVNEEDS_LICENSE_SERVER_URL is missing). Activation cannot be verified.',
      checkedAt: new Date(),
      isOfflineVerification: false,
    };
  }

  return {
    isValid: false,
    status: 'unlicensed',
    message: 'Central License Server integration pending deployment.',
    checkedAt: new Date(),
    isOfflineVerification: false,
  };
}

export async function getInstallationIdentity(): Promise<InstallationIdentity> {
  return {
    installationId: 'inst_test_001',
    customerName: 'Test Agency',
    contactEmail: 'admin@agency.com',
    domain: 'portal.agency.com',
    environment: 'testing',
    provisionedAt: new Date('2026-01-01T00:00:00Z'),
  };
}

