import { NextResponse } from 'next/server';
import { getHotelBySlug } from '@/lib/server/hotels';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  try {
    const hotel = await getHotelBySlug(slug, true);
    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found or not published.' }, { status: 404 });
    }
    return NextResponse.json({ hotel });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch hotel.' }, { status: 500 });
  }
}

