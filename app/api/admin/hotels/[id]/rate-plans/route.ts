import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/server/auth';
import { createRatePlan } from '@/lib/server/hotels';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!hasPermission(user, 'hotels.rates')) {
    return NextResponse.json({ error: 'Forbidden: Missing hotels.rates permission.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!body.roomTypeId) {
      return NextResponse.json({ error: 'roomTypeId is required.' }, { status: 400 });
    }
    const ratePlan = await createRatePlan(body.roomTypeId, body);
    return NextResponse.json({ ratePlan }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create rate plan.' }, { status: 400 });
  }
}

