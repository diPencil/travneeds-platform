import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        q,
      )}&format=json&addressdetails=1&limit=5`,
      {
        headers: {
          'User-Agent': 'TravNeeds-App/1.0 (travel@travneeds.com)',
          'Accept-Language': 'en,ar',
        },
        signal: controller.signal,
      },
    );

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data: Array<{
      display_name: string;
      lat: string;
      lon: string;
      name?: string;
    }> = await res.json();

    const results = data.map((item) => ({
      name: item.name || item.display_name.split(',')[0].trim(),
      displayName: item.display_name,
      lat: item.lat,
      lng: item.lon,
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}

