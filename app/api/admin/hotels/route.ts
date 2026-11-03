import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/server/auth';
import { listHotels, createHotel } from '@/lib/server/hotels';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!hasPermission(user, 'hotels.view')) {
    return NextResponse.json({ error: 'Forbidden: Missing hotels.view permission.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || undefined;
  const status = searchParams.get('status') || undefined;
  const propertyType = searchParams.get('propertyType') || undefined;
  const starRatingStr = searchParams.get('starRating');
  const starRating = starRatingStr ? Number.parseInt(starRatingStr, 10) : undefined;
  const city = searchParams.get('city') || undefined;
  const pageStr = searchParams.get('page');
  const page = pageStr ? Number.parseInt(pageStr, 10) : 1;
  const limitStr = searchParams.get('limit');
  const limit = limitStr ? Number.parseInt(limitStr, 10) : 20;

  try {
    const result = await listHotels({
      query,
      status,
      propertyType,
      starRating,
      city,
      page,
      limit,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to list hotels.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!hasPermission(user, 'hotels.edit')) {
    return NextResponse.json({ error: 'Forbidden: Missing hotels.edit permission.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const hotel = await createHotel({
      hotel: body.hotel || body,
      policy: body.policy,
    });
    return NextResponse.json({ hotel }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create hotel.' }, { status: 400 });
  }
}

