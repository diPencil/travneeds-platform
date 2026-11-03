'use client';

import React, { Suspense, useEffect, useRef, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  MapPin,
  Building2,
  Star,
  X,
  ArrowRight,
} from 'lucide-react';
import { Breadcrumb, HelpCTA, SiteShell } from '@/components/site';
import { SharedSelect } from '@/components/shared/shared-select';
import { tx, useLocale } from '@/components/locale';
import { HotelCard } from './hotel-card';
import { usePublicHotelsList } from '@/lib/hotels/hotels-client';

const copy = {
  en: {
    title: 'Find Your Hotel in Egypt',
    subtitle: 'From iconic Nile-side luxury to Red Sea beachfront resorts. Book the perfect stay.',
    searchPlaceholder: 'Search by hotel name, city, or location...',
    allDestinations: 'All destinations',
    destination: 'Destination',
    propertyType: 'Property type',
    allTypes: 'All property types',
    starRating: 'Star rating',
    allStars: 'All star ratings',
    filters: 'Filters',
    clear: 'Clear filters',
    results: 'hotels available',
    showing: 'Showing',
    of: 'of',
    sort: 'Sort by',
    sortLabels: ['Recommended', 'Stars: high to low', 'Name: A to Z'],
    empty: 'No hotels match these filters.',
    emptyHelp: 'Try a different search term or clear the filters to see all properties.',
    previous: 'Previous page',
    next: 'Next page',
    page: 'Page',
    grid: 'Grid view',
    list: 'List view',
  },
  ar: {
    title: 'اعثر على فندقك في مصر',
    subtitle: 'من فنادق النيل الفاخرة إلى منتجعات البحر الأحمر الساحلية. اختر الإقامة المثالية.',
    searchPlaceholder: 'ابحث باسم الفندق، المدينة، أو الموقع...',
    allDestinations: 'كل الوجهات',
    destination: 'الوجهة / المدينة',
    propertyType: 'نوع المنشأة',
    allTypes: 'كل الأنواع',
    starRating: 'تصنيف النجوم',
    allStars: 'كل النجوم',
    filters: 'الفلاتر',
    clear: 'مسح الفلاتر',
    results: 'فندق متاح',
    showing: 'عرض',
    of: 'من',
    sort: 'الترتيب',
    sortLabels: ['الموصى بها', 'النجوم: من الأعلى', 'الاسم: أ إلى ي'],
    empty: 'لا توجد فنادق تطابق هذا البحث.',
    emptyHelp: 'جرّب بحثاً آخر أو امسح الفلاتر لعرض كافة المنشآت.',
    previous: 'الصفحة السابقة',
    next: 'الصفحة التالية',
    page: 'صفحة',
    grid: 'عرض شبكي',
    list: 'عرض قائمة',
  },
  es: {
    title: 'Encuentra tu hotel en Egipto',
    subtitle: 'Desde hoteles de lujo junto al Nilo hasta complejos turísticos en el Mar Rojo.',
    searchPlaceholder: 'Busca por nombre de hotel, ciudad o ubicación...',
    allDestinations: 'Todos los destinos',
    destination: 'Destino',
    propertyType: 'Tipo de propiedad',
    allTypes: 'Todos los tipos',
    starRating: 'Estrellas',
    allStars: 'Todas las estrellas',
    filters: 'Filtros',
    clear: 'Borrar filtros',
    results: 'hoteles disponibles',
    showing: 'Mostrando',
    of: 'de',
    sort: 'Ordenar por',
    sortLabels: ['Recomendados', 'Estrellas: de mayor a menor', 'Nombre: A a Z'],
    empty: 'Ningún hotel coincide con estos filtros.',
    emptyHelp: 'Prueba otra búsqueda o borra los filtros.',
    previous: 'Página anterior',
    next: 'Página siguiente',
    page: 'Página',
    grid: 'Vista de cuadrícula',
    list: 'Vista de lista',
  },
  it: {
    title: 'Trova il tuo hotel in Egitto',
    subtitle: 'Dal lusso iconico lungo il Nilo ai resort sul Mar Rosso. Prenota il soggiorno ideale.',
    searchPlaceholder: 'Cerca per nome dell’hotel, città o posizione...',
    allDestinations: 'Tutte le destinazioni',
    destination: 'Destinazione',
    propertyType: 'Tipo di struttura',
    allTypes: 'Tutti i tipi',
    starRating: 'Stelle',
    allStars: 'Tutte le stelle',
    filters: 'Filtri',
    clear: 'Cancella filtri',
    results: 'hotel disponibili',
    showing: 'Visualizzati',
    of: 'di',
    sort: 'Ordina per',
    sortLabels: ['Consigliati', 'Stelle: dal più alto', 'Nome: da A a Z'],
    empty: 'Nessun hotel corrisponde a questi filtri.',
    emptyHelp: 'Prova un’altra ricerca o cancella i filtri.',
    previous: 'Pagina precedente',
    next: 'Pagina successiva',
    page: 'Pagina',
    grid: 'Vista griglia',
    list: 'Vista elenco',
  },
} as const;

function HotelsContent() {
  const { locale } = useLocale();
  const t = copy[locale];
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawQ = searchParams.get('q') || '';
  const rawCity = searchParams.get('city') || '';
  const rawType = searchParams.get('type') || '';
  const rawStars = searchParams.get('stars') ? Number(searchParams.get('stars')) : 0;
  const rawSort = searchParams.get('sort') || 'recommended';
  const rawPage = Number(searchParams.get('page')) || 1;

  const [search, setSearch] = useState(rawQ);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterTrigger = useRef<HTMLButtonElement>(null);

  useEffect(() => setSearch(rawQ), [rawQ]);

  const { data, loading, error } = usePublicHotelsList({
    q: rawQ || undefined,
    city: rawCity || undefined,
    propertyType: rawType || undefined,
    stars: rawStars > 0 ? rawStars : undefined,
    page: rawPage,
    limit: 12,
  });

  const update = (next: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    if (!('page' in next)) params.delete('page');
    const query = params.toString();
    router.replace(`/hotels${query ? `?${query}` : ''}`, { scroll: false });
  };

  const hotels = useMemo(() => {
    const list = [...(data?.items ?? [])];
    if (rawSort === 'stars_desc') {
      list.sort((a, b) => (b.starRating || 0) - (a.starRating || 0));
    } else if (rawSort === 'name_asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [data?.items, rawSort]);

  const activeCount = [rawCity, rawType, rawStars > 0 ? String(rawStars) : '', rawQ].filter(Boolean).length;
  const destinationOptions = data?.destinations || ['Cairo', 'Giza', 'Luxor', 'Aswan', 'Hurghada', 'Sharm El Sheikh', 'Alexandria'];

  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const page = data?.page ?? 1;

  return (
    <>
      <div className="trips-intro">
        <div className="container trips-intro-inner">
          <div>
            <span className="trips-eyebrow">
              {tx(locale, {
                en: 'TravNeeds Hotels & Lodging',
                ar: 'فنادق وإقامات TravNeeds',
                es: 'Hoteles y alojamientos TravNeeds',
                it: 'Hotel e alloggi TravNeeds',
              })}
            </span>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
          <div className="trips-intro-count">
            <strong>{total}</strong>
            <span>
              {tx(locale, {
                en: 'Hotels',
                ar: 'فندق',
                es: 'Hoteles',
                it: 'Hotel',
              })}
            </span>
          </div>
        </div>
      </div>

      <main className="container trips-page">
        {/* Search Bar */}
        <form
          className="trips-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: search.trim().slice(0, 120) });
          }}
        >
          <div className="trips-search-field">
            <Search size={21} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchPlaceholder}
              maxLength={120}
            />
          </div>
          <button type="submit">
            {tx(locale, { en: 'Search', ar: 'بحث', es: 'Buscar', it: 'Cerca' })}
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </form>

        {/* Mobile Filter Toggle */}
        <button
          ref={filterTrigger}
          type="button"
          className="trips-mobile-filter-toggle"
          aria-expanded={filtersOpen}
          aria-controls="hotels-filter-panel"
          onClick={() => setFiltersOpen((o) => !o)}
        >
          <SlidersHorizontal size={18} />
          <span>{t.filters}</span>
          {activeCount > 0 && <b>{activeCount}</b>}
        </button>

        <div className="trips-layout">
          {/* Aside Filters */}
          <aside
            id="hotels-filter-panel"
            className={`trips-filters${filtersOpen ? ' is-open' : ''}`}
            aria-label={t.filters}
          >
            <div className="trips-filter-head">
              <h2>
                <SlidersHorizontal size={19} />
                {t.filters}
                {activeCount > 0 && <span>{activeCount}</span>}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  router.replace('/hotels', { scroll: false });
                }}
              >
                {t.clear}
              </button>
            </div>

            {/* Destination / City Select */}
            <div className="trips-filter-group">
              <label className="trips-select-label" htmlFor="hotel-city-filter">
                {t.destination}
              </label>
              <div className="trips-select">
                <MapPin size={17} />
                <SharedSelect
                  id="hotel-city-filter"
                  value={rawCity}
                  onChange={(next) => update({ city: next })}
                  locale={locale}
                  options={[
                    { value: '', label: t.allDestinations },
                    ...destinationOptions.map((c) => ({ value: c, label: c })),
                  ]}
                />
              </div>
            </div>

            {/* Star Rating Select */}
            <div className="trips-filter-group">
              <label className="trips-select-label" htmlFor="hotel-stars-filter">
                {t.starRating}
              </label>
              <div className="trips-select">
                <Star size={17} />
                <SharedSelect
                  id="hotel-stars-filter"
                  value={rawStars ? String(rawStars) : ''}
                  onChange={(next) => update({ stars: next })}
                  locale={locale}
                  options={[
                    { value: '', label: t.allStars },
                    { value: '5', label: '5 Stars ★★★★★' },
                    { value: '4', label: '4 Stars ★★★★' },
                    { value: '3', label: '3 Stars ★★★' },
                  ]}
                />
              </div>
            </div>

            {/* Property Type Radio Filter */}
            <fieldset className="trips-filter-group">
              <legend>{t.propertyType}</legend>
              <label>
                <input
                  type="radio"
                  name="hotel-property-type"
                  checked={!rawType}
                  onChange={() => update({ type: '' })}
                />
                <span>{t.allTypes}</span>
              </label>
              {[
                { value: 'HOTEL', label: tx(locale, { en: 'Hotel', ar: 'فندق', es: 'Hotel', it: 'Hotel' }) },
                { value: 'RESORT', label: tx(locale, { en: 'Resort', ar: 'منتجع', es: 'Resort', it: 'Resort' }) },
                { value: 'BOUTIQUE', label: tx(locale, { en: 'Boutique Hotel', ar: 'فندق بوتيك', es: 'Boutique', it: 'Boutique' }) },
                { value: 'APARTMENT', label: tx(locale, { en: 'Apartment', ar: 'شقة فندقية', es: 'Apartamento', it: 'Appartamento' }) },
                { value: 'VILLA', label: tx(locale, { en: 'Villa', ar: 'فيلا', es: 'Villa', it: 'Villa' }) },
              ].map((item) => (
                <label key={item.value}>
                  <input
                    type="radio"
                    name="hotel-property-type"
                    checked={rawType === item.value}
                    onChange={() => update({ type: item.value })}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </fieldset>

            <button
              type="button"
              className="trips-mobile-filter-done"
              onClick={() => {
                setFiltersOpen(false);
                filterTrigger.current?.focus({ preventScroll: true });
              }}
            >
              {tx(locale, {
                en: `Show ${hotels.length} hotels`,
                ar: `عرض ${hotels.length} فندق`,
                es: `Ver ${hotels.length} hoteles`,
                it: `Mostra ${hotels.length} hotel`,
              })}
              <ArrowRight size={17} />
            </button>
          </aside>

          {/* Results Catalog */}
          <div className="trips-catalog">
            <div className="trips-toolbar">
              <div>
                <strong role="status">
                  {total} {t.results}
                </strong>
                <span>
                  {total > 0
                    ? `${t.showing} ${(page - 1) * 12 + 1}-${Math.min(page * 12, total)} ${t.of} ${total}`
                    : ''}
                </span>
              </div>

              <div className="trips-toolbar-actions">
                <label>
                  {t.sort}
                  <SharedSelect
                    value={rawSort}
                    onChange={(next) => update({ sort: next })}
                    locale={locale}
                    options={[
                      { value: 'recommended', label: t.sortLabels[0] },
                      { value: 'stars_desc', label: t.sortLabels[1] },
                      { value: 'name_asc', label: t.sortLabels[2] },
                    ]}
                  />
                </label>

                <div
                  className="trips-view"
                  role="group"
                  aria-label={tx(locale, { en: 'View mode', ar: 'طريقة العرض', es: 'Vista', it: 'Vista' })}
                >
                  <button
                    type="button"
                    className={view === 'grid' ? 'active' : ''}
                    onClick={() => setView('grid')}
                    aria-label={t.grid}
                    aria-pressed={view === 'grid'}
                    title={t.grid}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    type="button"
                    className={view === 'list' ? 'active' : ''}
                    onClick={() => setView('list')}
                    aria-label={t.list}
                    aria-pressed={view === 'list'}
                    title={t.list}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                <p>
                  {tx(locale, {
                    en: 'Loading hotels...',
                    ar: 'جارٍ تحميل الفنادق...',
                    es: 'Cargando hoteles...',
                    it: 'Caricamento degli hotel...',
                  })}
                </p>
              </div>
            ) : hotels.length > 0 ? (
              <div className={`trips-results ${view}`}>
                {hotels.map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} variant={view} />
                ))}
              </div>
            ) : (
              <div className="trips-empty">
                <Building2 size={32} />
                <h2>{t.empty}</h2>
                <p>{t.emptyHelp}</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    router.replace('/hotels', { scroll: false });
                  }}
                >
                  <X size={16} />
                  {t.clear}
                </button>
              </div>
            )}

            {totalPages > 1 && (
              <nav
                className="trips-pagination"
                aria-label={tx(locale, { en: 'Hotel pages', ar: 'صفحات الفنادق', es: 'Páginas de hoteles', it: 'Pagine hotel' })}
              >
                <button
                  type="button"
                  onClick={() => update({ page: String(page - 1) })}
                  disabled={page <= 1}
                  aria-label={t.previous}
                >
                  <ArrowRight className="trips-prev-icon" size={17} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                  <button
                    key={number}
                    type="button"
                    className={number === page ? 'active' : ''}
                    onClick={() => update({ page: String(number) })}
                    aria-label={`${t.page} ${number}`}
                    aria-current={number === page ? 'page' : undefined}
                  >
                    {number}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => update({ page: String(page + 1) })}
                  disabled={page >= totalPages}
                  aria-label={t.next}
                >
                  <ArrowRight size={17} />
                </button>
              </nav>
            )}
          </div>
        </div>
      </main>

      <HelpCTA />
    </>
  );
}

export function HotelsPage() {
  const { locale } = useLocale();
  return (
    <SiteShell>
      <Breadcrumb
        items={[
          tx(locale, {
            en: 'Hotels & Lodging',
            ar: 'الفنادق والإقامة',
            es: 'Hoteles',
            it: 'Hotel',
          }),
        ]}
      />
      <Suspense fallback={<main className="container trips-page" aria-busy="true" />}>
        <HotelsContent />
      </Suspense>
    </SiteShell>
  );
}

