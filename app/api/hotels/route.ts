import { NextResponse } from 'next/server';
import { listHotels } from '@/lib/server/hotels';
import { db } from '@/lib/server/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || searchParams.get('query') || undefined;
  const city = searchParams.get('city') || searchParams.get('destination') || undefined;
  const propertyType = searchParams.get('propertyType') || undefined;
  const starRatingStr = searchParams.get('stars') || searchParams.get('starRating');
  const starRating = starRatingStr ? Number.parseInt(starRatingStr, 10) : undefined;
  const pageStr = searchParams.get('page');
  const page = pageStr ? Number.parseInt(pageStr, 10) : 1;
  const limitStr = searchParams.get('limit');
  const limit = limitStr ? Number.parseInt(limitStr, 10) : 12;

  try {
    const [result, publishedCities, publishedTypes] = await Promise.all([
      listHotels({
        query: q,
        city,
        propertyType,
        starRating,
        status: 'PUBLISHED',
        page,
        limit,
      }),
      db.hotel.findMany({
        where: { status: 'PUBLISHED' },
        select: { city: true },
        distinct: ['city'],
      }),
      db.hotel.findMany({
        where: { status: 'PUBLISHED' },
        select: { propertyType: true },
        distinct: ['propertyType'],
      }),
    ]);

    const destinations = publishedCities.map((c) => c.city).filter(Boolean).sort();
    const propertyTypes = publishedTypes.map((t) => t.propertyType).filter(Boolean).sort();

    return NextResponse.json({
      ...result,
      destinations,
      propertyTypes,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to list published hotels.' }, { status: 500 });
  }
}

