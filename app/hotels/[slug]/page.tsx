import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getHotelBySlug } from '@/lib/server/hotels';
import { HotelDetailPage } from '@/components/hotels/hotel-detail-page';
import { getSiteUrl, getHreflangEntries } from '@/lib/seo';
import { generateHotelJsonLd, renderJsonLd } from '@/lib/structured-data';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hotel = await getHotelBySlug(slug, true);
  if (!hotel) return {};

  const siteUrl = await getSiteUrl();
  const hreflang = await getHreflangEntries(`/hotels/${hotel.slug}`);

  const title = `${hotel.name} | Hotels in ${hotel.city} | TravNeeds`;
  const description = hotel.seoDescription || hotel.description.slice(0, 160).replace(/<[^>]*>/g, '') || `Stay at ${hotel.name} in ${hotel.city}. Book live room rates with instant availability.`;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `${siteUrl}/hotels/${hotel.slug}`,
      languages: hreflang,
    },
    openGraph: {
      title,
      description,
      images: hotel.coverImage ? [{ url: hotel.coverImage }] : undefined,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hotel = await getHotelBySlug(slug, true);

  if (!hotel) {
    notFound();
  }

  const jsonLd = generateHotelJsonLd({
    name: hotel.name,
    description: hotel.seoDescription || hotel.description,
    city: hotel.city,
    countryCode: hotel.countryCode,
    address: hotel.address,
    postalCode: hotel.postalCode,
    latitude: hotel.latitude ? Number(hotel.latitude) : null,
    longitude: hotel.longitude ? Number(hotel.longitude) : null,
    phone: hotel.phone,
    starRating: hotel.starRating,
    coverImage: hotel.coverImage,
    slug: hotel.slug,
  });

  return (
    <>
      {renderJsonLd(jsonLd)}
      <HotelDetailPage hotel={hotel as any} />
    </>
  );
}

