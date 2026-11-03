'use client';

import React, { useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import {
  Eye,
  X,
  Building2,
  MapPin,
  Clock3,
  ShieldCheck,
  Bed,
  Sparkles,
  CreditCard,
  Check,
  Star,
  Users,
} from 'lucide-react';
import { RichTextRenderer } from '@/components/rich-text-renderer';
import { StatusPill } from '@/components/admin/admin-ui';
import { ALL_LOCALES, LOCALE_LABELS, type Locale } from '@/lib/locale-config';
import { formatPrice } from '@/components/locale';
import '@/components/admin/trip-builder-preview.css';

export interface HotelDraftPolicy {
  checkInTime?: string;
  checkOutTime?: string;
  checkInAge?: number;
  childAgeMax?: number;
  infantAgeMax?: number;
  allowExtraBeds?: boolean;
  extraBedPrice?: string | number;
  allowCribs?: boolean;
  cribPrice?: string | number;
  petsAllowed?: boolean;
  petFee?: string | number;
  depositRequired?: boolean;
  depositPercentage?: string | number;
  cancellationSummary?: string;
  paymentPolicy?: string;
  checkInInstructions?: string;
}

export interface HotelDraftRoomType {
  id?: string;
  name: string;
  code?: string;
  bedConfiguration?: string | null;
  maxAdults?: number;
  maxChildren?: number;
  maxOccupancy?: number;
  roomSizeSqm?: number | null;
  ratePlans?: Array<{
    id?: string;
    name: string;
    code?: string;
    basePrice?: number | string;
    currency?: string;
    boardBasis?: string;
    isRefundable?: boolean;
  }>;
}

export interface HotelBuilderDraft {
  name: string;
  nameAr?: string;
  slug: string;
  propertyType: string;
  starRating?: number | '';
  city: string;
  countryCode: string;
  address: string;
  postalCode?: string;
  latitude?: string | number;
  longitude?: string | number;
  phone?: string;
  email?: string;
  website?: string;
  description: string;
  coverImage?: string;
  gallery?: string[];
  amenities?: string[];
  status: string;
  policy?: HotelDraftPolicy;
  roomTypes?: HotelDraftRoomType[];
  translations?: Record<string, Record<string, string>>;
}

export function safePreviewMedia(value: string | undefined): string {
  if (!value) return '';
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith('/') && !decoded.startsWith('//') && !/[\\\s<>"\u0000-\u001f]/.test(decoded) && !decoded.split('/').includes('..')) {
      return value;
    }
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch {
    return '';
  }
}

const PROPERTY_TYPE_NAMES: Record<string, { en: string; ar: string; es: string; it: string }> = {
  HOTEL: { en: 'Hotel', ar: 'فندق', es: 'Hotel', it: 'Hotel' },
  RESORT: { en: 'Resort', ar: 'منتجع', es: 'Resort', it: 'Resort' },
  BOUTIQUE: { en: 'Boutique Hotel', ar: 'فندق بوتيك', es: 'Hotel boutique', it: 'Boutique hotel' },
  APARTMENT: { en: 'Apartment', ar: 'شقة فندقية', es: 'Apartamento', it: 'Appartamento' },
  VILLA: { en: 'Villa', ar: 'فيلا', es: 'Villa', it: 'Villa' },
  MOTEL: { en: 'Motel', ar: 'موتيل', es: 'Motel', it: 'Motel' },
  GUESTHOUSE: { en: 'Guesthouse', ar: 'بيت ضيافة', es: 'Pensión', it: 'Pensione' },
  BED_AND_BREAKFAST: { en: 'Bed & Breakfast', ar: 'مبيت وإفطار', es: 'B&B', it: 'B&B' },
};

export function HotelPreviewContent({
  draft,
  locale,
}: {
  draft: HotelBuilderDraft;
  locale: Locale;
}) {
  const isAr = locale === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';

  // Resolved localized text
  const title =
    locale === 'ar'
      ? draft.nameAr || draft.name
      : draft.translations?.[locale]?.name || draft.name || (isAr ? 'فندق بدون اسم' : 'Untitled Hotel');

  const description =
    locale === 'en'
      ? draft.description
      : draft.translations?.[locale]?.description || draft.description;

  const instructions =
    locale === 'en'
      ? draft.policy?.checkInInstructions
      : draft.translations?.[locale]?.checkInInstructions || draft.policy?.checkInInstructions;

  const cancellation =
    locale === 'en'
      ? draft.policy?.cancellationSummary
      : draft.translations?.[locale]?.cancellationSummary || draft.policy?.cancellationSummary;

  const cover = safePreviewMedia(draft.coverImage) || '/egypt-hero.png';
  const typeLabel =
    PROPERTY_TYPE_NAMES[draft.propertyType]?.[locale] ||
    PROPERTY_TYPE_NAMES[draft.propertyType]?.en ||
    draft.propertyType;

  const stars = Number(draft.starRating) || 0;
  const roomTypes = draft.roomTypes || [];

  // Lowest base price among all rate plans
  const minPrice = roomTypes.reduce<number | null>((acc, rt) => {
    const plans = rt.ratePlans || [];
    for (const p of plans) {
      const price = Number(p.basePrice);
      if (Number.isFinite(price) && price > 0) {
        if (acc === null || price < acc) acc = price;
      }
    }
    return acc;
  }, null);

  return (
    <article className="sp-trip-preview-public" lang={locale} dir={dir}>
      {/* Header Info */}
      <header className="tour-detail-head" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#e0e7ff', color: '#3730a3' }}>
            {typeLabel}
          </span>
          {stars > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>
              <Star size={14} fill="#f59e0b" />
              {stars} {isAr ? 'نجوم' : 'Stars'}
            </span>
          )}
          <StatusPill status={(draft.status || 'DRAFT').toLowerCase() as any} />
          <small dir="ltr" style={{ color: 'var(--sp-muted)', marginInlineStart: 'auto' }}>
            {draft.slug ? `/hotels/${draft.slug}` : isAr ? 'الرابط غير محدد' : 'Route not set'}
          </small>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '4px 0 8px', color: 'var(--sp-blue-deep)' }}>
          {title}
        </h1>
        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--sp-muted)', fontSize: 13 }}>
          <MapPin size={15} style={{ flexShrink: 0, color: 'var(--sp-blue)' }} />
          <span>
            {draft.address ? `${draft.address}, ` : ''}
            {draft.city || (isAr ? 'القاهرة' : 'Cairo')}, {draft.countryCode || 'EG'}
          </span>
        </p>
      </header>

      {/* Main Cover & Quick Facts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(260px, 1fr)', gap: 20 }}>
        <div>
          {/* Cover Photo */}
          <div style={{ position: 'relative', width: '100%', height: 260, borderRadius: 14, overflow: 'hidden', background: '#f1f5f9', marginBottom: 16 }}>
            <img
              src={cover}
              alt={title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', bottom: 10, insetInlineStart: 10, background: 'rgba(15,23,42,0.75)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backdropFilter: 'blur(4px)' }}>
              {isAr ? 'معاينة مباشرة (مسودة)' : 'Live Preview (Draft)'}
            </div>
          </div>

          {/* Quick Facts Strip */}
          <div className="tour-facts" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 12, background: '#f8fafc', borderRadius: 12, marginBottom: 16, fontSize: 12.5 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock3 size={15} style={{ color: 'var(--sp-blue)' }} />
              <strong>{isAr ? 'تسجيل الوصول:' : 'Check-in:'}</strong> {draft.policy?.checkInTime || '15:00'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock3 size={15} style={{ color: 'var(--sp-blue)' }} />
              <strong>{isAr ? 'المغادرة:' : 'Check-out:'}</strong> {draft.policy?.checkOutTime || '11:00'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Users size={15} style={{ color: 'var(--sp-blue)' }} />
              <strong>{isAr ? 'أدنى سن:' : 'Min Age:'}</strong> {draft.policy?.checkInAge || 18}
            </span>
            {draft.policy?.depositRequired && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <CreditCard size={15} style={{ color: 'var(--sp-blue)' }} />
                <strong>{isAr ? 'مقدم:' : 'Deposit:'}</strong> {draft.policy?.depositPercentage}%
              </span>
            )}
          </div>

          {/* Overview & Description */}
          <section style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--sp-blue-deep)' }}>
              {isAr ? 'نبذة عن الفندق' : 'About the Property'}
            </h3>
            {description ? (
              <RichTextRenderer content={description} dir={dir} />
            ) : (
              <p style={{ color: 'var(--sp-muted)', fontSize: 13, fontStyle: 'italic' }}>
                {isAr ? 'لم تتم إضافة وصف للفندق بعد.' : 'No description provided yet.'}
              </p>
            )}
          </section>

          {/* Amenities Badges */}
          {draft.amenities && draft.amenities.length > 0 && (
            <section style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: 'var(--sp-blue-deep)' }}>
                {isAr ? 'المرافق والخدمات' : 'Featured Amenities'}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {draft.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      background: '#f1f5f9',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--sp-blue-deep)',
                    }}
                  >
                    <Check size={13} style={{ color: 'var(--sp-blue)' }} />
                    {amenity}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Room Categories Summary */}
          <section style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: 'var(--sp-blue-deep)' }}>
              {isAr ? 'فئات الغرف المتاحة' : 'Available Room Categories'} ({roomTypes.length})
            </h3>
            {roomTypes.length === 0 ? (
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px dashed var(--sp-border)', fontSize: 12.5, color: 'var(--sp-muted)' }}>
                {isAr ? 'لا توجد فئات غرف مسجلة حالياً.' : 'No room categories registered yet.'}
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {roomTypes.map((rt, idx) => {
                  const plans = rt.ratePlans || [];
                  const roomPrice = plans.length > 0 ? Math.min(...plans.map((p) => Number(p.basePrice) || 0)) : null;
                  return (
                    <div
                      key={rt.id || idx}
                      style={{
                        padding: 12,
                        background: '#fff',
                        border: '1px solid var(--sp-border)',
                        borderRadius: 10,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: 13.5, color: 'var(--sp-blue-deep)', display: 'block' }}>
                          {rt.name}
                        </strong>
                        <span style={{ fontSize: 11.5, color: 'var(--sp-muted)' }}>
                          <Bed size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginInlineEnd: 4 }} />
                          {rt.bedConfiguration || (isAr ? 'سرير مزدوج' : '1 King Bed')} • {rt.maxOccupancy || 2} {isAr ? 'ضيوف كحد أقصى' : 'guests max'}
                          {rt.roomSizeSqm ? ` • ${rt.roomSizeSqm} m²` : ''}
                        </span>
                      </div>
                      {roomPrice !== null && roomPrice > 0 && (
                        <div style={{ textAlign: isAr ? 'left' : 'right' }}>
                          <small style={{ display: 'block', fontSize: 10, color: 'var(--sp-muted)' }}>
                            {isAr ? 'ابتداءً من' : 'From'}
                          </small>
                          <strong style={{ fontSize: 15, color: 'var(--sp-blue-deep)' }}>
                            {formatPrice(roomPrice, 'USD', locale)}
                          </strong>
                          <small style={{ fontSize: 10, color: 'var(--sp-muted)' }}> / {isAr ? 'ليلة' : 'night'}</small>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Location & Map Section */}
          <section style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: 'var(--sp-blue-deep)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={18} style={{ color: 'var(--sp-orange)' }} />
              {isAr ? 'الموقع والخريطة' : 'Location & Map'}
            </h3>
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid var(--sp-border)' }}>
              <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: 'var(--sp-blue-deep)' }}>
                {draft.address || (isAr ? 'لم يتم تحديد عنوان الشارع' : 'No street address specified')}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--sp-muted)' }}>
                {draft.city || 'Cairo'}, {draft.countryCode || 'EG'}{draft.postalCode ? ` · ${draft.postalCode}` : ''}
              </p>
              {draft.latitude && draft.longitude ? (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                    GPS: {Number(draft.latitude).toFixed(4)}, {Number(draft.longitude).toFixed(4)}
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${draft.latitude},${draft.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, color: 'var(--sp-blue)', textDecoration: 'underline', fontWeight: 600 }}
                  >
                    {isAr ? 'عرض على خرائط Google' : 'View on Google Maps'}
                  </a>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        {/* Aside: Pricing Card & Policies */}
        <aside style={{ minWidth: 0 }}>
          <div className="sp-trip-preview-pricing" style={{ marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--sp-blue-deep)' }}>
              {isAr ? 'مؤشر الأسعار التقديري' : 'Estimated Starting Rate'}
            </h4>
            <p style={{ fontSize: 12, color: 'var(--sp-muted)' }}>
              {isAr ? 'عملة العرض: دولار أمريكي (USD)' : 'Base pricing currency: USD'}
            </p>
            {minPrice !== null ? (
              <div>
                <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--sp-blue-deep)' }}>
                  {formatPrice(minPrice, 'USD', locale)}
                </span>
                <span style={{ fontSize: 12, color: 'var(--sp-muted)' }}> / {isAr ? 'ليلة' : 'night'}</span>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--sp-muted)', fontStyle: 'italic' }}>
                {isAr ? 'أضف فئات غرف وخطط أسعار لاحتساب السعر' : 'Add room categories & rate plans to see rates'}
              </p>
            )}

            <div style={{ borderTop: '1px solid var(--sp-border)', paddingTop: 10, marginTop: 10, fontSize: 11.5, display: 'grid', gap: 6 }}>
              <div>
                <strong>{isAr ? 'الإلغاء:' : 'Cancellation:'}</strong>{' '}
                <span>
                  {cancellation || (isAr ? 'إلغاء مجاني حتى 48 ساعة' : 'Free cancellation up to 48h')}
                </span>
              </div>
              {draft.policy?.allowExtraBeds && (
                <div>
                  <strong>{isAr ? 'أسرّة إضافية:' : 'Extra Beds:'}</strong>{' '}
                  <span>
                    ${draft.policy.extraBedPrice || 0} / {isAr ? 'ليلة' : 'night'}
                  </span>
                </div>
              )}
              {draft.policy?.allowCribs && (
                <div>
                  <strong>{isAr ? 'أسرة أطفال:' : 'Baby Cribs:'}</strong>{' '}
                  <span>
                    {Number(draft.policy.cribPrice) > 0 ? `$${draft.policy.cribPrice}` : isAr ? 'مجاناً' : 'Free'}
                  </span>
                </div>
              )}
              {draft.policy?.petsAllowed && (
                <div>
                  <strong>{isAr ? 'الحيوانات:' : 'Pets:'}</strong>{' '}
                  <span>${draft.policy.petFee || 0} / {isAr ? 'إقامة' : 'stay'}</span>
                </div>
              )}
            </div>

            {instructions && (
              <div style={{ marginTop: 8, padding: 8, background: '#f8fafc', borderRadius: 6, fontSize: 11, color: 'var(--sp-muted)' }}>
                <strong>{isAr ? 'تعليمات الوصول:' : 'Check-in Notes:'}</strong> {instructions}
              </div>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}

export function HotelBuilderPreview({
  draft,
  activeLocale,
  onLocaleChange,
}: {
  draft: HotelBuilderDraft;
  activeLocale?: Locale;
  onLocaleChange?: (loc: Locale) => void;
}) {
  const [internalLocale, setInternalLocale] = useState<Locale>('en');
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);

  const currentLocale = activeLocale || internalLocale;
  const isAr = currentLocale === 'ar';

  const handleLocale = (loc: Locale) => {
    setInternalLocale(loc);
    onLocaleChange?.(loc);
  };

  const languageControl = (
    <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
      <span>{isAr ? 'لغة المعاينة:' : 'Preview Language:'}</span>
      <select
        value={currentLocale}
        onChange={(e) => handleLocale(e.target.value as Locale)}
        style={{ minHeight: 38, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--sp-border)', background: '#fff', fontSize: 13 }}
      >
        {ALL_LOCALES.map((val) => (
          <option key={val} value={val}>
            {LOCALE_LABELS[val]}
          </option>
        ))}
      </select>
    </label>
  );

  const previewTitle =
    currentLocale === 'ar'
      ? draft.nameAr || draft.name
      : draft.translations?.[currentLocale]?.name || draft.name || (isAr ? 'فندق بدون اسم' : 'Untitled Hotel');

  const previewDescription =
    currentLocale === 'en'
      ? draft.description
      : draft.translations?.[currentLocale]?.description || draft.description;

  const stars = Number(draft.starRating) || 0;
  const cover = safePreviewMedia(draft.coverImage) || '/egypt-hero.png';
  const typeLabel =
    PROPERTY_TYPE_NAMES[draft.propertyType]?.[currentLocale] ||
    PROPERTY_TYPE_NAMES[draft.propertyType]?.en ||
    draft.propertyType;

  return (
    <aside className="sp-preview sp-trip-preview-panel" aria-label="Hotel Live Preview">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--sp-blue-deep)' }}>
          {isAr ? 'المعاينة المباشرة' : 'Live Preview'}
        </h3>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', background: '#fef3c7', color: '#92400e', borderRadius: 4 }}>
          {isAr ? 'مسودة' : 'DRAFT'}
        </span>
      </div>

      {languageControl}

      {/* Full Page Modal Trigger */}
      <Dialog.Root open={open} onOpenChange={setOpen} modal>
        <Dialog.Trigger type="button" className="sp-btn" style={{ width: '100%', justifyContent: 'center' }}>
          <Eye size={16} />
          <span>{isAr ? 'معاينة الصفحة كاملة' : 'Open full page preview'}</span>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Backdrop className="sp-trip-preview-backdrop" />
          <Dialog.Popup className="sp-trip-preview-dialog" initialFocus finalFocus>
            <header className="sp-trip-preview-toolbar">
              <Dialog.Title>
                {isAr ? 'معاينة صفحة الفندق (مسودة غير محفوظة)' : 'Unsaved Hotel Preview'}
              </Dialog.Title>
              {languageControl}
              <button
                type="button"
                className="sp-btn"
                aria-pressed={mobile}
                onClick={() => setMobile((m) => !m)}
              >
                {mobile
                  ? isAr
                    ? 'عرض الحاسوب (Desktop)'
                    : 'Desktop width'
                  : isAr
                  ? 'عرض الجوال (Mobile)'
                  : 'Mobile width'}
              </button>
              <Dialog.Close
                type="button"
                className="sp-btn"
                aria-label={isAr ? 'إغلاق المعاينة' : 'Close preview'}
              >
                <X size={18} />
              </Dialog.Close>
            </header>
            <Dialog.Description style={{ color: 'var(--sp-muted)', fontSize: 12, margin: '4px 0 16px' }}>
              {isAr
                ? 'تعكس هذه المعاينة البيانات الحالية في النموذج دون حفظها في قاعدة البيانات.'
                : 'Current form preview only. Nothing is saved or booked from this preview.'}
            </Dialog.Description>
            <div className={mobile ? 'sp-trip-preview-viewport is-mobile' : 'sp-trip-preview-viewport'}>
              <HotelPreviewContent draft={draft} locale={currentLocale} />
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Compact Sidebar Card Preview */}
      <div
        className="sp-preview-box"
        style={{
          border: '1px solid var(--sp-border)',
          borderRadius: 14,
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        <div style={{ position: 'relative', height: 160, background: '#f1f5f9' }}>
          <img
            src={cover}
            alt={previewTitle}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div
            style={{
              position: 'absolute',
              top: 8,
              insetInlineStart: 8,
              background: 'rgba(15,23,42,0.8)',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 5,
            }}
          >
            {typeLabel}
          </div>
          {stars > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                insetInlineEnd: 8,
                background: 'rgba(15,23,42,0.8)',
                color: '#f59e0b',
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 5,
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <Star size={12} fill="#f59e0b" />
              <span>{stars}★</span>
            </div>
          )}
        </div>

        <div style={{ padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <small style={{ color: 'var(--sp-orange)', fontWeight: 800, textTransform: 'uppercase', fontSize: 10 }}>
              {draft.city || 'Cairo'}, {draft.countryCode || 'EG'}
            </small>
            <StatusPill status={(draft.status || 'DRAFT').toLowerCase() as any} />
          </div>

          <h4
            style={{
              margin: '0 0 6px',
              fontSize: 14,
              fontWeight: 800,
              color: 'var(--sp-blue-deep)',
              lineHeight: 1.3,
            }}
          >
            {previewTitle}
          </h4>

          {draft.address && (
            <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--sp-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{draft.address}</span>
              {draft.latitude && draft.longitude && (
                <span style={{ fontSize: 9.5, background: '#e0f2fe', color: '#0369a1', padding: '1px 5px', borderRadius: 4, fontWeight: 700, flexShrink: 0 }}>
                  GPS
                </span>
              )}
            </p>
          )}

          {previewDescription ? (
            <div
              style={{
                fontSize: 12,
                color: 'var(--sp-muted)',
                maxHeight: 64,
                overflow: 'hidden',
                position: 'relative',
                lineHeight: 1.45,
              }}
            >
              <RichTextRenderer content={previewDescription} dir={currentLocale === 'ar' ? 'rtl' : 'ltr'} />
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 11, color: 'var(--sp-muted)', fontStyle: 'italic' }}>
              {isAr ? 'لم يكتب وصف بعد.' : 'No description written yet.'}
            </p>
          )}

          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1px solid var(--sp-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11,
              color: 'var(--sp-muted)',
            }}
          >
            <span>
              <Bed size={13} style={{ display: 'inline', verticalAlign: 'text-bottom', marginInlineEnd: 3 }} />
              {draft.roomTypes?.length || 0} {isAr ? 'فئات غرف' : 'room types'}
            </span>
            <span>
              {draft.amenities?.length || 0} {isAr ? 'مرافق' : 'amenities'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
