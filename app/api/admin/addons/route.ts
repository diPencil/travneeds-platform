/**
 * Administrative API: Add-ons & Licensing Management
 *
 * GET  — Returns current installation identity, license status, and module catalogue
 * POST — Submits a license key for verification with Central License Server (Super Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireStaff } from '@/lib/server/guards';
import {
  getAddonsDashboardState,
  getInstallationIdentity,
  verifyLicenseWithCentralServer,
} from '@/lib/server/license-client';

export async function GET() {
  try {
    // Only authenticated staff with settings or dashboard view access
    await requireStaff();
    const state = await getAddonsDashboardState();
    return NextResponse.json(state);
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json(
      { error: error.message || 'Failed to load Add-ons state' },
      { status }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Strict governance: ONLY Super Admin may submit or mutate commercial licenses
    const user = await requireStaff();
    if (!user.roles.includes('SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Only Super Admins can manage commercial license activation.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { licenseKey } = body;

    if (!licenseKey || typeof licenseKey !== 'string') {
      return NextResponse.json(
        { error: 'Valid license key string is required.' },
        { status: 400 }
      );
    }

    const installation = await getInstallationIdentity();
    const result = await verifyLicenseWithCentralServer(licenseKey, installation);

    if (!result.isValid) {
      return NextResponse.json(
        {
          success: false,
          status: result.status,
          message: result.message || 'License verification failed.',
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      message: 'License verified successfully.',
    });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json(
      { error: error.message || 'Failed to process license activation' },
      { status }
    );
  }
}
