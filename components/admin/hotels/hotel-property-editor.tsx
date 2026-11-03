'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs } from '@base-ui/react/tabs';
import {
  Building2,
  MapPin,
  Sparkles,
  Bed,
  CalendarDays,
  Save,
  ArrowLeft,
  ArrowRight,
  Eye,
  CheckCircle2,
  Trash2,
  Plus,
  Shield,
  Upload,
  ExternalLink,
  ImagePlus,
  Clock3,
  CreditCard,
  Phone,
  Mail,
  Globe,
  Compass,
  Navigation,
  Search,
  Loader2,
} from 'lucide-react';
import { PageHead } from '@/components/admin/admin-shell';
import { Card, AdminText, StatusPill } from '@/components/admin/admin-ui';
import { toast } from '@/components/admin/admin-toaster';
import { ImageField } from '@/components/admin/image-field';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { RoomRatesManager } from './room-rates-manager';
import { InventoryCalendar } from './inventory-calendar';
import { HotelBuilderPreview, type HotelBuilderDraft } from './hotel-builder-preview';
import type { HotelDetailResponse } from '@/lib/hotels/hotels-client';
import { ALL_LOCALES, ADMIN_CONTENT_LOCALES, LOCALE_LABELS, type Locale, type AdminContentLocale } from '@/lib/locale-config';

export const HOTEL_CONTENT_LOCALES = ADMIN_CONTENT_LOCALES;
export type HotelContentLocale = AdminContentLocale;

const HOTEL_AMENITY_OPTIONS = [
  'Free WiFi',
  'Swimming Pool',
  'Spa & Wellness',
  'Fitness Center',
  'Restaurant',
  'Bar / Lounge',
  'Room Service',
  'Airport Shuttle',
  'Free Parking',
  'Air Conditioning',
  '24-Hour Front Desk',
  'Private Beach',
  'Kids Club',
  'Business Center',
];

const EGYPT_MAP_PRESETS = [
  { labelEn: 'Cairo / Nile Corniche', labelAr: 'القاهرة / كورنيش النيل', lat: 30.0444, lng: 31.2357 },
  { labelEn: 'Giza / Pyramids Plateau', labelAr: 'الجيزة / هضبة الأهرامات', lat: 29.9792, lng: 31.1342 },
  { labelEn: 'Luxor / East Bank', labelAr: 'الأقصر / الضفة الشرقية', lat: 25.6872, lng: 32.6396 },
  { labelEn: 'Aswan / Nile Corniche', labelAr: 'أسوان / كورنيش النيل', lat: 24.0889, lng: 32.8998 },
  { labelEn: 'Sharm El Sheikh / Naama Bay', labelAr: 'شرم الشيخ / خليج نعمة', lat: 27.9158, lng: 34.3299 },
  { labelEn: 'Hurghada / Marina', labelAr: 'الغردقة / المارينا', lat: 27.2579, lng: 33.8116 },
  { labelEn: 'Alexandria / Mediterranean', labelAr: 'الإسكندرية / الكورنيش', lat: 31.2001, lng: 29.9187 },
  { labelEn: 'El Gouna / Red Sea', labelAr: 'الجونة / البحر الأحمر', lat: 27.3949, lng: 33.6766 },
];

const STEPS = [
  { en: 'Basic', ar: 'الأساسية' },
  { en: 'Policies', ar: 'السياسات' },
  { en: 'Rooms', ar: 'الغرف' },
  { en: 'Rates', ar: 'الأسعار' },
  { en: 'Inventory', ar: 'المخزون' },
  { en: 'Media', ar: 'الوسائط' },
  { en: 'Map', ar: 'الخريطة والموقع' },
  { en: 'SEO & Publish', ar: 'المراجعة والنشر' },
] as const;

export interface HotelPropertyEditorProps {
  initialHotel?: HotelDetailResponse | null;
  hotelId?: string;
  ar: boolean;
  onRefresh?: () => void;
}

export function HotelPropertyEditor({
  initialHotel,
  hotelId,
  ar,
  onRefresh,
}: HotelPropertyEditorProps) {
  const router = useRouter();
  const isNew = !hotelId || hotelId === 'new';

  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const [done, setDone] = useState<number[]>([]);
  const isLastStep = activeStep === STEPS.length - 1;

  // Language state per step (exact Trip Builder pattern)
  const [stepLanguages, setStepLanguages] = useState<Partial<Record<number, HotelContentLocale>>>({});
  const contentLocale = stepLanguages[activeStep] ?? 'en';
  const hasTranslations = activeStep === 0 || activeStep === 1 || activeStep === 7;

  // Preview language state
  const [previewLocale, setPreviewLocale] = useState<Locale>('en');

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State: Canonical Identity & Basic
  const [name, setName] = useState(initialHotel?.name || '');
  const [nameAr, setNameAr] = useState(initialHotel?.nameAr || '');
  const [slug, setSlug] = useState(initialHotel?.slug || '');
  const [propertyType, setPropertyType] = useState(initialHotel?.propertyType || 'HOTEL');
  const [starRating, setStarRating] = useState<number | ''>(initialHotel?.starRating || 5);
  const [status, setStatus] = useState(initialHotel?.status || 'DRAFT');

  // Location & Contact
  const [countryCode, setCountryCode] = useState(initialHotel?.countryCode || 'EG');
  const [city, setCity] = useState(initialHotel?.city || 'Cairo');
  const [address, setAddress] = useState(initialHotel?.address || '');
  const [postalCode, setPostalCode] = useState(initialHotel?.postalCode || '');
  const [latitude, setLatitude] = useState(initialHotel?.latitude ? String(initialHotel.latitude) : '');
  const [longitude, setLongitude] = useState(initialHotel?.longitude ? String(initialHotel.longitude) : '');
  const [phone, setPhone] = useState(initialHotel?.phone || '');
  const [email, setEmail] = useState(initialHotel?.email || '');
  const [website, setWebsite] = useState(initialHotel?.website || '');

  // Description
  const [description, setDescription] = useState(initialHotel?.description || '');
  const [checkInTime, setCheckInTime] = useState(initialHotel?.checkInTime || '15:00');
  const [checkOutTime, setCheckOutTime] = useState(initialHotel?.checkOutTime || '11:00');

  // Media
  const [coverImage, setCoverImage] = useState(initialHotel?.coverImage || '');
  const [galleryUrls, setGalleryUrls] = useState<string[]>(initialHotel?.gallery || []);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [galleryText, setGalleryText] = useState((initialHotel?.gallery || []).join('\n'));

  // Amenities
  const [amenities, setAmenities] = useState<string[]>(initialHotel?.amenities || ['Free WiFi', 'Air Conditioning']);

  // Policy
  const pol = initialHotel?.policy;
  const [checkInAge, setCheckInAge] = useState(pol?.checkInAge ?? 18);
  const [checkInInstructions, setCheckInInstructions] = useState(pol?.checkInInstructions || '');
  const [childAgeMax, setChildAgeMax] = useState(pol?.childAgeMax ?? 11);
  const [infantAgeMax, setInfantAgeMax] = useState(pol?.infantAgeMax ?? 2);
  const [allowExtraBeds, setAllowExtraBeds] = useState(pol?.allowExtraBeds ?? false);
  const [extraBedPrice, setExtraBedPrice] = useState(pol?.extraBedPricePerNight ? String(pol.extraBedPricePerNight) : '');
  const [allowCribs, setAllowCribs] = useState(pol?.allowCribs ?? false);
  const [cribPrice, setCribPrice] = useState(pol?.cribPricePerNight ? String(pol.cribPricePerNight) : '');
  const [petsAllowed, setPetsAllowed] = useState(pol?.petsAllowed ?? false);
  const [petFee, setPetFee] = useState(pol?.petFeePerStay ? String(pol.petFeePerStay) : '');
  const [cancellationSummary, setCancellationSummary] = useState(pol?.cancellationSummary || '');
  const [paymentPolicy, setPaymentPolicy] = useState(pol?.paymentPolicy || '');
  const [depositRequired, setDepositRequired] = useState(pol?.depositRequired ?? false);
  const [depositPercentage, setDepositPercentage] = useState(pol?.depositPercentage ? String(pol.depositPercentage) : '0');

  // SEO
  const [seoTitle, setSeoTitle] = useState(initialHotel?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(initialHotel?.seoDescription || '');

  // Translations overlay maps: locale -> { field: value }
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>(
    initialHotel?.translations || {},
  );

  const getTrans = (locale: HotelContentLocale, field: string, fallback: string) => {
    if (locale === 'en') return fallback;
    return translations[locale]?.[field] || '';
  };

  const setTrans = (locale: HotelContentLocale, field: string, val: string) => {
    setDirty(true);
    if (locale === 'en') return;
    setTranslations((prev) => {
      const current = { ...(prev[locale] || {}) };
      if (!val) delete current[field];
      else current[field] = val;
      return { ...prev, [locale]: current };
    });
  };

  const toggleAmenity = (item: string) => {
    setDirty(true);
    setAmenities((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));
  };

  const addGalleryImage = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    setDirty(true);
    if (!galleryUrls.includes(url)) {
      const updated = [...galleryUrls, url];
      setGalleryUrls(updated);
      setGalleryText(updated.join('\n'));
    }
    setNewImageUrl('');
  };

  const removeGalleryImage = (index: number) => {
    setDirty(true);
    const updated = galleryUrls.filter((_, i) => i !== index);
    setGalleryUrls(updated);
    setGalleryText(updated.join('\n'));
  };

  const handleGalleryTextBlur = () => {
    const lines = galleryText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    setGalleryUrls(lines);
  };

  // Map Search & Geocoding State
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSearchResults, setMapSearchResults] = useState<Array<{ name: string; displayName: string; lat: number; lng: number }>>([]);
  const [searchingMap, setSearchingMap] = useState(false);

  const handleMapSearch = async (queryToSearch?: string) => {
    const q = (queryToSearch ?? mapSearchQuery).trim();
    if (!q) {
      toast.error(ar ? 'يرجى كتابة اسم الفندق أو العنوان للبحث.' : 'Please enter a hotel name or address to search.');
      return;
    }

    // Check if input is direct coordinates (e.g., "30.0444, 31.2357" or URL containing coords)
    const coordMatch = q.match(/([-+]?\d{1,2}(?:\.\d+)?)[,\s]+([-+]?\d{1,3}(?:\.\d+)?)/);
    if (coordMatch) {
      const parsedLat = parseFloat(coordMatch[1]);
      const parsedLng = parseFloat(coordMatch[2]);
      if (!isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat >= -90 && parsedLat <= 90 && parsedLng >= -180 && parsedLng <= 180) {
        setLatitude(parsedLat.toFixed(6));
        setLongitude(parsedLng.toFixed(6));
        setDirty(true);
        setMapSearchResults([]);
        toast.success(ar ? `تم استخراج وتثبيت الإحداثيات: ${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)}` : `Coordinates parsed & pinned: ${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)}`);
        return;
      }
    }

    setSearchingMap(true);
    try {
      const res = await fetch(`/api/admin/geocode?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Geocode request failed');
      const data = await res.json();
      const results = (data.results || []) as Array<{ name: string; displayName: string; lat: number; lng: number }>;
      setMapSearchResults(results);
      if (results.length === 0) {
        toast.info(ar ? 'لم يتم العثور على نتائج مطابقة دقيقة. يمكنك فتح خرائط جوجل مباشرة بالزر المجاور.' : 'No exact location results found. You can search directly on Google Maps.');
      } else {
        toast.success(ar ? `تم العثور على ${results.length} نتائج.` : `Found ${results.length} location matches.`);
      }
    } catch {
      toast.error(ar ? 'تعذر البحث عن الموقع حالياً.' : 'Failed to search location.');
    } finally {
      setSearchingMap(false);
    }
  };

  const nextStep = () => {
    setDone((current) => (current.includes(activeStep) ? current : [...current, activeStep]));
    setActiveStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const handleSave = async (targetStatus?: string) => {
    const finalStatus = targetStatus || status;
    setSaving(true);
    try {
      const gallery = galleryUrls.length > 0 ? galleryUrls : galleryText.split('\n').map((s) => s.trim()).filter(Boolean);

      const payload = {
        hotel: {
          name: name.trim(),
          nameAr: nameAr.trim() || undefined,
          slug: slug.trim().toLowerCase(),
          description: description.trim(),
          propertyType,
          starRating: starRating === '' ? undefined : Number(starRating),
          countryCode: countryCode.trim().toUpperCase(),
          city: city.trim(),
          address: address.trim(),
          postalCode: postalCode.trim() || undefined,
          latitude: latitude ? Number(latitude) : undefined,
          longitude: longitude ? Number(longitude) : undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          website: website.trim() || undefined,
          checkInTime: checkInTime.trim(),
          checkOutTime: checkOutTime.trim(),
          coverImage: coverImage.trim() || undefined,
          gallery,
          amenities,
          status: finalStatus,
          seoTitle: seoTitle.trim() || undefined,
          seoDescription: seoDescription.trim() || undefined,
          translations,
        },
        policy: {
          checkInAge: Number(checkInAge),
          checkInInstructions: checkInInstructions.trim() || undefined,
          childAgeMax: Number(childAgeMax),
          infantAgeMax: Number(infantAgeMax),
          allowExtraBeds,
          extraBedPricePerNight: extraBedPrice ? Number(extraBedPrice) : 0,
          allowCribs,
          cribPricePerNight: cribPrice ? Number(cribPrice) : 0,
          petsAllowed,
          petFeePerStay: petFee ? Number(petFee) : 0,
          cancellationSummary: cancellationSummary.trim() || undefined,
          paymentPolicy: paymentPolicy.trim() || undefined,
          depositRequired,
          depositPercentage: depositPercentage ? Number(depositPercentage) : 0,
        },
      };

      const url = isNew ? '/api/admin/hotels' : `/api/admin/hotels/${encodeURIComponent(hotelId!)}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin',
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to save hotel.');
      }

      const json = await res.json();
      if (targetStatus) setStatus(targetStatus);
      toast.success(
        isNew
          ? ar
            ? 'تم إنشاء الفندق بنجاح.'
            : 'Hotel created successfully.'
          : ar
          ? 'تم حفظ تعديلات الفندق.'
          : 'Hotel changes saved.',
        { dedupeKey: 'hotel-save' },
      );
      setDirty(false);
      setDone(STEPS.map((_, i) => i));

      if (isNew && json.hotel?.id) {
        router.push(`/admin/hotels/${encodeURIComponent(json.hotel.id)}`);
      } else {
        onRefresh?.();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save hotel.', { dedupeKey: 'hotel-save' });
    } finally {
      setSaving(false);
    }
  };

  const numLat = latitude && Number.isFinite(Number(latitude)) ? Number(latitude) : null;
  const numLng = longitude && Number.isFinite(Number(longitude)) ? Number(longitude) : null;

  const adjustCoords = (deltaLat: number, deltaLng: number) => {
    const currentLat = numLat ?? 30.0444;
    const currentLng = numLng ?? 31.2357;
    const nextLat = Number((currentLat + deltaLat).toFixed(6));
    const nextLng = Number((currentLng + deltaLng).toFixed(6));
    setLatitude(String(nextLat));
    setLongitude(String(nextLng));
    setDirty(true);
  };

  const autoLocateFromCity = () => {
    const target = (city || '').trim().toLowerCase();
    const match = EGYPT_MAP_PRESETS.find(
      (p) => p.labelEn.toLowerCase().includes(target) || p.labelAr.includes(target),
    );
    if (match) {
      setLatitude(String(match.lat));
      setLongitude(String(match.lng));
      setDirty(true);
      toast.success(ar ? `تم تحديد إحداثيات ${match.labelAr}` : `Location set to ${match.labelEn}`);
    } else {
      toast.info(
        ar
          ? 'يرجى اختيار أحد المواقع المقترحة أو إدخال الإحداثيات يدوياً.'
          : 'Please select a preset location or enter coordinates manually.',
      );
    }
  };

  // Draft object for Live Preview
  const previewDraft: HotelBuilderDraft = {
    name,
    nameAr,
    slug,
    propertyType,
    starRating,
    city,
    countryCode,
    address,
    postalCode,
    latitude,
    longitude,
    phone,
    email,
    website,
    description,
    coverImage,
    gallery: galleryUrls,
    amenities,
    status,
    policy: {
      checkInTime,
      checkOutTime,
      checkInAge,
      childAgeMax,
      infantAgeMax,
      allowExtraBeds,
      extraBedPrice,
      allowCribs,
      cribPrice,
      petsAllowed,
      petFee,
      depositRequired,
      depositPercentage,
      cancellationSummary,
      paymentPolicy,
      checkInInstructions,
    },
    roomTypes: initialHotel?.roomTypes || [],
    translations,
  };

  return (
    <>
      {/* 1. Page Head */}
      <PageHead
        eyebrow="Hotels Builder"
        title={isNew ? 'New Hotel Property' : name || 'Hotel Details'}
        titleAr={isNew ? 'فندق جديد' : nameAr || name || 'تفاصيل الفندق'}
        sub={
          isNew
            ? 'Build the complete hotel property and inventory experience from one structured workflow'
            : `ID: ${initialHotel?.id} · /hotels/${slug} · ${initialHotel?.roomTypes?.length ?? 0} room categories registered`
        }
        subAr={
          isNew
            ? 'أنشئ ملف الفندق والمخزون كاملاً من مسار عمل منظم'
            : `المعرف: ${initialHotel?.id} · /hotels/${slug} · ${initialHotel?.roomTypes?.length ?? 0} فئة غرف مسجلة`
        }
        backHref="/admin/hotels"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isLastStep && !isNew && status === 'PUBLISHED' ? (
              <a
                className="sp-btn dark"
                href={`/hotels/${encodeURIComponent(slug)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={16} />
                <AdminText en="View Hotel" ar="عرض الفندق" />
              </a>
            ) : isLastStep ? (
              <button
                type="button"
                className="sp-btn primary"
                onClick={() => void handleSave()}
                disabled={saving}
              >
                <Save size={16} />
                <AdminText en={saving ? 'Saving…' : 'Save Hotel'} ar={saving ? 'جارٍ الحفظ…' : 'حفظ الفندق'} />
              </button>
            ) : (
              <button
                type="button"
                className="sp-btn dark"
                onClick={nextStep}
                disabled={saving}
              >
                <ArrowRight size={16} />
                <AdminText en="Continue" ar="متابعة" />
              </button>
            )}
          </div>
        }
      />

      {/* 2. Numbered Stepper Timeline (.sp-builder-timeline with .sp-steps) */}
      <nav className="sp-builder-timeline" aria-label="Hotel builder steps">
        <ol
          className="sp-steps"
          style={{
            gridTemplateColumns: `repeat(${STEPS.length}, minmax(0, 1fr))`,
            minWidth: 640,
          }}
        >
          {STEPS.map((item, index) => {
            const current = index === activeStep;
            const completed = done.includes(index);
            return (
              <li key={item.en} className={current ? 'active' : completed ? 'done' : ''}>
                <button
                  type="button"
                  aria-current={current ? 'step' : undefined}
                  aria-label={`${index + 1}. ${item.en}${completed ? ' (completed)' : ''}`}
                  onClick={() => setActiveStep(index)}
                >
                  <span className="sp-step-node" aria-hidden="true">
                    {completed && !current ? <CheckCircle2 size={16} /> : index + 1}
                  </span>
                  <span className="sp-step-label">{ar ? item.ar : item.en}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* 3. Two-Column Builder Layout: Left Form + Right Live Preview */}
      <div className="sp-builder">
        <Card
          title={ar ? STEPS[activeStep].ar : STEPS[activeStep].en}
          sub={
            <AdminText
              en="Every field feeds the public hotel discovery and booking engine"
              ar="كل حقل يغذي تجربة استكشاف الفنادق ومحرك الحجز العام"
            />
          }
        >
          {/* Exact Trip Builder Tabs Component */}
          <Tabs.Root
            value={contentLocale}
            onValueChange={(val) => {
              if (HOTEL_CONTENT_LOCALES.includes(val as any)) {
                setStepLanguages((curr) => ({ ...curr, [activeStep]: val as HotelContentLocale }));
              }
            }}
            className="sp-builder-languages"
          >
            {hasTranslations && (
              <Tabs.List
                className="sp-builder-language-tabs"
                aria-label={ar ? 'لغة محتوى الفندق' : 'Hotel content language'}
              >
                {HOTEL_CONTENT_LOCALES.map((locale) => (
                  <Tabs.Tab key={locale} value={locale}>
                    {LOCALE_LABELS[locale]}
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            )}

            <Tabs.Panel value={contentLocale} className="sp-form" render={<div lang={contentLocale} />}>
              {/* STEP 0: BASIC */}
              {activeStep === 0 && (
                <>
                  <label>
                    <AdminText en="Hotel Name*" ar="اسم الفندق*" />
                    <input
                      required={contentLocale === 'en'}
                      dir={contentLocale === 'ar' ? 'rtl' : 'ltr'}
                      value={
                        contentLocale === 'en'
                          ? name
                          : contentLocale === 'ar'
                          ? nameAr
                          : getTrans(contentLocale, 'name', name)
                      }
                      onChange={(e) => {
                        setDirty(true);
                        if (contentLocale === 'en') {
                          setName(e.target.value);
                          if (isNew && !slug) {
                            setSlug(
                              e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/(^-|-$)/g, ''),
                            );
                          }
                        } else if (contentLocale === 'ar') {
                          setNameAr(e.target.value);
                        } else {
                          setTrans(contentLocale, 'name', e.target.value);
                        }
                      }}
                      placeholder={
                        contentLocale === 'ar'
                          ? 'مثال: فندق قصر النيل الكبير'
                          : 'e.g. Cairo Grand Nile Palace'
                      }
                    />
                  </label>

                  <div className="sp-form-2">
                    <label>
                      <AdminText en="Canonical Route Slug*" ar="الرابط الدائم (Slug)*" />
                      <input
                        required
                        value={slug}
                        readOnly={!isNew}
                        onChange={(e) => {
                          setSlug(e.target.value.toLowerCase());
                          setDirty(true);
                        }}
                        dir="ltr"
                        placeholder="cairo-grand-nile-palace"
                      />
                    </label>

                    <label>
                      <AdminText en="Property Type" ar="نوع المنشأة" />
                      <select
                        value={propertyType}
                        onChange={(e) => {
                          setPropertyType(e.target.value);
                          setDirty(true);
                        }}
                      >
                        <option value="HOTEL">Hotel</option>
                        <option value="RESORT">Resort</option>
                        <option value="BOUTIQUE">Boutique Hotel</option>
                        <option value="APARTMENT">Apartment / Apart-Hotel</option>
                        <option value="VILLA">Villa</option>
                        <option value="MOTEL">Motel</option>
                        <option value="GUESTHOUSE">Guesthouse</option>
                        <option value="BED_AND_BREAKFAST">Bed & Breakfast</option>
                      </select>
                    </label>
                  </div>

                  <div className="sp-form-2">
                    <label>
                      <AdminText en="Star Rating" ar="تصنيف النجوم" />
                      <select
                        value={starRating}
                        onChange={(e) => {
                          setStarRating(e.target.value === '' ? '' : Number(e.target.value));
                          setDirty(true);
                        }}
                      >
                        <option value="">Unrated</option>
                        <option value="1">1 Star</option>
                        <option value="2">2 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="5">5 Stars Luxury</option>
                      </select>
                    </label>

                    <label>
                      <AdminText en="Country Code (ISO-2)*" ar="رمز الدولة (ISO-2)*" />
                      <input
                        value={countryCode}
                        onChange={(e) => {
                          setCountryCode(e.target.value.toUpperCase());
                          setDirty(true);
                        }}
                        maxLength={2}
                        placeholder="EG"
                      />
                    </label>
                  </div>

                  <div className="sp-form-2">
                    <label>
                      <AdminText en="City / Region*" ar="المدينة أو المنطقة*" />
                      <input
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          setDirty(true);
                        }}
                        placeholder="Cairo"
                      />
                    </label>

                    <label>
                      <AdminText en="Postal Code" ar="الرمز البريدي" />
                      <input
                        value={postalCode}
                        onChange={(e) => {
                          setPostalCode(e.target.value);
                          setDirty(true);
                        }}
                        placeholder="11511"
                      />
                    </label>
                  </div>

                  <label>
                    <AdminText en="Street Address*" ar="عنوان الشارع والموقع*" />
                    <input
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        setDirty(true);
                      }}
                      placeholder="Corniche El Nil, Garden City"
                    />
                  </label>

                  <div className="sp-builder-note" style={{ margin: '4px 0 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={15} style={{ color: 'var(--sp-orange)', flexShrink: 0 }} />
                    <AdminText
                      en="Interactive map pin, location orientation, and GPS coordinates are configured in Step 7 (Map)."
                      ar="يتم تحديد نقطة الخريطة التفاعلية وتوجيه النزلاء وإحداثيات GPS في الخطوة 7 (الخريطة والموقع)."
                    />
                  </div>

                  <div className="sp-form-2">
                    <label>
                      <AdminText en="Official Phone" ar="رقم الهاتف" />
                      <input
                        value={phone}
                        dir="ltr"
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setDirty(true);
                        }}
                        placeholder="+20 2 2795 0000"
                      />
                    </label>
                    <label>
                      <AdminText en="Official Email" ar="البريد الإلكتروني" />
                      <input
                        type="email"
                        value={email}
                        dir="ltr"
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setDirty(true);
                        }}
                        placeholder="reservations@hotel.com"
                      />
                    </label>
                  </div>

                  <label>
                    <AdminText en="Website URL" ar="الموقع الإلكتروني" />
                    <input
                      value={website}
                      dir="ltr"
                      onChange={(e) => {
                        setWebsite(e.target.value);
                        setDirty(true);
                      }}
                      placeholder="https://hotel.com"
                    />
                  </label>

                  <div className="sp-field">
                    <span className="sp-label" style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>
                      <AdminText en="Property Description*" ar="وصف الفندق والمرافق*" />
                    </span>
                    <RichTextEditor
                      value={
                        contentLocale === 'en'
                          ? description
                          : getTrans(contentLocale, 'description', description)
                      }
                      onChange={(val) => {
                        setDirty(true);
                        if (contentLocale === 'en') {
                          setDescription(val);
                        } else {
                          setTrans(contentLocale, 'description', val);
                        }
                      }}
                      minHeight={180}
                      dir={contentLocale === 'ar' ? 'rtl' : 'ltr'}
                      placeholder={
                        contentLocale === 'ar'
                          ? 'اكتب تفاصيل ووصف الفندق والمرافق بالعربية...'
                          : 'Write comprehensive hotel overview, features, and amenities...'
                      }
                    />
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <span className="sp-label" style={{ display: 'block', marginBottom: 8, fontWeight: 700 }}>
                      <AdminText en="Property Amenities & Highlights" ar="مرافق وخدمات الفندق" />
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                      {HOTEL_AMENITY_OPTIONS.map((item) => {
                        const checked = amenities.includes(item);
                        return (
                          <label
                            key={item}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              fontSize: '12.5px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              padding: '6px 10px',
                              borderRadius: 8,
                              background: checked ? '#eef3ff' : '#f8f9fc',
                              border: checked ? '1px solid #b7c7ec' : '1px solid #eef1f7',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleAmenity(item)}
                              style={{ width: 'auto', minHeight: 'auto', margin: 0 }}
                            />
                            <span>{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* STEP 1: POLICIES */}
              {activeStep === 1 && (
                <>
                  <div className="sp-form-2">
                    <label>
                      <AdminText en="Check-in Time" ar="وقت تسجيل الوصول" />
                      <input
                        value={checkInTime}
                        onChange={(e) => {
                          setCheckInTime(e.target.value);
                          setDirty(true);
                        }}
                        placeholder="15:00"
                      />
                    </label>
                    <label>
                      <AdminText en="Check-out Time" ar="وقت تسجيل المغادرة" />
                      <input
                        value={checkOutTime}
                        onChange={(e) => {
                          setCheckOutTime(e.target.value);
                          setDirty(true);
                        }}
                        placeholder="11:00"
                      />
                    </label>
                  </div>

                  <div className="sp-form-2">
                    <label>
                      <AdminText en="Minimum Check-in Age" ar="الحد الأدنى لسن تسجيل الوصول" />
                      <input
                        type="number"
                        min="16"
                        max="25"
                        value={checkInAge}
                        onChange={(e) => {
                          setCheckInAge(Number(e.target.value));
                          setDirty(true);
                        }}
                      />
                    </label>

                    <div className="sp-form-2">
                      <label>
                        <AdminText en="Child Max Age" ar="أقصى سن للطفل" />
                        <input
                          type="number"
                          min="2"
                          max="17"
                          value={childAgeMax}
                          onChange={(e) => {
                            setChildAgeMax(Number(e.target.value));
                            setDirty(true);
                          }}
                        />
                      </label>
                      <label>
                        <AdminText en="Infant Max Age" ar="أقصى سن للرضيع" />
                        <input
                          type="number"
                          min="0"
                          max="4"
                          value={infantAgeMax}
                          onChange={(e) => {
                            setInfantAgeMax(Number(e.target.value));
                            setDirty(true);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="sp-form-2">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, border: '1px solid var(--sp-border)', borderRadius: 12 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={allowExtraBeds}
                          onChange={(e) => {
                            setAllowExtraBeds(e.target.checked);
                            setDirty(true);
                          }}
                          style={{ width: 'auto', minHeight: 'auto', margin: 0 }}
                        />
                        <strong><AdminText en="Allow Extra Beds" ar="السماح بأسرّة إضافية" /></strong>
                      </label>
                      {allowExtraBeds && (
                        <label>
                          <AdminText en="Extra Bed Surcharge per Night (USD)" ar="سعر السرير الإضافي لكل ليلة (دولار)" />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={extraBedPrice}
                            onChange={(e) => {
                              setExtraBedPrice(e.target.value);
                              setDirty(true);
                            }}
                            placeholder="35.00"
                          />
                        </label>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, border: '1px solid var(--sp-border)', borderRadius: 12 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={allowCribs}
                          onChange={(e) => {
                            setAllowCribs(e.target.checked);
                            setDirty(true);
                          }}
                          style={{ width: 'auto', minHeight: 'auto', margin: 0 }}
                        />
                        <strong><AdminText en="Allow Baby Cribs" ar="السماح بأسرة أطفال رضع" /></strong>
                      </label>
                      {allowCribs && (
                        <label>
                          <AdminText en="Crib Surcharge per Night (USD)" ar="سعر سرير الرضيع لكل ليلة (دولار)" />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={cribPrice}
                            onChange={(e) => {
                              setCribPrice(e.target.value);
                              setDirty(true);
                            }}
                            placeholder="0.00"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="sp-form-2">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, border: '1px solid var(--sp-border)', borderRadius: 12 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={petsAllowed}
                          onChange={(e) => {
                            setPetsAllowed(e.target.checked);
                            setDirty(true);
                          }}
                          style={{ width: 'auto', minHeight: 'auto', margin: 0 }}
                        />
                        <strong><AdminText en="Pets Allowed" ar="السماح بالحيوانات الأليفة" /></strong>
                      </label>
                      {petsAllowed && (
                        <label>
                          <AdminText en="Pet Fee per Stay (USD)" ar="رسوم الحيوانات الأليفة لكل إقامة" />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={petFee}
                            onChange={(e) => {
                              setPetFee(e.target.value);
                              setDirty(true);
                            }}
                            placeholder="50.00"
                          />
                        </label>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, border: '1px solid var(--sp-border)', borderRadius: 12 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={depositRequired}
                          onChange={(e) => {
                            setDepositRequired(e.target.checked);
                            setDirty(true);
                          }}
                          style={{ width: 'auto', minHeight: 'auto', margin: 0 }}
                        />
                        <strong><AdminText en="Deposit Required" ar="مقدم حجز إلزامي" /></strong>
                      </label>
                      {depositRequired && (
                        <label>
                          <AdminText en="Deposit Percentage (%)" ar="نسبة مقدم الحجز (%)" />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={depositPercentage}
                            onChange={(e) => {
                              setDepositPercentage(e.target.value);
                              setDirty(true);
                            }}
                            placeholder="20"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <label>
                    <AdminText
                      en="Check-in Instructions & Special Requirements"
                      ar="تعليمات تسجيل الوصول والشروط الخاصة"
                    />
                    <textarea
                      rows={3}
                      dir={contentLocale === 'ar' ? 'rtl' : 'ltr'}
                      value={
                        contentLocale === 'en'
                          ? checkInInstructions
                          : getTrans(contentLocale, 'checkInInstructions', checkInInstructions)
                      }
                      onChange={(e) => {
                        setDirty(true);
                        if (contentLocale === 'en') {
                          setCheckInInstructions(e.target.value);
                        } else {
                          setTrans(contentLocale, 'checkInInstructions', e.target.value);
                        }
                      }}
                      placeholder={
                        contentLocale === 'ar'
                          ? 'إحضار بطاقة هوية صالحة وبطاقة دفع عند الوصول...'
                          : 'Valid photo ID and credit card required at check-in...'
                      }
                    />
                  </label>

                  <div className="sp-form-2">
                    <label>
                      <AdminText
                        en="Cancellation Policy Summary"
                        ar="ملخص سياسة الإلغاء"
                      />
                      <textarea
                        rows={3}
                        dir={contentLocale === 'ar' ? 'rtl' : 'ltr'}
                        value={
                          contentLocale === 'en'
                            ? cancellationSummary
                            : getTrans(contentLocale, 'cancellationSummary', cancellationSummary)
                        }
                        onChange={(e) => {
                          setDirty(true);
                          if (contentLocale === 'en') {
                            setCancellationSummary(e.target.value);
                          } else {
                            setTrans(contentLocale, 'cancellationSummary', e.target.value);
                          }
                        }}
                        placeholder={contentLocale === 'ar' ? 'إلغاء مجاني حتى 48 ساعة قبل الوصول...' : 'Free cancellation up to 48 hours prior to check-in...'}
                      />
                    </label>

                    <label>
                      <AdminText
                        en="Payment Terms & Tax Notes"
                        ar="شروط الدفع وملاحظات الضرائب"
                      />
                      <textarea
                        rows={3}
                        dir={contentLocale === 'ar' ? 'rtl' : 'ltr'}
                        value={
                          contentLocale === 'en'
                            ? paymentPolicy
                            : getTrans(contentLocale, 'paymentPolicy', paymentPolicy)
                        }
                        onChange={(e) => {
                          setDirty(true);
                          if (contentLocale === 'en') {
                            setPaymentPolicy(e.target.value);
                          } else {
                            setTrans(contentLocale, 'paymentPolicy', e.target.value);
                          }
                        }}
                        placeholder={contentLocale === 'ar' ? 'يشمل 14% ضريبة القيمة المضافة ورسوم الخدمة...' : 'Includes 14% VAT and service charges...'}
                      />
                    </label>
                  </div>
                </>
              )}

              {/* STEP 2: ROOMS */}
              {activeStep === 2 && (
                <>
                  <p className="sp-builder-note">
                    <Bed size={16} />
                    <AdminText
                      en="Define physical room types, guest occupancy thresholds, and bed arrangements. Each room category can hold one or more pricing rate plans in Step 4."
                      ar="حدد فئات الغرف الفعلية، الحدود الاستيعابية للنزلاء، وترتيبات الأسرّة. يمكن لكل فئة غرفة أن تضم خطة سعر واحدة أو أكثر في الخطوة 4."
                    />
                  </p>
                  <RoomRatesManager
                    hotelId={hotelId === 'new' ? '' : hotelId || ''}
                    roomTypes={initialHotel?.roomTypes || []}
                    ar={ar}
                    viewMode="rooms"
                    onRefresh={onRefresh || (() => {})}
                  />
                </>
              )}

              {/* STEP 3: RATES */}
              {activeStep === 3 && (
                <>
                  <p className="sp-builder-note">
                    <CreditCard size={16} />
                    <AdminText
                      en="Attach commercial rate plans, board basis (Room Only, Bed & Breakfast, Half Board, All Inclusive), and cancellation rules to your room categories."
                      ar="اربط خطط الأسعار التجارية، خطط الوجبات (إقامة فقط، إفطار، إقامة شاملة)، وسياسات الإلغاء بفئات الغرف المسجلة."
                    />
                  </p>
                  <RoomRatesManager
                    hotelId={hotelId === 'new' ? '' : hotelId || ''}
                    roomTypes={initialHotel?.roomTypes || []}
                    ar={ar}
                    viewMode="rates"
                    onRefresh={onRefresh || (() => {})}
                  />
                </>
              )}

              {/* STEP 4: INVENTORY */}
              {activeStep === 4 && (
                <>
                  <p className="sp-builder-note">
                    <CalendarDays size={16} />
                    <AdminText
                      en="Manage daily room allotments, blackout dates, stop-sale locks, and arrival restrictions across live calendar dates."
                      ar="إدارة الحصص اليومية للغرف، تواريخ الإيقاف (Stop-Sale)، وقيود الوصول والمغادرة عبر التقويم المباشر."
                    />
                  </p>
                  <InventoryCalendar
                    hotelId={hotelId === 'new' ? '' : hotelId || ''}
                    roomTypes={(initialHotel?.roomTypes as any) || []}
                    ar={ar}
                  />
                </>
              )}

              {/* STEP 5: MEDIA */}
              {activeStep === 5 && (
                <>
                  <div className="sp-field">
                    <span className="sp-label" style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>
                      <AdminText en="Primary Hotel Cover Photo" ar="صورة الغلاف الرئيسية للفندق" />
                    </span>
                    <ImageField
                      value={coverImage}
                      onChange={(url) => {
                        setCoverImage(url);
                        setDirty(true);
                      }}
                      preview="wide"
                      linkLabel={{ en: 'Cover photo URL', ar: 'رابط صورة الغلاف' }}
                      uploadLabel={{ en: 'Upload cover photo', ar: 'رفع صورة الغلاف' }}
                      previewAlt={name || 'Hotel cover'}
                    />
                  </div>

                  <div className="sp-builder-divider" style={{ margin: '16px 0' }} />

                  <div className="sp-builder-subhead" style={{ marginBottom: 12 }}>
                    <div>
                      <strong><AdminText en="Hotel Photo Gallery" ar="معرض صور الفندق" /></strong>
                      <small>
                        <AdminText
                          en="Secondary photography showing rooms, lobby, pool, dining, and surrounding views"
                          ar="صور ثانوية تعرض الغرف، بهو الاستقبال، المسبح، المطاعم، والإطلالات المحيطة"
                        />
                      </small>
                    </div>
                  </div>

                  <div className="sp-form-2">
                    <label>
                      <AdminText en="Add Image by URL" ar="إضافة صورة برابط مباشر" />
                      <input
                        value={newImageUrl}
                        dir="ltr"
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                      />
                    </label>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button
                        type="button"
                        className="sp-btn"
                        onClick={addGalleryImage}
                        style={{ height: 42, width: '100%', justifyContent: 'center' }}
                      >
                        <Plus size={16} />
                        <AdminText en="Add to Gallery" ar="إضافة للمعرض" />
                      </button>
                    </div>
                  </div>

                  {galleryUrls.length > 0 && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                        gap: 12,
                        marginTop: 12,
                        marginBottom: 16,
                      }}
                    >
                      {galleryUrls.map((url, idx) => (
                        <div
                          key={url + idx}
                          style={{
                            position: 'relative',
                            height: 100,
                            borderRadius: 10,
                            overflow: 'hidden',
                            border: '1px solid var(--sp-border)',
                            background: '#f8fafc',
                          }}
                        >
                          <img
                            src={url}
                            alt={`Gallery ${idx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(idx)}
                            aria-label="Remove image"
                            style={{
                              position: 'absolute',
                              top: 4,
                              insetInlineEnd: 4,
                              width: 26,
                              height: 26,
                              borderRadius: '50%',
                              border: 'none',
                              background: 'rgba(239, 68, 68, 0.9)',
                              color: '#fff',
                              display: 'grid',
                              placeItems: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label style={{ marginTop: 8 }}>
                    <AdminText en="Bulk Image URLs (one per line)" ar="روابط الصور دفعة واحدة (رابط في كل سطر)" />
                    <textarea
                      rows={4}
                      value={galleryText}
                      dir="ltr"
                      onChange={(e) => {
                        setGalleryText(e.target.value);
                        setDirty(true);
                      }}
                      onBlur={handleGalleryTextBlur}
                      placeholder="https://images.unsplash.com/photo-1&#10;https://images.unsplash.com/photo-2"
                    />
                  </label>
                </>
              )}

              {/* STEP 6: MAP */}
              {activeStep === 6 && (
                <>
                  <p className="sp-builder-note">
                    <MapPin size={16} />
                    <AdminText
                      en="Configure the exact property pin location and GPS coordinates for guest navigation, map discovery, and the public hotel details page."
                      ar="حدد موقع الفندق بدقة على الخريطة وإحداثيات GPS لتوجيه النزلاء واستكشاف الخريطة وصفحة الفندق العامة."
                    />
                  </p>

                  {/* Location Summary Bar */}
                  <div
                    style={{
                      padding: '14px 16px',
                      background: '#f8fafc',
                      borderRadius: 12,
                      border: '1px solid var(--sp-border)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--sp-orange)',
                          letterSpacing: 0.5,
                          display: 'block',
                        }}
                      >
                        <AdminText en="Property Address (from Basic Step)" ar="عنوان المنشأة (من الخطوة الأساسية)" />
                      </span>
                      <strong style={{ fontSize: 14, color: 'var(--sp-blue-deep)' }}>
                        {address || (ar ? 'لم يتم تحديد عنوان الشارع بعد' : 'No street address specified yet')}, {city || 'Cairo'}, {countryCode || 'EG'}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {latitude && longitude ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 10px',
                            background: '#dcfce7',
                            color: '#166534',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          <CheckCircle2 size={14} />
                          <AdminText en="Coordinates Configured" ar="الإحداثيات محددة" />
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="sp-btn small"
                          onClick={autoLocateFromCity}
                        >
                          <Compass size={14} />
                          <AdminText en="Auto-locate from City" ar="تحديد تلقائي حسب المدينة" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Interactive Dynamic Location & Hotel Name Search */}
                  <div
                    style={{
                      marginTop: 14,
                      padding: '14px 16px',
                      background: '#fff',
                      borderRadius: 12,
                      border: '1px solid var(--sp-border)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    }}
                  >
                    <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--sp-blue-deep)', display: 'block', marginBottom: 6 }}>
                      <AdminText en="Search Hotel Location / Google Maps Place" ar="البحث عن اسم الفندق أو المكان في الخريطة" />
                    </label>
                    <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--sp-muted)' }}>
                      <AdminText
                        en="Type the hotel name, neighborhood, street, or paste coordinates / Google Maps link to instantly pin location."
                        ar="اكتب اسم الفندق، المنطقة، الشارع، أو الصق الإحداثيات / رابط خرائط جوجل لتحديد وتثبيت الموقع فوراً."
                      />
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ position: 'relative', flex: '1 1 260px' }}>
                        <input
                          type="text"
                          className="sp-input"
                          style={{ width: '100%', paddingInlineEnd: 32 }}
                          placeholder={ar ? 'مثال: Marriott Mena House Giza أو الصق رابط خرائط جوجل...' : 'e.g. Marriott Mena House Giza or paste coordinates / link...'}
                          value={mapSearchQuery}
                          onChange={(e) => setMapSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleMapSearch();
                            }
                          }}
                        />
                        {searchingMap && (
                          <div style={{ position: 'absolute', top: 10, right: ar ? 'auto' : 10, left: ar ? 10 : 'auto' }}>
                            <Loader2 size={16} className="animate-spin" style={{ color: 'var(--sp-orange)' }} />
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        className="sp-btn primary"
                        disabled={searchingMap}
                        onClick={() => handleMapSearch()}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        {searchingMap ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                        <AdminText en="Search Location" ar="بحث في الخريطة" />
                      </button>

                      {name && (
                        <button
                          type="button"
                          className="sp-btn"
                          title={ar ? 'البحث باسم الفندق المكتوب في الخطوة الأولى' : 'Search by hotel name from Basic step'}
                          onClick={() => {
                            const hotelQuery = `${name} ${city || ''}`.trim();
                            setMapSearchQuery(hotelQuery);
                            handleMapSearch(hotelQuery);
                          }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          <Compass size={14} style={{ color: 'var(--sp-orange)' }} />
                          <AdminText en={`Search "${name.slice(0, 18)}..."`} ar={`بحث باسم الفندق`} />
                        </button>
                      )}

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapSearchQuery || `${name || 'Hotel'} ${city || 'Cairo'}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sp-btn"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <ExternalLink size={14} />
                        <AdminText en="Open in Google Maps" ar="فتح في خرائط جوجل" />
                      </a>
                    </div>

                    {/* Search Results Dropdown/List */}
                    {mapSearchResults.length > 0 && (
                      <div
                        style={{
                          marginTop: 10,
                          padding: 8,
                          background: '#f8fafc',
                          borderRadius: 8,
                          border: '1px solid var(--sp-border)',
                          maxHeight: 200,
                          overflowY: 'auto',
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sp-muted)', marginBottom: 6, padding: '2px 6px' }}>
                          <AdminText en="Matching locations found (click to select and pin):" ar="النتائج المطابقة (اضغط لاختيار وتثبيت الموقع):" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {mapSearchResults.map((res, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setLatitude(res.lat.toFixed(6));
                                setLongitude(res.lng.toFixed(6));
                                setDirty(true);
                                setMapSearchResults([]);
                                toast.success(ar ? `تم تثبيت الموقع: ${res.name}` : `Location pinned: ${res.name}`);
                              }}
                              style={{
                                textAlign: 'start',
                                padding: '8px 10px',
                                background: '#fff',
                                border: '1px solid var(--sp-border)',
                                borderRadius: 6,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 8,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                                <MapPin size={14} style={{ color: 'var(--sp-orange)', flexShrink: 0 }} />
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  <strong style={{ fontSize: 12, color: 'var(--sp-blue-deep)', display: 'block' }}>{res.name}</strong>
                                  <span style={{ fontSize: 11, color: 'var(--sp-muted)' }}>{res.displayName}</span>
                                </div>
                              </div>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: 'var(--sp-blue-deep)',
                                  background: 'var(--sp-blue-50, #eff6ff)',
                                  padding: '3px 8px',
                                  borderRadius: 4,
                                  flexShrink: 0,
                                }}
                              >
                                {ar ? 'تثبيت هذا الموقع' : 'Pin This Location'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Egyptian Travel Hub Presets */}
                  <div style={{ marginTop: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--sp-blue-deep)', display: 'block', marginBottom: 6 }}>
                      <AdminText en="Quick Egyptian Destination Presets" ar="أو اختر من المواقع السياحية السريعة" />
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {EGYPT_MAP_PRESETS.map((preset) => {
                        const isMatch =
                          numLat !== null &&
                          numLng !== null &&
                          Math.abs(numLat - preset.lat) < 0.001 &&
                          Math.abs(numLng - preset.lng) < 0.001;
                        return (
                          <button
                            key={preset.labelEn}
                            type="button"
                            onClick={() => {
                              setLatitude(String(preset.lat));
                              setLongitude(String(preset.lng));
                              setDirty(true);
                            }}
                            className="sp-btn"
                            style={{
                              fontSize: 11.5,
                              padding: '5px 10px',
                              background: isMatch ? 'var(--sp-blue-deep)' : '#fff',
                              color: isMatch ? '#fff' : 'var(--sp-blue-deep)',
                              borderColor: isMatch ? 'var(--sp-blue-deep)' : 'var(--sp-border)',
                            }}
                          >
                            <MapPin size={12} style={{ color: isMatch ? '#fff' : 'var(--sp-orange)' }} />
                            <span>{ar ? preset.labelAr : preset.labelEn}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interactive Map Visual Preview with Google Maps Embed */}
                  <div style={{ marginTop: 16 }}>
                    {numLat !== null && numLng !== null ? (
                      <div
                        style={{
                          borderRadius: 12,
                          overflow: 'hidden',
                          border: '1px solid var(--sp-border)',
                          background: '#f1f5f9',
                          position: 'relative',
                        }}
                      >
                        <iframe
                          title="Hotel Location Map"
                          width="100%"
                          height="340"
                          style={{ border: 0, display: 'block' }}
                          loading="lazy"
                          src={`https://maps.google.com/maps?q=${numLat},${numLng}&z=15&ie=UTF8&iwloc=&output=embed`}
                        />
                        <div
                          style={{
                            padding: '8px 14px',
                            background: '#fff',
                            borderTop: '1px solid var(--sp-border)',
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                          }}
                        >
                          <div style={{ fontSize: 12, color: 'var(--sp-muted)', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span>
                              <strong>Lat:</strong> {numLat.toFixed(5)}
                            </span>
                            <span>
                              <strong>Lng:</strong> {numLng.toFixed(5)}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, color: 'var(--sp-muted)' }}>
                              <AdminText en="Nudge pin:" ar="تحريك النقطة:" />
                            </span>
                            <button
                              type="button"
                              className="sp-btn small"
                              title={ar ? 'تحريك شمالاً' : 'Nudge North'}
                              onClick={() => adjustCoords(0.001, 0)}
                            >
                              ↑ N
                            </button>
                            <button
                              type="button"
                              className="sp-btn small"
                              title={ar ? 'تحريك جنوباً' : 'Nudge South'}
                              onClick={() => adjustCoords(-0.001, 0)}
                            >
                              ↓ S
                            </button>
                            <button
                              type="button"
                              className="sp-btn small"
                              title={ar ? 'تحريك غرباً' : 'Nudge West'}
                              onClick={() => adjustCoords(0, -0.001)}
                            >
                              ← W
                            </button>
                            <button
                              type="button"
                              className="sp-btn small"
                              title={ar ? 'تحريك شرقاً' : 'Nudge East'}
                              onClick={() => adjustCoords(0, 0.001)}
                            >
                              → E
                            </button>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${numLat},${numLng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="sp-btn small"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <ExternalLink size={13} />
                              <AdminText en="Google Maps" ar="خرائط جوجل" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          borderRadius: 12,
                          overflow: 'hidden',
                          border: '1px solid var(--sp-border)',
                          background: '#f8fafc',
                        }}
                      >
                        {/* Live Google Maps preview based on hotel query/city even before coordinates are explicitly set */}
                        <iframe
                          title="Hotel Location Map Preview"
                          width="100%"
                          height="280"
                          style={{ border: 0, display: 'block' }}
                          loading="lazy"
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(mapSearchQuery || `${name || 'Cairo'} ${city || 'Egypt'}`)}&z=13&ie=UTF8&iwloc=&output=embed`}
                        />
                        <div style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid var(--sp-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sp-blue-deep)', display: 'block' }}>
                              <AdminText en="Map preview centered on current name / city" ar="معاينة الخريطة مركزة على الاسم والمدينة الحالية" />
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--sp-muted)' }}>
                              <AdminText en="Use the search box above to find and pin exact coordinates, or click default below." ar="استخدم مربع البحث أعلاه لتحديد وتثبيت الإحداثيات الدقيقة، أو اختر الإحداثيات الافتراضية." />
                            </span>
                          </div>
                          <button
                            type="button"
                            className="sp-btn primary"
                            onClick={() => {
                              setLatitude('30.0444');
                              setLongitude('31.2357');
                              setDirty(true);
                            }}
                          >
                            <Compass size={16} />
                            <AdminText en="Pin Cairo Center Default" ar="تثبيت إحداثيات القاهرة الافتراضية" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Advanced / Secondary Manual Coordinate Inputs */}
                  <details
                    className="sp-advanced-coords"
                    style={{
                      marginTop: 16,
                      border: '1px solid var(--sp-border)',
                      borderRadius: 10,
                      padding: 12,
                      background: '#fff',
                    }}
                    open={!latitude || !longitude}
                  >
                    <summary
                      style={{
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: 13,
                        color: 'var(--sp-blue-deep)',
                        userSelect: 'none',
                      }}
                    >
                      <AdminText en="Manual GPS Coordinates (Advanced)" ar="إحداثيات GPS اليدوية (متقدم)" />
                    </summary>
                    <div className="sp-form-2" style={{ marginTop: 12 }}>
                      <label>
                        <AdminText en="Latitude (e.g. 30.0444)" ar="خط العرض (مثال: 30.0444)" />
                        <input
                          value={latitude}
                          dir="ltr"
                          inputMode="decimal"
                          onChange={(e) => {
                            setLatitude(e.target.value);
                            setDirty(true);
                          }}
                          placeholder="30.0444"
                        />
                      </label>
                      <label>
                        <AdminText en="Longitude (e.g. 31.2357)" ar="خط الطول (مثال: 31.2357)" />
                        <input
                          value={longitude}
                          dir="ltr"
                          inputMode="decimal"
                          onChange={(e) => {
                            setLongitude(e.target.value);
                            setDirty(true);
                          }}
                          placeholder="31.2357"
                        />
                      </label>
                    </div>
                    {latitude && longitude && (
                      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="sp-btn small danger"
                          onClick={() => {
                            setLatitude('');
                            setLongitude('');
                            setDirty(true);
                          }}
                        >
                          <Trash2 size={13} />
                          <AdminText en="Clear Coordinates" ar="مسح الإحداثيات" />
                        </button>
                      </div>
                    )}
                  </details>

                  {/* Public Page Thinking: Hotel Location Orientation Preview */}
                  <article
                    className="sp-repeat-card"
                    style={{ marginTop: 16, background: '#f8fafc' }}
                  >
                    <header>
                      <span><Navigation size={16} /></span>
                      <strong>
                        <AdminText en="Public Hotel Detail Orientation" ar="معاينة قسم الموقع في صفحة الفندق العامة" />
                      </strong>
                    </header>
                    <p style={{ fontSize: 12.5, color: 'var(--sp-muted)', margin: '0 0 10px' }}>
                      <AdminText
                        en="This information will appear in the 'Location & Surroundings' section of the public hotel page to guide guests before booking."
                        ar="ستظهر هذه المعلومات في قسم 'الموقع والمناطق المحيطة' بصفحة الفندق العامة لإرشاد النزلاء قبل الحجز."
                      />
                    </p>
                    <div
                      style={{
                        padding: 12,
                        background: '#fff',
                        borderRadius: 8,
                        border: '1px solid var(--sp-border)',
                        display: 'grid',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--sp-blue-deep)', fontWeight: 700, fontSize: 13 }}>
                        <MapPin size={15} style={{ color: 'var(--sp-orange)' }} />
                        <span>{name || (ar ? 'اسم الفندق' : 'Hotel Property Name')} · {city || 'Cairo'}, {countryCode || 'EG'}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--sp-muted)' }}>
                        <strong>{ar ? 'العنوان الرسمي:' : 'Address:'}</strong> {address || (ar ? 'لم يحدد بعد' : 'Not set yet')}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--sp-muted)', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        {phone && (
                          <span>
                            <strong>{ar ? 'الهاتف:' : 'Phone:'}</strong> {phone}
                          </span>
                        )}
                        {email && (
                          <span>
                            <strong>{ar ? 'البريد:' : 'Email:'}</strong> {email}
                          </span>
                        )}
                        {website && (
                          <span>
                            <strong>{ar ? 'الموقع الإلكتروني:' : 'Website:'}</strong>{' '}
                            <span dir="ltr">{website}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                </>
              )}

              {/* STEP 7: SEO & PUBLISH */}
              {activeStep === 7 && (
                <>
                  <label>
                    <AdminText en="SEO Meta Title" ar="عنوان الميتا" />
                    <input
                      dir={contentLocale === 'ar' ? 'rtl' : 'ltr'}
                      value={
                        contentLocale === 'en'
                          ? seoTitle
                          : getTrans(contentLocale, 'seoTitle', seoTitle)
                      }
                      onChange={(e) => {
                        setDirty(true);
                        if (contentLocale === 'en') {
                          setSeoTitle(e.target.value);
                        } else {
                          setTrans(contentLocale, 'seoTitle', e.target.value);
                        }
                      }}
                      placeholder={
                        contentLocale === 'ar'
                          ? 'أفضل الفنادق الفاخرة في القاهرة | تراف نيدز'
                          : 'Best Luxury Nile Hotels in Cairo | TravNeeds'
                      }
                    />
                  </label>

                  <label>
                    <AdminText en="SEO Meta Description" ar="وصف الميتا" />
                    <textarea
                      rows={3}
                      dir={contentLocale === 'ar' ? 'rtl' : 'ltr'}
                      value={
                        contentLocale === 'en'
                          ? seoDescription
                          : getTrans(contentLocale, 'seoDescription', seoDescription)
                      }
                      onChange={(e) => {
                        setDirty(true);
                        if (contentLocale === 'en') {
                          setSeoDescription(e.target.value);
                        } else {
                          setTrans(contentLocale, 'seoDescription', e.target.value);
                        }
                      }}
                      placeholder={
                        contentLocale === 'ar'
                          ? 'احجز غرفتك الفاخرة في قلب القاهرة بإطلالة مباشرة على النيل مع تأكيد فوري...'
                          : 'Book your luxury stay overlooking the River Nile with direct reservations...'
                      }
                    />
                  </label>

                  <div className="sp-builder-divider" style={{ margin: '16px 0' }} />

                  <div className="sp-form-2">
                    <label>
                      <AdminText en="Publication Status" ar="حالة النشر والظهور" />
                      <select
                        value={status}
                        onChange={(e) => {
                          setStatus(e.target.value);
                          setDirty(true);
                        }}
                      >
                        <option value="DRAFT">{ar ? 'مسودة (Draft)' : 'Draft'}</option>
                        <option value="PUBLISHED">{ar ? 'منشور (Published)' : 'Published'}</option>
                        <option value="ARCHIVED">{ar ? 'مؤرشف (Archived)' : 'Archived'}</option>
                      </select>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', paddingTop: 20 }}>
                      <StatusPill status={status.toLowerCase() as any} />
                    </div>
                  </div>

                  <div className="sp-review-grid" style={{ marginTop: 16 }}>
                    <div>
                      <small><AdminText en="Hotel Property" ar="المنشأة الفندقية" /></small>
                      <strong>{name || (ar ? 'بدون عنوان' : 'Untitled Hotel')}</strong>
                      <span>{propertyType} · {starRating ? `${starRating} Stars` : 'Unrated'}</span>
                    </div>
                    <div>
                      <small><AdminText en="Location" ar="الموقع" /></small>
                      <strong>{city || 'Cairo'}, {countryCode || 'EG'}</strong>
                      <span>{address || 'No street address'}</span>
                    </div>
                    <div>
                      <small><AdminText en="Rooms & Rates" ar="الغرف والأسعار" /></small>
                      <strong>{initialHotel?.roomTypes?.length || 0} <AdminText en="room categories" ar="فئات غرف" /></strong>
                      <span>
                        {(initialHotel?.roomTypes || []).reduce((acc, rt) => acc + (rt.ratePlans?.length || 0), 0)}{' '}
                        <AdminText en="rate plans registered" ar="خطط أسعار مسجلة" />
                      </span>
                    </div>
                    <div>
                      <small><AdminText en="Media Gallery" ar="معرض الوسائط" /></small>
                      <strong>{galleryUrls.length + (coverImage ? 1 : 0)} <AdminText en="photos" ar="صور" /></strong>
                      <span>{coverImage ? (ar ? 'تم تعيين الغلاف' : 'Cover image set') : (ar ? 'بدون غلاف' : 'No cover image')}</span>
                    </div>
                    <div>
                      <small><AdminText en="Policies" ar="السياسات" /></small>
                      <strong>{checkInTime} / {checkOutTime}</strong>
                      <span>
                        {ar
                          ? `الحد الأدنى ${checkInAge} سنة · ${depositRequired ? `مقدم ${depositPercentage}%` : 'بدون مقدم'}`
                          : `Min age ${checkInAge} · ${depositRequired ? `${depositPercentage}% deposit` : 'No deposit'}`}
                      </span>
                    </div>
                    <div>
                      <small><AdminText en="Visibility" ar="الظهور" /></small>
                      <strong><StatusPill status={status.toLowerCase() as any} /></strong>
                      <span>
                        {status === 'PUBLISHED'
                          ? ar
                            ? 'ظاهر في دليل الفنادق ومحرك الحجز العام.'
                            : 'Visible in public directory and booking engine.'
                          : ar
                          ? 'مخفي عن واجهة الحجز العامة.'
                          : 'Hidden from public storefront.'}
                      </span>
                    </div>
                    <p className="sp-builder-note full">
                      <AdminText
                        en="Save & Publish writes this hotel property to the database. The public hotels directory and reservation engine read the same live record."
                        ar="الحفظ والنشر يكتبان بيانات الفندق في قاعدة البيانات مباشرة. يقرأ دليل الفنادق ومحرك الحجز نفس السجل المحفوظ."
                      />
                    </p>
                  </div>
                </>
              )}

              {/* Bottom Actions Row (.sp-builder-actions) */}
              <div className="sp-builder-actions" style={{ marginTop: 24 }}>
                {activeStep > 0 && (
                  <button
                    type="button"
                    className="sp-btn"
                    onClick={() => setActiveStep((c) => c - 1)}
                    disabled={saving}
                  >
                    <AdminText en="Back" ar="رجوع" />
                  </button>
                )}

                {!isLastStep ? (
                  <button
                    type="button"
                    className="sp-btn primary"
                    onClick={nextStep}
                    disabled={saving}
                  >
                    <AdminText en="Continue" ar="متابعة" />
                  </button>
                ) : (
                  <>
                    {status !== 'PUBLISHED' && (
                      <button
                        type="button"
                        className="sp-btn"
                        onClick={() => void handleSave('DRAFT')}
                        disabled={saving}
                      >
                        <Save size={16} />
                        <AdminText en="Save Draft" ar="حفظ المسودة" />
                      </button>
                    )}
                    <button
                      type="button"
                      className="sp-btn primary"
                      onClick={() => void handleSave('PUBLISHED')}
                      disabled={saving}
                    >
                      <Save size={16} />
                      <AdminText en="Save & Publish" ar="حفظ ونشر" />
                    </button>
                  </>
                )}
              </div>
            </Tabs.Panel>
          </Tabs.Root>
        </Card>

        {/* Right Sticky Column: Live Hotel Preview */}
        <HotelBuilderPreview
          draft={previewDraft}
          activeLocale={previewLocale}
          onLocaleChange={setPreviewLocale}
        />
      </div>
    </>
  );
}
