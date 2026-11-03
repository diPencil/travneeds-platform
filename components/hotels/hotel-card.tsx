'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, Building2, Check, Sparkles, ArrowRight } from 'lucide-react';
import { formatPrice, tx, useLocale } from '@/components/locale';
import { CardGallery } from '@/components/site';
import type { PublicHotelListItem } from '@/lib/hotels/hotels-client';

const FALLBACK_HOTEL_IMAGES = [
  '/egypt-hero.png',
  '/day-tour.png',
  '/cruises.png',
  '/shore.png',
];

export interface HotelCardProps {
  hotel: PublicHotelListItem;
  variant?: 'grid' | 'list';
}

export function HotelCard({ hotel, variant = 'grid' }: HotelCardProps) {
  const { currency, locale } = useLocale();
  const ar = locale === 'ar';

  const href = `/hotels/${hotel.slug}`;
  const title = (ar && hotel.nameAr) ? hotel.nameAr : hotel.name;

  const gallery = useMemo(() => {
    if (hotel.gallery && hotel.gallery.length > 0) {
      return hotel.coverImage ? [hotel.coverImage, ...hotel.gallery.filter((u) => u !== hotel.coverImage)] : hotel.gallery;
    }
    if (hotel.coverImage) {
      return [hotel.coverImage];
    }
    return FALLBACK_HOTEL_IMAGES;
  }, [hotel.coverImage, hotel.gallery]);

  const propertyTypeLabel = useMemo(() => {
    const map: Record<string, { en: string; ar: string; es: string; it: string }> = {
      HOTEL: { en: 'Hotel', ar: 'فندق', es: 'Hotel', it: 'Hotel' },
      RESORT: { en: 'Resort', ar: 'منتجع', es: 'Resort', it: 'Resort' },
      BOUTIQUE: { en: 'Boutique Hotel', ar: 'فندق بوتيك', es: 'Hotel boutique', it: 'Boutique hotel' },
      APARTMENT: { en: 'Apartment', ar: 'شقة فندقية', es: 'Apartamento', it: 'Appartamento' },
      VILLA: { en: 'Villa', ar: 'فيلا', es: 'Villa', it: 'Villa' },
      MOTEL: { en: 'Motel', ar: 'موتيل', es: 'Motel', it: 'Motel' },
      GUESTHOUSE: { en: 'Guesthouse', ar: 'بيت ضيافة', es: 'Pensión', it: 'Pensione' },
      BED_AND_BREAKFAST: { en: 'Bed & Breakfast', ar: 'مبيت وإفطار', es: 'B&B', it: 'B&B' },
    };
    const t = map[hotel.propertyType] || { en: hotel.propertyType, ar: hotel.propertyType, es: hotel.propertyType, it: hotel.propertyType };
    return tx(locale, t);
  }, [hotel.propertyType, locale]);

  const stars = hotel.starRating && hotel.starRating > 0 ? Math.min(5, Math.max(1, hotel.starRating)) : null;

  return (
    <article className={`tour-card hotel-card ${variant === 'list' ? 'list-view' : ''}`}>
      <div className="tour-image">
        <CardGallery images={gallery} title={title} href={href} />
        {stars && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              insetInlineEnd: 10,
              zIndex: 3,
              background: 'rgba(13, 34, 80, 0.85)',
              color: '#f59e0b',
              padding: '4px 8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              fontSize: '11px',
              fontWeight: 700,
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              backdropFilter: 'blur(4px)',
            }}
          >
            {Array.from({ length: stars }).map((_, i) => (
              <Star key={i} size={11} fill="currentColor" strokeWidth={0} />
            ))}
          </div>
        )}
      </div>

      <div className="tour-body">
        <div className="meta">
          <span>◉ {hotel.city}</span>
          <em>{propertyTypeLabel}</em>
        </div>

        <h3>
          <Link href={href}>{title}</Link>
        </h3>

        {hotel.amenities && hotel.amenities.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 5,
              margin: '6px 0 10px',
            }}
          >
            {hotel.amenities.slice(0, 3).map((amenity) => (
              <span
                key={amenity}
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#475569',
                  background: '#f1f5f9',
                  padding: '2px 7px',
                  borderRadius: '5px',
                }}
              >
                {amenity}
              </span>
            ))}
            {hotel.amenities.length > 3 && (
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                +{hotel.amenities.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="tour-bottom">
          <div>
            <small>
              {tx(locale, {
                en: 'Starting From',
                es: 'Desde',
                it: 'A partire da',
                ar: 'يبدأ من',
              })}
            </small>
            <strong>
              {hotel.startingPrice !== undefined ? (
                formatPrice(hotel.startingPrice, currency, locale)
              ) : (
                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                  {tx(locale, {
                    en: 'Check dates',
                    es: 'Ver fechas',
                    it: 'Verifica date',
                    ar: 'اختر التواريخ',
                  })}
                </span>
              )}
            </strong>
          </div>

          <Link
            href={href}
            className="primary-btn"
            style={{
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: 700,
              borderRadius: '8px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>
              {tx(locale, {
                en: 'View Rooms',
                es: 'Ver habitaciones',
                it: 'Vedi camere',
                ar: 'عرض الغرف',
              })}
            </span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}

