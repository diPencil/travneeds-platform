import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/server/auth';
import { updateRatePlan, deleteRatePlan } from '@/lib/server/hotels';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; ratePlanId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!hasPermission(user, 'hotels.rates')) {
    return NextResponse.json({ error: 'Forbidden: Missing hotels.rates permission.' }, { status: 403 });
  }

  const { ratePlanId } = await params;
  try {
    const body = await request.json();
    const updated = await updateRatePlan(ratePlanId, body);
    return NextResponse.json({ ratePlan: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update rate plan.' }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; ratePlanId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!hasPermission(user, 'hotels.rates')) {
    return NextResponse.json({ error: 'Forbidden: Missing hotels.rates permission.' }, { status: 403 });
  }

  const { ratePlanId } = await params;
  try {
    await deleteRatePlan(ratePlanId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const isConflict = err.message && err.message.includes('historical bookings');
    return NextResponse.json(
      { error: err.message || 'Failed to delete rate plan.' },
      { status: isConflict ? 409 : 400 },
    );
  }
}

