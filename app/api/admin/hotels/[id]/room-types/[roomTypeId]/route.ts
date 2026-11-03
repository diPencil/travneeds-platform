import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/server/auth';
import { updateRoomType, deleteRoomType } from '@/lib/server/hotels';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; roomTypeId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!hasPermission(user, 'hotels.edit')) {
    return NextResponse.json({ error: 'Forbidden: Missing hotels.edit permission.' }, { status: 403 });
  }

  const { roomTypeId } = await params;
  try {
    const body = await request.json();
    const updated = await updateRoomType(roomTypeId, body);
    return NextResponse.json({ roomType: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update room type.' }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; roomTypeId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!hasPermission(user, 'hotels.edit')) {
    return NextResponse.json({ error: 'Forbidden: Missing hotels.edit permission.' }, { status: 403 });
  }

  const { roomTypeId } = await params;
  try {
    await deleteRoomType(roomTypeId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const isConflict = err.message && err.message.includes('historical bookings');
    return NextResponse.json(
      { error: err.message || 'Failed to delete room type.' },
      { status: isConflict ? 409 : 400 },
    );
  }
}

