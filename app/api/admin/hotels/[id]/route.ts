import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/server/auth';
import { getHotelById, updateHotel, deleteHotel } from '@/lib/server/hotels';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!hasPermission(user, 'hotels.view')) {
    return NextResponse.json({ error: 'Forbidden: Missing hotels.view permission.' }, { status: 403 });
  }

  const { id } = await params;
  try {
    const hotel = await getHotelById(id);
    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found.' }, { status: 404 });
    }
    return NextResponse.json({ hotel });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch hotel.' }, { status: 500 });
  }
}

export async function PUT(
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

  const { id } = await params;
  try {
    const body = await request.json();
    const updated = await updateHotel(id, {
      hotel: body.hotel || body,
      policy: body.policy,
    });
    return NextResponse.json({ hotel: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update hotel.' }, { status: 400 });
  }
}

export async function DELETE(
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

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const forceArchive = searchParams.get('archive') === 'true';

  try {
    await deleteHotel(id, forceArchive);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const isConflict = err.message && err.message.includes('historical booking');
    return NextResponse.json(
      { error: err.message || 'Failed to delete hotel.' },
      { status: isConflict ? 409 : 400 },
    );
  }
}

