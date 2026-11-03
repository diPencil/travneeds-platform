import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/server/auth';
import { createRoomType } from '@/lib/server/hotels';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!hasPermission(user, 'hotels.edit')) {
    return NextResponse.json({ error: 'Forbidden: Missing hotels.edit permission.' }, { status: 403 });
  }

  const { id: hotelId } = await params;
  try {
    const body = await request.json();
    const roomType = await createRoomType(hotelId, body);
    return NextResponse.json({ roomType }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create room type.' }, { status: 400 });
  }
}

