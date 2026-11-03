import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/server/auth';
import { getRoomInventory, bulkUpdateInventory } from '@/lib/server/hotels';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!hasPermission(user, 'hotels.manage')) {
    return NextResponse.json({ error: 'Forbidden: Missing hotels.manage permission.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const roomTypeId = searchParams.get('roomTypeId');
  if (!roomTypeId) {
    return NextResponse.json({ error: 'roomTypeId query parameter is required.' }, { status: 400 });
  }

  const now = new Date();
  const defaultStart = now.toISOString().slice(0, 10);
  const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const defaultEnd = future.toISOString().slice(0, 10);

  const startDate = searchParams.get('startDate') || defaultStart;
  const endDate = searchParams.get('endDate') || defaultEnd;

  try {
    const days = await getRoomInventory(roomTypeId, startDate, endDate);
    return NextResponse.json({ days, startDate, endDate });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch inventory.' }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!hasPermission(user, 'hotels.manage')) {
    return NextResponse.json({ error: 'Forbidden: Missing hotels.manage permission.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!body.roomTypeId) {
      return NextResponse.json({ error: 'roomTypeId is required.' }, { status: 400 });
    }
    if (!body.startDate || !body.endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required.' }, { status: 400 });
    }

    const result = await bulkUpdateInventory({
      roomTypeId: body.roomTypeId,
      startDate: body.startDate,
      endDate: body.endDate,
      totalRooms: body.totalRooms !== undefined ? Number(body.totalRooms) : undefined,
      stopSale: body.stopSale !== undefined ? Boolean(body.stopSale) : undefined,
      closedToArrival: body.closedToArrival !== undefined ? Boolean(body.closedToArrival) : undefined,
      closedToDeparture: body.closedToDeparture !== undefined ? Boolean(body.closedToDeparture) : undefined,
      ratePlanOverrides: body.ratePlanOverrides,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update inventory.' }, { status: 400 });
  }
}

