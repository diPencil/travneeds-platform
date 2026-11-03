'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Star,
  Clock3,
  Building2,
  CalendarDays,
  Users,
  ShieldCheck,
  Check,
  Share2,
  Heart,
  ArrowRight,
  Info,
  Phone,
  Mail,
  Globe,
  Sparkles,
} from 'lucide-react';
import { SiteShell, Breadcrumb, HelpCTA } from '@/components/site';
import { DateInput } from '@/components/date-input';
import { RichTextRenderer } from '@/components/rich-text-renderer';
import { formatPrice, tx, useLocale } from '@/components/locale';
import { useCustomerFavorites } from '@/lib/customer-account';
import { RoomSelectionCard } from './room-selection-card';
import { useHotelAvailability, type HotelDetailResponse } from '@/lib/hotels/hotels-client';

export interface HotelDetailPageProps {
  hotel: HotelDetailResponse;
}

export function HotelDetailPage({ hotel }: HotelDetailPageProps) {
  const { currency, locale } = useLocale();
  const ar = locale === 'ar';
  const favorites = useCustomerFavorites();
  const isFavorite = favorites.has(`hotel-${hotel.slug}`);

  // Default dates: tomorrow to +3 days
  const today = new Date();
  const checkInDefault = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const checkOutDefault = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [checkInDate, setCheckInDate] = useState(checkInDefault);
  const [checkOutDate, setCheckOutDate] = useState(checkOutDefault);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [roomsRequested, setRoomsRequested] = useState(1);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'facilities' | 'policies' | 'location'>('rooms');
  const [selectedImage, setSelectedImage] = useState(0);
  const [copied, setCopied] = useState(false);

  // Gallery
  const gallery = useMemo(() => {
    const list = [];
    if (hotel.coverImage) list.push(hotel.coverImage);
    if (hotel.gallery && hotel.gallery.length > 0) {
      for (const img of hotel.gallery) {
        if (!list.includes(img)) list.push(img);
      }
    }
    if (list.length === 0) list.push('/egypt-hero.png');
    return list;
  }, [hotel.coverImage, hotel.gallery]);

  // Live Stay Availability Quote
  const { quote, loading: quoteLoading, error: quoteError } = useHotelAvailability(hotel.slug, {
    checkInDate,
    checkOutDate,
    adults,
    children,
    roomsRequested,
  });

  const hotelTitle = (ar && hotel.nameAr) ? hotel.nameAr : hotel.name;
  const stars = hotel.starRating && hotel.starRating > 0 ? Math.min(5, Math.max(1, hotel.starRating)) : null;

  const shareHotel = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: hotelTitle, url });
      } catch {
        /* cancelled */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  // Find selected rate plan details for side booking card
  const selectedPlanDetails = useMemo(() => {
    if (!selectedPlanId || !quote) return null;
    for (const rt of quote.roomTypes) {
      for (const p of rt.plans) {
        if (p.ratePlan.id === selectedPlanId) {
          return {
            roomType: rt.roomType,
            ratePlan: p.ratePlan,
            calculation: p.calculation,
          };
        }
      }
    }
    return null;
  }, [selectedPlanId, quote]);

  const tabs = [
    { id: 'rooms', label: tx(locale, { en: 'Rooms & Rates', ar: 'الغرف والأسعار', es: 'Habitaciones', it: 'Camere e tariffe' }) },
    { id: 'overview', label: tx(locale, { en: 'Overview', ar: 'نظرة عامة', es: 'Resumen', it: 'Panoramica' }) },
    { id: 'facilities', label: tx(locale, { en: 'Facilities', ar: 'المرافق والخدمات', es: 'Instalaciones', it: 'Servizi' }) },
    { id: 'policies', label: tx(locale, { en: 'Policies', ar: 'سياسات الإقامة', es: 'Políticas', it: 'Politiche' }) },
    { id: 'location', label: tx(locale, { en: 'Location', ar: 'الموقع', es: 'Ubicación', it: 'Posizione' }) },
  ] as const;

  return (
    <SiteShell>
      <Breadcrumb
        items={[
          tx(locale, { en: 'Hotels', ar: 'الفنادق', es: 'Hoteles', it: 'Hotel' }),
          hotel.city,
          hotelTitle,
        ]}
      />

      <main className="tour-detail-page container" style={{ marginTop: '16px' }}>
        {/* Header */}
        <header className="tour-detail-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="eyebrow" style={{ margin: 0 }}>
                {hotel.propertyType}
              </span>
              {stars && (
                <div style={{ display: 'inline-flex', alignItems: 'center', color: '#f59e0b', gap: '2px' }}>
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
              )}
            </div>
            <h1>{hotelTitle}</h1>
            <p style={{ margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '13.5px' }}>
              <MapPin size={15} color="#2563eb" />
              <span>{hotel.address}, {hotel.city}, {hotel.countryCode}</span>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className={`tour-favorite ${isFavorite ? 'active' : ''}`}
              onClick={() => favorites.toggle(`hotel-${hotel.slug}`)}
              aria-label="Save hotel"
            >
              <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              className="tour-favorite"
              onClick={shareHotel}
              aria-label="Share hotel"
              title={copied ? 'Copied!' : 'Share'}
            >
              {copied ? <Check size={18} color="#16a34a" /> : <Share2 size={18} />}
            </button>
          </div>
        </header>

        {/* 2-Column Responsive Layout */}
        <div className="tour-detail-layout">
          {/* Main Column */}
          <section className="tour-detail-main">
            {/* Gallery */}
            <div className="tour-gallery">
              <div className="tour-gallery-main">
                <Image
                  src={gallery[selectedImage]}
                  alt={`${hotelTitle} - image ${selectedImage + 1}`}
                  fill
                  priority
                  sizes="(max-width: 900px) 100vw, 65vw"
                />
                {gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous image"
                      className="gallery-arrow left"
                      onClick={() => setSelectedImage((selectedImage + gallery.length - 1) % gallery.length)}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      aria-label="Next image"
                      className="gallery-arrow right"
                      onClick={() => setSelectedImage((selectedImage + 1) % gallery.length)}
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
              {gallery.length > 1 && (
                <div className="tour-thumbs">
                  {gallery.map((img, index) => (
                    <button
                      key={img}
                      type="button"
                      className={selectedImage === index ? 'active' : ''}
                      onClick={() => setSelectedImage(index)}
                      aria-label={`Thumbnail ${index + 1}`}
                    >
                      <Image src={img} alt="" fill sizes="90px" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Facts Bar */}
            <div className="tour-facts">
              <span>
                <Building2 size={18} />
                <b>{tx(locale, { en: 'Type', ar: 'النوع', es: 'Tipo', it: 'Tipo' })}</b> {hotel.propertyType}
              </span>
              <span>
                <Clock3 size={18} />
                <b>{tx(locale, { en: 'Check-in', ar: 'الوصول', es: 'Entrada', it: 'Check-in' })}</b> {hotel.checkInTime}
              </span>
              <span>
                <Clock3 size={18} />
                <b>{tx(locale, { en: 'Check-out', ar: 'المغادرة', es: 'Salida', it: 'Check-out' })}</b> {hotel.checkOutTime}
              </span>
              {hotel.phone && (
                <span>
                  <Phone size={18} />
                  <b>{tx(locale, { en: 'Phone', ar: 'الهاتف', es: 'Tel', it: 'Tel' })}</b> {hotel.phone}
                </span>
              )}
            </div>

            {/* Navigation Tabs */}
            <nav className="tour-tabs" style={{ marginBottom: '24px' }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={activeTab === tab.id ? 'active' : ''}
                  onClick={() => {
                    setActiveTab(tab.id);
                    document.getElementById(`hotel-section-${tab.id}`)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Interactive Stay Selector Bar */}
            <div
              style={{
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '16px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px',
                alignItems: 'flex-end',
              }}
            >
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  {tx(locale, { en: 'Check-in Date', ar: 'تاريخ الوصول', es: 'Fecha de entrada', it: 'Data di arrivo' })}
                </label>
                <DateInput value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  {tx(locale, { en: 'Check-out Date', ar: 'تاريخ المغادرة', es: 'Fecha de salida', it: 'Data di partenza' })}
                </label>
                <DateInput value={checkOutDate} onChange={(e) => setCheckOutDate(e.target.value)} />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  {tx(locale, { en: 'Adults (12+)', ar: 'البالغين', es: 'Adultos', it: 'Adulti' })}
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={adults}
                  onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  {tx(locale, { en: 'Children (0-11)', ar: 'الأطفال', es: 'Niños', it: 'Bambini' })}
                </label>
                <input
                  type="number"
                  min="0"
                  max="6"
                  value={children}
                  onChange={(e) => setChildren(Math.max(0, Number(e.target.value)))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  {tx(locale, { en: 'Rooms', ar: 'الغرف', es: 'Habitaciones', it: 'Camere' })}
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={roomsRequested}
                  onChange={(e) => setRoomsRequested(Math.max(1, Number(e.target.value)))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                />
              </div>
            </div>

            {/* Section 1: Rooms & Rates */}
            <section id="hotel-section-rooms" className="tour-content-section" style={{ paddingTop: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ margin: 0 }}>
                  {tx(locale, {
                    en: 'Available Rooms & Rates',
                    ar: 'الغرف وخطط الأسعار المتاحة',
                    es: 'Habitaciones y tarifas disponibles',
                    it: 'Camere e tariffe disponibili',
                  })}
                </h2>
                {quoteLoading && (
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {tx(locale, { en: 'Checking live rates...', ar: 'جارٍ حساب الأسعار المباشرة...', es: 'Verificando...', it: 'Verifica in corso...' })}
                  </span>
                )}
              </div>

              {quote?.roomTypes && quote.roomTypes.length > 0 ? (
                <div>
                  {quote.roomTypes.map((item) => (
                    <RoomSelectionCard
                      key={item.roomType.id}
                      roomType={item.roomType}
                      plans={item.plans}
                      selectedPlanId={selectedPlanId}
                      onSelectPlan={(id) => setSelectedPlanId(id)}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
                  <p style={{ margin: 0, color: '#64748b' }}>
                    {tx(locale, {
                      en: 'No room rates configured for the selected dates. Please adjust your dates.',
                      ar: 'لا توجد خطط أسعار مهيأة لهذه التواريخ، يرجى تجربة تواريخ أخرى.',
                      es: 'No hay tarifas disponibles para estas fechas.',
                      it: 'Nessuna tariffa disponibile per queste date.',
                    })}
                  </p>
                </div>
              )}
            </section>

            {/* Section 2: Overview */}
            <section id="hotel-section-overview" className="tour-content-section">
              <h2>{tx(locale, { en: 'Property Overview', ar: 'نظرة عامة على الفندق', es: 'Resumen', it: 'Panoramica' })}</h2>
              <div className="overview-grid">
                <div>
                  <small>{tx(locale, { en: 'Property Type', ar: 'نوع المنشأة', es: 'Tipo', it: 'Tipo' })}</small>
                  <b>{hotel.propertyType}</b>
                </div>
                <div>
                  <small>{tx(locale, { en: 'Location', ar: 'الموقع', es: 'Ubicación', it: 'Posizione' })}</small>
                  <b>{hotel.city}, {hotel.countryCode}</b>
                </div>
              </div>
              {hotel.description ? (
                <RichTextRenderer content={hotel.description} />
              ) : (
                <p>
                  {tx(locale, {
                    en: 'Experience premium lodging, comfort, and exceptional service in Egypt.',
                    ar: 'تمتع بإقامة متميزة وراحة تامة وخدمة استثنائية في مصر.',
                    es: 'Disfruta de una estancia excepcional en Egipto.',
                    it: 'Vivi un soggiorno eccezionale in Egitto.',
                  })}
                </p>
              )}
            </section>

            {/* Section 3: Facilities & Amenities */}
            <section id="hotel-section-facilities" className="tour-content-section">
              <h2>{tx(locale, { en: 'Hotel Facilities & Amenities', ar: 'مرافق وخدمات الفندق', es: 'Servicios', it: 'Servizi' })}</h2>
              {hotel.amenities && hotel.amenities.length > 0 ? (
                <ul className="check-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                  {hotel.amenities.map((item) => (
                    <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Check size={16} color="#16a34a" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#64748b' }}>
                  {tx(locale, { en: 'Standard hotel amenities available upon request.', ar: 'الخدمات الفندقية الأساسية متاحة عند الطلب.', es: 'Servicios estándar disponibles.', it: 'Servizi standard disponibili.' })}
                </p>
              )}
            </section>

            {/* Section 4: Policies */}
            <section id="hotel-section-policies" className="tour-content-section">
              <h2>{tx(locale, { en: 'Hotel Policies & House Rules', ar: 'سياسات وقواعد الإقامة', es: 'Políticas', it: 'Regole' })}</h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ padding: '14px 18px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fafbfc' }}>
                  <strong style={{ display: 'block', fontSize: '13px', color: '#0d2250', marginBottom: 4 }}>
                    {tx(locale, { en: 'Check-in & Check-out Times', ar: 'مواعيد الوصول والمغادرة', es: 'Horarios', it: 'Orari' })}
                  </strong>
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>
                    {tx(locale, {
                      en: `Check-in starts at ${hotel.checkInTime}. Check-out is until ${hotel.checkOutTime}.`,
                      ar: `يبدأ تسجيل الوصول من ${hotel.checkInTime}، وتسجيل المغادرة حتى ${hotel.checkOutTime}.`,
                      es: `Entrada a partir de ${hotel.checkInTime}. Salida hasta ${hotel.checkOutTime}.`,
                      it: `Check-in dalle ${hotel.checkInTime}. Check-out entro le ${hotel.checkOutTime}.`,
                    })}
                  </p>
                </div>

                {hotel.policy && (
                  <>
                    <div style={{ padding: '14px 18px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fafbfc' }}>
                      <strong style={{ display: 'block', fontSize: '13px', color: '#0d2250', marginBottom: 4 }}>
                        {tx(locale, { en: 'Age Requirements & Children', ar: 'الشروط العمرية والأطفال', es: 'Edades y niños', it: 'Età e bambini' })}
                      </strong>
                      <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>
                        {tx(locale, {
                          en: `Minimum check-in age is ${hotel.policy.checkInAge} years. Children are welcomed up to ${hotel.policy.childAgeMax} years old. Infants under ${hotel.policy.infantAgeMax} stay free of charge.`,
                          ar: `الحد الأدنى لسن تسجيل الوصول هو ${hotel.policy.checkInAge} سنة. الأطفال مرحب بهم حتى ${hotel.policy.childAgeMax} سنة. الرضع دون ${hotel.policy.infantAgeMax} سنة يقيمون مجاناً.`,
                          es: `Edad mínima para el check-in: ${hotel.policy.checkInAge} años. Niños hasta ${hotel.policy.childAgeMax} años.`,
                          it: `Età minima per il check-in: ${hotel.policy.checkInAge} anni. Bambini fino a ${hotel.policy.childAgeMax} anni.`,
                        })}
                      </p>
                    </div>

                    {hotel.policy.checkInInstructions && (
                      <div style={{ padding: '14px 18px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fafbfc' }}>
                        <strong style={{ display: 'block', fontSize: '13px', color: '#0d2250', marginBottom: 4 }}>
                          {tx(locale, { en: 'Special Check-in Instructions', ar: 'تعليمات الوصول الخاصة', es: 'Instrucciones especiales', it: 'Istruzioni speciali' })}
                        </strong>
                        <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>
                          {hotel.policy.checkInInstructions}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* Section 5: Location */}
            <section id="hotel-section-location" className="tour-content-section">
              <h2>{tx(locale, { en: 'Location & Surroundings', ar: 'الموقع والمنطقة المحيطة', es: 'Ubicación', it: 'Posizione' })}</h2>
              <p style={{ fontSize: '13.5px', color: '#475569', marginBottom: 12 }}>
                {hotel.address}, {hotel.city}, {hotel.countryCode}
              </p>
              {hotel.latitude && hotel.longitude ? (
                <div style={{ borderRadius: '14px', overflow: 'hidden', height: '320px', border: '1px solid #e2e8f0' }}>
                  <iframe
                    title="Hotel location map"
                    src={`https://maps.google.com/maps?q=${hotel.latitude},${hotel.longitude}&z=14&ie=UTF8&iwloc=&output=embed`}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    loading="lazy"
                  />
                </div>
              ) : (
                <div style={{ borderRadius: '14px', overflow: 'hidden', height: '240px', border: '1px solid #e2e8f0' }}>
                  <iframe
                    title="Hotel city map"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(`${hotel.name}, ${hotel.city}, Egypt`)}&z=13&ie=UTF8&iwloc=&output=embed`}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    loading="lazy"
                  />
                </div>
              )}
            </section>
          </section>

          {/* Sticky Side Card: Booking & Reservation Summary */}
          <aside className="tour-booking-card">
            <div className="booking-top">
              <div>
                <small>
                  {tx(locale, {
                    en: 'Stay Total',
                    ar: 'إجمالي الإقامة',
                    es: 'Total estancia',
                    it: 'Totale soggiorno',
                  })}
                </small>
                <strong>
                  {selectedPlanDetails ? (
                    formatPrice(selectedPlanDetails.calculation.subtotal, currency, locale)
                  ) : quote?.lowestStayPrice ? (
                    formatPrice(quote.lowestStayPrice, currency, locale)
                  ) : (
                    tx(locale, { en: 'Select a room', ar: 'اختر غرفة', es: 'Elige habitación', it: 'Scegli camera' })
                  )}
                </strong>
                <span>
                  {quote?.nights || 1} {tx(locale, { en: 'nights', ar: 'ليالٍ', es: 'noches', it: 'notti' })} · {adults} {tx(locale, { en: 'guests', ar: 'نزلاء', es: 'huéspedes', it: 'ospiti' })}
                </span>
              </div>
            </div>

            <div className="booking-divider" />

            {/* Selected Room Details */}
            {selectedPlanDetails ? (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  fontSize: '12.5px',
                  marginBottom: '12px',
                }}
              >
                <div style={{ fontWeight: 700, color: '#166534' }}>
                  ✓ {selectedPlanDetails.roomType.name}
                </div>
                <div style={{ color: '#15803d', fontSize: '11.5px', marginTop: 2 }}>
                  {selectedPlanDetails.ratePlan.name}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '8px 0 14px' }}>
                {tx(locale, {
                  en: 'Please select a room category and rate plan to continue.',
                  ar: 'يرجى اختيار فئة الغرفة وخطة السعر للمتابعة.',
                  es: 'Selecciona una habitación para continuar.',
                  it: 'Seleziona una camera per continuare.',
                })}
              </p>
            )}

            {/* Call to Action Button */}
            <button
              type="button"
              disabled={!selectedPlanDetails}
              onClick={() => {
                if (selectedPlanDetails) {
                  // Prepares booking intent for Phase 2B.4 checkout without creating DB booking yet
                  alert(
                    ar
                      ? `تم تحديد الغرفة: ${selectedPlanDetails.roomType.name} (${selectedPlanDetails.ratePlan.name}) بإجمالي ${selectedPlanDetails.calculation.subtotal} ${selectedPlanDetails.calculation.currency}. سيتم نقلك إلى إتمام الحجز في المرحلة 2B.4.`
                      : `Selected: ${selectedPlanDetails.roomType.name} (${selectedPlanDetails.ratePlan.name}) for ${selectedPlanDetails.calculation.subtotal} ${selectedPlanDetails.calculation.currency}. Booking checkout flow will complete in Phase 2B.4.`,
                  );
                }
              }}
              className="primary-btn booking-cta"
              style={{
                width: '100%',
                opacity: selectedPlanDetails ? 1 : 0.6,
                cursor: selectedPlanDetails ? 'pointer' : 'not-allowed',
              }}
            >
              {tx(locale, {
                en: 'Reserve Room',
                ar: 'حجز الغرفة المحددة',
                es: 'Reservar habitación',
                it: 'Prenota camera',
              })}
              <ArrowRight size={17} />
            </button>

            <div className="booking-side-row" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="outline-btn booking-half"
                onClick={shareHotel}
                aria-label="Share"
              >
                <Share2 size={16} /> {tx(locale, { en: 'Share', ar: 'مشاركة', es: 'Compartir', it: 'Condividi' })}
              </button>
              <button
                type="button"
                className="outline-btn booking-half"
                onClick={() => favorites.toggle(`hotel-${hotel.slug}`)}
                aria-pressed={isFavorite}
              >
                <Heart size={16} fill={isFavorite ? '#f7951d' : 'none'} color={isFavorite ? '#f7951d' : 'currentColor'} />
                {isFavorite ? tx(locale, { en: 'Saved', ar: 'محفوظ', es: 'Guardado', it: 'Salvato' }) : tx(locale, { en: 'Save', ar: 'حفظ', es: 'Guardar', it: 'Salva' })}
              </button>
            </div>

            <small className="booking-note" style={{ marginTop: 14 }}>
              <ShieldCheck size={14} />
              {tx(locale, {
                en: 'Best price guarantee. Instant availability check from live hotel inventory.',
                ar: 'ضمان أفضل الأسعار. تحقق فوري ومباشر من مخزون الفندق.',
                es: 'Garantía del mejor precio. Disponibilidad en tiempo real.',
                it: 'Miglior prezzo garantito. Disponibilità in tempo reale.',
              })}
            </small>
          </aside>
        </div>
      </main>

      <HelpCTA />
    </SiteShell>
  );
}

