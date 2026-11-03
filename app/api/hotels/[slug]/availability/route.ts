import { NextResponse } from 'next/server';
import { getHotelStayQuote } from '@/lib/server/hotels';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);

  const checkInDate = searchParams.get('checkIn') || searchParams.get('checkInDate');
  const checkOutDate = searchParams.get('checkOut') || searchParams.get('checkOutDate');

  if (!checkInDate || !checkOutDate) {
    return NextResponse.json(
      { error: 'checkIn and checkOut date parameters (YYYY-MM-DD) are required.' },
      { status: 400 },
    );
  }

  const adults = Number.parseInt(searchParams.get('adults') || '2', 10);
  const children = Number.parseInt(searchParams.get('children') || '0', 10);
  const roomsRequested = Number.parseInt(searchParams.get('rooms') || '1', 10);

  try {
    const quote = await getHotelStayQuote(slug, {
      checkInDate,
      checkOutDate,
      adults: Number.isFinite(adults) && adults > 0 ? adults : 2,
      children: Number.isFinite(children) && children >= 0 ? children : 0,
      roomsRequested: Number.isFinite(roomsRequested) && roomsRequested > 0 ? roomsRequested : 1,
    });

    return NextResponse.json(quote);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to check stay availability.' }, { status: 400 });
  }
}

