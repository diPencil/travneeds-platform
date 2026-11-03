'use client'
import { BrandMark } from '@/components/layout/brand-mark'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { PublicAppearancePortal } from '@/components/cms/public-appearance'
import { Star, CheckCircle2, Search, ChevronDown, Check } from 'lucide-react'
import { useLocale, tx } from '@/components/locale'
import { cn } from '@/lib/utils'
import { WEBSITE_REVIEW_SCOPE } from '@/lib/review-scope'
import { catalogTours } from '@/data/tours'
import { useDbTours } from '@/lib/tours-client'
import { isTourPublished } from '@/lib/tour-publish'
import './reviews-phase6.css'

/** Customer review from the database (public API shape). */
export type CustomerReview = {
  publicId: string
  rating: number
  title: string | null
  text: string
  publishedAt: string
  reviewerName: string
  scope?: 'website' | 'trips'
  trip?: { slug: string; title: string; href: string; category?: string } | null
}

/** Summary stats for a tour. */
export type ReviewSummary = {
  average: number | null
  count: number
}

/** Input for submitting a new review (API version). */
export type ReviewInput = {
  rating: number
  title: string
  text: string
  platform?: string
}

export function getCategoryLabel(category: string | undefined, locale: any): string {
  switch (category) {
    case 'one-day-tours':
      return tx(locale, { en: 'One-day tour', es: 'Circuito de un día', it: 'Tour di un giorno', ar: 'رحلة يوم واحد' })
    case 'multi-days-tours':
      return tx(locale, { en: 'Multi-day package', es: 'Paquete de varios días', it: 'Pacchetto di più giorni', ar: 'باقة عدة أيام' })
    case 'nile-cruises':
      return tx(locale, { en: 'Nile cruise', es: 'Crucero por el Nilo', it: 'Crociera sul Nilo', ar: 'كروز النيل' })
    case 'shore-excursions':
      return tx(locale, { en: 'Shore excursion', es: 'Excursión en tierra', it: 'Escursione a terra', ar: 'رحلة شاطئية' })
    default:
      return ''
  }
}

const AVATAR_COLORS = ['#1d4ed8', '#f7951d', '#0d2250', '#b8860b', '#00aa6c'] as const

export const avatarColor = (name: string) => {
  if (!name || typeof name !== 'string' || name.length === 0) {
    return AVATAR_COLORS[0]
  }
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export function StarsRow({ stars, size = 16 }: { stars: number; size?: number }) {
  const { locale } = useLocale()
  return (
    <span className="rev-stars" role="img" aria-label={tx(locale, { en: `${stars} out of 5 stars`, es: `${stars} de 5 estrellas`, it: `${stars} su 5 stelle`, ar: `${stars} من 5 نجوم` })}>
      {[0, 1, 2, 3, 4].map((s) => (
        <Star key={s} size={size} fill={s < stars ? '#ffc531' : 'none'} color="#ffc531" />
      ))}
    </span>
  )
}

/** Fetch published reviews + summary for a tour from the API. */
async function fetchTourReviews(tourSlug: string, page = 1): Promise<{ reviews: CustomerReview[]; summary: ReviewSummary; totalPages: number }> {
    const res = await fetch(`/api/reviews?tourSlug=${encodeURIComponent(tourSlug)}&page=${page}&_t=${Date.now()}`, { credentials: 'same-origin' })
    if (!res.ok) throw new Error('Failed to fetch reviews')
    const data = await res.json()
    return { reviews: data.reviews || [], summary: data.summary || { average: null, count: 0 }, totalPages: data.pagination?.totalPages ?? 0 }

}

/** Submit a new review via API. */
async function submitReview(tourSlug: string, input: ReviewInput): Promise<{ success: boolean; error?: string; status?: number }> {
  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ ...(tourSlug === WEBSITE_REVIEW_SCOPE ? { scope: 'website' } : { tourSlug }), ...input }),
    })
    const data = await res.json()
    if (!res.ok) return { success: false, error: data.error || 'Could not submit review.', status: res.status }
    return { success: true }
  } catch {
    return { success: false, error: 'Network error. Please try again.' }
  }
}

export type ReviewModalCopy = {
  heading: string
  forTour?: string
  context?: string
  reviewTitle: string
  reviewTitlePh: string
  rating: string
  review: string
  reviewPh: string
  cancel: string
  submit: string
  platform?: string
}

export function ReviewWriteModal({
  copy,
  tourSlug,
  tourTitle,
  allowTourSelection,
  onSubmit,
  onClose,
}: {
  copy: ReviewModalCopy
  tourSlug?: string
  tourTitle?: string
  allowTourSelection?: boolean
  onSubmit: (input: ReviewInput) => void
  onClose: () => void
}) {
  const { locale } = useLocale()
  const liveTours = useDbTours(catalogTours, { includeNew: true })
  const publishedTours = useMemo(() => {
    return liveTours
      .filter(isTourPublished)
      .slice()
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [liveTours])

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const filteredTours = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return publishedTours.filter((t) => {
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
      if (!q) return true
      const titleMatch = t.title.toLowerCase().includes(q)
      const titleArMatch = t.titleAr ? t.titleAr.toLowerCase().includes(q) : false
      const locMatch = t.location ? t.location.toLowerCase().includes(q) : false
      const slugMatch = t.slug.toLowerCase().includes(q)
      return titleMatch || titleArMatch || locMatch || slugMatch
    })
  }, [publishedTours, searchQuery, categoryFilter])

  const categoriesWithTours = useMemo(() => {
    const categories: Array<{ id: string; label: string }> = [
      { id: 'one-day-tours', label: tx(locale, { en: 'One-day tours', es: 'Circuitos de un día', it: 'Tour di un giorno', ar: 'رحلات اليوم الواحد' }) },
      { id: 'multi-days-tours', label: tx(locale, { en: 'Multi-day packages', es: 'Viajes de varios días', it: 'Viaggi di più giorni', ar: 'باقات عدة أيام' }) },
      { id: 'nile-cruises', label: tx(locale, { en: 'Nile cruises', es: 'Cruceros por el Nilo', it: 'Crociere sul Nilo', ar: 'كروز النيل' }) },
      { id: 'shore-excursions', label: tx(locale, { en: 'Shore excursions', es: 'Excursiones en tierra', it: 'Escursioni a terra', ar: 'رحلات شاطئية' }) },
    ]
    return categories
      .map((cat) => ({
        category: cat.id,
        label: cat.label,
        tours: filteredTours.filter((t) => t.category === cat.id),
      }))
      .filter((group) => group.tours.length > 0)
  }, [filteredTours, locale])

  const draftKey = allowTourSelection ? 'sp-rev-draft-trip' : (tourSlug && tourSlug !== WEBSITE_REVIEW_SCOPE ? `sp-rev-draft-${tourSlug}` : 'sp-rev-draft-website')

  const [selectedTour, setSelectedTour] = useState<string>(() => {
    if (typeof window === 'undefined') return tourSlug || ''
    try {
      const saved = sessionStorage.getItem(draftKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed?.selectedTour) return parsed.selectedTour
      }
    } catch {}
    return tourSlug || ''
  })

  const selectedTourObj = useMemo(() => {
    return publishedTours.find((t) => t.slug === selectedTour)
  }, [publishedTours, selectedTour])

  const [title, setTitle] = useState(() => {
    if (typeof window === 'undefined') return ''
    try {
      const saved = sessionStorage.getItem(draftKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed?.title) return parsed.title
      }
    } catch {}
    return ''
  })
  const [text, setText] = useState(() => {
    if (typeof window === 'undefined') return ''
    try {
      const saved = sessionStorage.getItem(draftKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed?.text) return parsed.text
      }
    } catch {}
    return ''
  })
  const [stars, setStars] = useState(() => {
    if (typeof window === 'undefined') return 5
    try {
      const saved = sessionStorage.getItem(draftKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed?.stars === 'number' && parsed.stars >= 1 && parsed.stars <= 5) return parsed.stars
      }
    } catch {}
    return 5
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const pending = useRef(false)
  const dialog = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  const textHintId = useId()
  const [needsSignIn, setNeedsSignIn] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Persist draft on changes to protect user input
  useEffect(() => {
    if (!mounted) return
    try {
      if (!text && !title && stars === 5 && (!selectedTour || selectedTour === tourSlug)) {
        sessionStorage.removeItem(draftKey)
      } else {
        sessionStorage.setItem(draftKey, JSON.stringify({ text, title, stars, selectedTour }))
      }
    } catch {}
  }, [mounted, draftKey, text, title, stars, selectedTour, tourSlug])

  useEffect(() => {
    if (!mounted) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current?.querySelector<HTMLElement>('textarea')?.focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending.current) close.current()
      if (event.key !== 'Tab') return
      const nodes = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), textarea:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]') ?? []).filter(node => node.tabIndex >= 0)
      if (!nodes.length) { event.preventDefault(); dialog.current?.focus(); return }
      const first = nodes[0], last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', keydown)
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); previous?.focus() }
  }, [mounted])

  const handleSubmit = async () => {
    if (pending.current) return
    const effectiveTourSlug = allowTourSelection ? selectedTour : (tourSlug || WEBSITE_REVIEW_SCOPE)
    if (allowTourSelection && !selectedTour) {
      setError(tx(locale, {
        en: 'Please select a trip to review.',
        es: 'Por favor, selecciona un viaje para valorar.',
        it: 'Seleziona un tour da recensire.',
        ar: 'يرجى اختيار رحلة للتقييم.'
      }))
      dialog.current?.querySelector<HTMLElement>('#rev-tour-select-button')?.focus()
      return
    }
    if (text.trim().length < 10 || text.trim().length > 5000 || stars < 1 || stars > 5) {
      setError(tx(locale, {
        en: 'Write between 10 and 5000 characters and choose a rating from 1 to 5.',
        es: 'Escribe entre 10 y 5000 caracteres y elige una valoración de 1 a 5.',
        it: 'Scrivi da 10 a 5000 caratteri e scegli una valutazione da 1 a 5.',
        ar: 'اكتب بين 10 و5000 حرف واختر تقييمًا من 1 إلى 5.'
      }))
      dialog.current?.querySelector<HTMLElement>('textarea')?.focus()
      return
    }
    pending.current = true
    setSubmitting(true)
    setError('')
    // Every public submission uses the moderated API, including the homepage.
    const result = await submitReview(effectiveTourSlug, { rating: stars, title: title.trim(), text: text.trim() })
    if (result.success) {
      try { sessionStorage.removeItem(draftKey) } catch {}
      onSubmit({ rating: stars, title: title.trim(), text: text.trim() })
    } else {
      setNeedsSignIn(result.status === 401)
      setError(result.status === 401
        ? tx(locale, {
            en: 'Sign in to submit your review. Your text is still here.',
            es: 'Inicia sesión para enviar tu reseña. Tu texto sigue aquí.',
            it: 'Accedi per inviare la recensione. Il tuo testo è ancora qui.',
            ar: 'سجّل الدخول لإرسال تقييمك. النص الخاص بك محفوظ هنا.'
          })
        : result.error || 'Could not submit review.')
    }
    setSubmitting(false)
    pending.current = false
  }

  if (!mounted) return null
  const effectiveTourSlug = allowTourSelection ? selectedTour : (tourSlug || WEBSITE_REVIEW_SCOPE)

  const modal = (
    <div className="rev-modal" onClick={() => { if (!pending.current) onClose() }}>
      <div ref={dialog} className="rev-modal-card" tabIndex={-1} role="dialog" aria-modal="true" aria-label={copy.heading} onClick={(e) => e.stopPropagation()}>
        <h3>{copy.heading}</h3>
        {copy.context && <p className="rev-modal-context">{copy.context}</p>}
        <form className="rev-form" onSubmit={event => { event.preventDefault(); void handleSubmit() }}>
          {allowTourSelection && (
            <div className="rev-tour-picker">
              <label>
                {tx(locale, { en: 'Select trip', es: 'Seleccionar viaje', it: 'Seleziona tour', ar: 'اختر الرحلة' })}
                <div className="rev-tour-search-wrap">
                  <Search size={15} className="rev-tour-search-icon" aria-hidden="true" />
                  <input
                    type="text"
                    className="rev-tour-search-input"
                    placeholder={tx(locale, {
                      en: 'Search trip by title or destination...',
                      es: 'Buscar viaje por título o destino...',
                      it: 'Cerca tour per titolo o destinazione...',
                      ar: 'ابحث باسم الرحلة أو المكان...'
                    })}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="rev-tour-search-clear"
                      onClick={() => setSearchQuery('')}
                      aria-label={tx(locale, { en: 'Clear search', es: 'Limpiar búsqueda', it: 'Cancella ricerca', ar: 'مسح البحث' })}
                    >
                      ×
                    </button>
                  )}
                </div>
              </label>

              <div className="rev-cat-filter-pills" role="radiogroup" aria-label={tx(locale, { en: 'Filter by tour type', es: 'Filtrar por tipo de viaje', it: 'Filtra per tipo di tour', ar: 'فلترة حسب نوع الرحلة' })}>
                {[
                  { id: 'all', label: tx(locale, { en: 'All types', es: 'Todos los tipos', it: 'Tutti i tipi', ar: 'كل الأنواع' }) },
                  { id: 'one-day-tours', label: tx(locale, { en: 'One-day tours', es: 'Circuitos de un día', it: 'Tour di un giorno', ar: 'رحلات اليوم الواحد' }) },
                  { id: 'multi-days-tours', label: tx(locale, { en: 'Multi-day packages', es: 'Viajes de varios días', it: 'Viaggi di più giorni', ar: 'باقات عدة أيام' }) },
                  { id: 'nile-cruises', label: tx(locale, { en: 'Nile cruises', es: 'Cruceros por el Nilo', it: 'Crociere sul Nilo', ar: 'كروز النيل' }) },
                  { id: 'shore-excursions', label: tx(locale, { en: 'Shore excursions', es: 'Excursiones en tierra', it: 'Escursioni a terra', ar: 'رحلات شاطئية' }) },
                ].map((cat) => {
                  const count = cat.id === 'all'
                    ? publishedTours.length
                    : publishedTours.filter(t => t.category === cat.id).length
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={cn('rev-cat-pill', categoryFilter === cat.id && 'active')}
                      onClick={() => setCategoryFilter(cat.id)}
                      role="radio"
                      aria-checked={categoryFilter === cat.id}
                    >
                      <span>{cat.label}</span>
                      <small>({count})</small>
                    </button>
                  )
                })}
              </div>

              <div className="rev-custom-dropdown-wrap" ref={dropdownRef}>
                <button
                  type="button"
                  id="rev-tour-select-button"
                  className={cn('rev-custom-select-trigger', dropdownOpen && 'open', !selectedTour && 'placeholder')}
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  disabled={submitting}
                  aria-haspopup="listbox"
                  aria-expanded={dropdownOpen}
                >
                  <span className="rev-select-text">
                    {selectedTourObj
                      ? (locale === 'ar' && selectedTourObj.titleAr ? selectedTourObj.titleAr : selectedTourObj.title)
                      : tx(locale, { en: '-- Select a trip --', es: '-- Selecciona un viaje --', it: '-- Seleziona un tour --', ar: '-- اختر رحلة --' })}
                  </span>
                  <ChevronDown size={16} className={cn('rev-select-arrow', dropdownOpen && 'rotated')} aria-hidden="true" />
                </button>

                {dropdownOpen && (
                  <div className="rev-custom-dropdown-menu" role="listbox" aria-labelledby="rev-tour-select-button">
                    {categoriesWithTours.map(({ category, label, tours }) => (
                      <div key={category} className="rev-dropdown-group">
                        <div className="rev-dropdown-group-header">
                          <span className={cn('rev-tour-type-tag', `cat-${category}`)}>
                            {label}
                          </span>
                        </div>
                        {tours.map((t) => {
                          const isSelected = t.slug === selectedTour
                          const tourTitle = locale === 'ar' && t.titleAr ? t.titleAr : t.title
                          return (
                            <button
                              key={t.slug}
                              type="button"
                              className={cn('rev-dropdown-item', isSelected && 'selected')}
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => {
                                setSelectedTour(t.slug)
                                setDropdownOpen(false)
                              }}
                            >
                              <span className="rev-dropdown-item-title">{tourTitle}</span>
                              {isSelected && <Check size={14} className="rev-dropdown-item-check" aria-hidden="true" />}
                            </button>
                          )
                        })}
                      </div>
                    ))}

                    {filteredTours.length === 0 && (
                      <div className="rev-dropdown-empty">
                        {tx(locale, {
                          en: 'No trips match your search.',
                          es: 'No hay viajes que coincidan con tu búsqueda.',
                          it: 'Nessun tour corrisponde alla ricerca.',
                          ar: 'لا توجد رحلات تطابق بحثك.'
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {filteredTours.length === 0 && (
                <p className="rev-tour-no-match" role="status">
                  {tx(locale, {
                    en: 'No trips match your search.',
                    es: 'No hay viajes que coincidan con tu búsqueda.',
                    it: 'Nessun tour corrisponde alla ricerca.',
                    ar: 'لا توجد رحلات تطابق بحثك.'
                  })}
                </p>
              )}

              {selectedTourObj && (
                <div className="rev-selected-tour-card">
                  <span className={cn('rev-tour-type-tag', `cat-${selectedTourObj.category}`)}>
                    {getCategoryLabel(selectedTourObj.category, locale)}
                  </span>
                  <div className="rev-selected-tour-info">
                    <strong>{locale === 'ar' && selectedTourObj.titleAr ? selectedTourObj.titleAr : selectedTourObj.title}</strong>
                    {(selectedTourObj.location || selectedTourObj.duration) && (
                      <small>
                        {[selectedTourObj.location, selectedTourObj.duration].filter(Boolean).join(' · ')}
                      </small>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="rev-form-row">
            <label className="rev-rating-label">
              <span>{copy.rating}</span>
              <span className="rev-star-pick" role="radiogroup" aria-label={copy.rating}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={submitting}
                    onClick={() => setStars(n)}
                    role="radio"
                    tabIndex={stars === n ? 0 : -1}
                    aria-label={tx(locale, { en: `${n} stars`, es: `${n} estrellas`, it: `${n} stelle`, ar: `${n} نجوم` })}
                    aria-checked={stars === n}
                    onKeyDown={event => {
                      if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
                      event.preventDefault()
                      const next = event.key === 'Home' ? 1 : event.key === 'End' ? 5 : (stars + (event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1 : -1) + 4) % 5 + 1
                      setStars(next)
                      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button')[next - 1]?.focus()
                    }}
                    className={stars === n ? 'active' : ''}
                  >
                    <Star size={18} fill={n <= stars ? '#ffc531' : 'none'} color="#ffc531" />
                  </button>
                ))}
              </span>
            </label>
            <label className="rev-title-label">
              <span>{copy.reviewTitle} <small>({tx(locale, { en: 'optional', es: 'opcional', it: 'facoltativo', ar: 'اختياري' })})</small></span>
              <input
                value={title}
                disabled={submitting}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={copy.reviewTitlePh}
                maxLength={160}
              />
            </label>
          </div>

          <label>
            {copy.review}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={copy.reviewPh}
              maxLength={5000}
              minLength={10}
              rows={3}
              required
              aria-describedby={textHintId}
              disabled={submitting}
            />
            <small id={textHintId} className="rev-text-hint">{tx(locale, { en: 'Minimum 10 characters. Reviews appear after approval.', es: 'Mínimo 10 caracteres. Las reseñas aparecen tras su aprobación.', it: 'Minimo 10 caratteri. Le recensioni appaiono dopo l’approvazione.', ar: 'الحد الأدنى 10 أحرف. تظهر التقييمات بعد موافقة الإدارة.' })} ({text.trim().length.toLocaleString(locale)} / 5000)</small>
          </label>

          {error && <p className="rev-error" role="alert">{error}</p>}
          {needsSignIn && <a href={`/login?next=${encodeURIComponent(effectiveTourSlug && effectiveTourSlug !== WEBSITE_REVIEW_SCOPE ? `/all-tours/${encodeURIComponent(effectiveTourSlug)}#reviews` : '/#reviews')}`}>{tx(locale, { en: 'Sign in to your account', es: 'Inicia sesión en tu cuenta', it: 'Accedi al tuo account', ar: 'سجّل الدخول إلى حسابك' })}</a>}
          <div className="rev-form-actions">
            <button type="button" className="outline-btn" onClick={onClose} disabled={submitting}>
              {copy.cancel}
            </button>
            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? tx(locale, { en: 'Submitting…', es: 'Enviando…', it: 'Invio…', ar: 'جارٍ الإرسال…' }) : copy.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(<PublicAppearancePortal>{modal}</PublicAppearancePortal>, document.body)
}

export function TourReviewsSection({
  tourSlug,
  tourTitle,
  detailReviews,
  locale,
  copy,
}: {
  tourSlug: string
  tourTitle: string
  detailReviews?: readonly StoredReview[]
  locale: import('@/lib/locale-config').Locale
  copy: ReviewModalCopy & { title: string; summaryReviews: string; beFirst: string; justNow: string; more: string; less: string }
}) {
  const [reviews, setReviews] = useState<CustomerReview[]>([])
  const [summary, setSummary] = useState<ReviewSummary>({ average: null, count: 0 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1), [totalPages, setTotalPages] = useState(0)
  const [loadError, setLoadError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Load reviews on mount & page change
  useEffect(() => {
    let cancelled = false
    setLoading(true); setLoadError(false); setReviews([]); setSummary({ average: null, count: 0 }); setSubmitted(false)
    fetchTourReviews(tourSlug, page).then((data) => {
      if (!cancelled) {
        setTotalPages(data.totalPages)
        setReviews(data.reviews)
        setSummary(data.summary)
        setLoading(false)
      }
    }).catch(() => { if (!cancelled) { setLoadError(true); setLoading(false) } })
    return () => { cancelled = true }
  }, [tourSlug, page, retry])

  // Revalidate on tab return / focus
  useEffect(() => {
    const handleRevalidate = () => {
      if (document.visibilityState === 'visible') {
        fetchTourReviews(tourSlug, page).then((data) => {
          setTotalPages(data.totalPages)
          setReviews(data.reviews)
          setSummary(data.summary)
        }).catch(() => {})
      }
    }
    window.addEventListener('focus', handleRevalidate)
    document.addEventListener('visibilitychange', handleRevalidate)
    return () => {
      window.removeEventListener('focus', handleRevalidate)
      document.removeEventListener('visibilitychange', handleRevalidate)
    }
  }, [tourSlug, page])

  const handleReviewSubmit = () => {
    // New reviews are PENDING: never alter published counts or ratings.
    setShowForm(false)
    setSubmitted(true)
  }
  if (loadError) return <div role="alert"><p>{tx(locale, { en: 'Unable to load reviews.', es: 'No se pudieron cargar las reseñas.', it: 'Impossibile caricare le recensioni.', ar: 'تعذر تحميل التقييمات.' })}</p><button type="button" className="outline-btn" onClick={() => setRetry(value => value + 1)}>{tx(locale, { en: 'Retry', es: 'Reintentar', it: 'Riprova', ar: 'إعادة المحاولة' })}</button></div>

  if (loading) {
    return <p className="rev-loading">{tx(locale, { en: 'Loading reviews…', es: 'Cargando reseñas…', it: 'Caricamento recensioni…', ar: 'جارٍ تحميل التقييمات…' })}</p>
  }

  return (
    <>
      <div className="rev-summary">
        {summary.average !== null ? (
          <>
            <StarsRow stars={Math.round(summary.average)} size={18} />
            <b>{summary.average.toFixed(1)}</b>
            <span className="rev-sep">|</span>
            <span className="rev-count">
              {summary.count} {copy.summaryReviews}
            </span>
          </>
        ) : (
          <span className="rev-count">{tx(locale, { en: 'No reviews yet', es: 'Sin reseñas aún', it: 'Nessuna recensione', ar: 'لا توجد تقييمات بعد' })}</span>
        )}
        <button type="button" className="rev-write" onClick={() => setShowForm(true)}>
          {copy.heading}
        </button>
      </div>

      <div className="tour-reviews-grid">
        {reviews.length === 0 ? (
          <p className="rev-empty">{copy.beFirst}</p>
        ) : (
          reviews.map((r, i) => {
            const key = `${r.publicId}-${i}`
            const open = expanded === key
            const displayName = r.reviewerName || 'Traveler'
            return (
              <article key={key} className="rev-card">
                <div className="rev-head">
                  <span className="rev-avatar" style={{ background: avatarColor(displayName) }}>
                    {displayName.charAt(0)}
                  </span>
                  <div>
                    <b>{displayName}</b>
                    <small>
                      {new Date(r.publishedAt).toLocaleDateString(locale, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </small>
                  </div>
                </div>
                <div className="rev-card-stars">
                  <StarsRow stars={r.rating} size={15} />
                </div>
                {r.title && <h4 className="rev-card-title">{r.title}</h4>}
                <p className={open ? '' : r.text.length > 140 ? 'clamped' : ''}>{r.text}</p>
                {r.text.length > 140 && (
                  <button type="button" className="rev-more" onClick={() => setExpanded(open ? null : key)}>
                    {open ? copy.less : copy.more}
                  </button>
                )}
              </article>
            )
          })
        )}
      </div>

      {totalPages > 1 && <nav className="website-review-pagination" aria-label={copy.title}><button className="outline-btn" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>{tx(locale, { en: 'Previous', es: 'Anterior', it: 'Precedente', ar: 'السابق' })}</button><span>{page} / {totalPages}</span><button className="outline-btn" disabled={page >= totalPages} onClick={() => setPage(value => value + 1)}>{tx(locale, { en: 'Next', es: 'Siguiente', it: 'Successivo', ar: 'التالي' })}</button></nav>}
      {showForm && (
        <ReviewWriteModal
          copy={{ ...copy, context: copy.forTour ? `${copy.forTour}: ${tourTitle}` : tourTitle }}
          tourSlug={tourSlug}
          tourTitle={tourTitle}
          onSubmit={handleReviewSubmit}
          onClose={() => setShowForm(false)}
        />
      )}

      {submitted && (
        <div className="rev-success" role="status">
          <CheckCircle2 size={24} /> {tx(locale, { en: 'Review submitted for moderation.', es: 'Reseña enviada para moderación.', it: 'Recensione inviata per moderazione.', ar: 'تم إرسال التقييم للمراجعة.' })}
        </div>
      )}
    </>
  )
}

// ============================================================================
// LEGACY EXPORTS (for homepage.tsx - uses localStorage, not the new API)
// ============================================================================

/** Legacy stored review in localStorage (homepage use only). */
export type StoredReview = {
  name: string
  date: string
  stars: number
  text: string
}

const SITE_KEY = 'sp-site-reviews'
const tourKey = (slug: string) => `sp-tour-reviews:${slug}`

function readList(key: string): StoredReview[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredReview[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((r) => r && typeof r.name === 'string' && typeof r.text === 'string' && Number.isFinite(r.stars))
      .slice(0, 50)
      .map((r) => ({ name: r.name.slice(0, 60), date: typeof r.date === 'string' ? r.date : 'Just now', stars: Math.min(5, Math.max(1, Math.round(r.stars))), text: r.text.slice(0, 1000) }))
  } catch { return [] }
}

function writeList(key: string, list: StoredReview[]) {
  try { localStorage.setItem(key, JSON.stringify(list.slice(0, 50))) } catch { /* private mode */ }
}

export const loadUserReviews = (): StoredReview[] => (typeof window === 'undefined' ? [] : readList(SITE_KEY))
export const saveUserReview = (review: StoredReview) => writeList(SITE_KEY, [review, ...readList(SITE_KEY)])
export const loadTourReviews = (slug: string): StoredReview[] => (typeof window === 'undefined' ? [] : readList(tourKey(slug)))
export const saveTourReview = (slug: string, review: StoredReview) => writeList(tourKey(slug), [review, ...readList(tourKey(slug))])

/** Platform badges are no longer shown on the homepage; trust signals
  are handled server-side only. These arrays are preserved for potential
  future integration with verified review providers. */
export const reviewPlatforms = [] as const

export const platformSummary: Record<string, { avg: string; count: string }> = {}

export function PlatformIcon({ id }: { id: string }) {
  if (id === 'trips') return <span className="platform-ic" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" fill="none" stroke="#F7951D" strokeWidth="2"/><rect x="3" y="6" width="18" height="15" rx="3" fill="#163A96"/><path d="M7 21v1m10-1v1" stroke="#163A96" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="13.5" r="4.5" fill="#F7951D"/><ellipse cx="12" cy="13.5" rx="2" ry="4.5" fill="none" stroke="#fff" strokeWidth="1"/><path d="M7.5 13.5h9" stroke="#fff" strokeWidth="1"/><path d="m17 7 5 2-2 4-4-2z" fill="#00AA6C"/><circle cx="18.3" cy="9.3" r=".7" fill="#fff"/></svg></span>
  if (id === 'website') return <span className="platform-ic" aria-hidden="true"><BrandMark width={24} height={24} style={{ width: 24, height: 24, objectFit: 'contain' }} /></span>
  const icons: Record<string, string> = { tripadvisor: '/review-platforms/tripadvisor.ico', trustindex: '/review-platforms/trustindex.png', getyourguide: '/review-platforms/getyourguide.ico' }
  if (icons[id]) return <span className="platform-ic" aria-hidden="true"><img src={icons[id]} alt="" width={24} height={24} style={{ width: 24, height: 24, objectFit: 'contain' }}/></span>
  if (id === 'google') return <span className="platform-ic" aria-label="Google"><svg viewBox="0 0 24 24"><path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.3h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.6 2.8c2.2-2 3.8-5 3.8-8.6z" /><path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-3.7 2.9C3.5 21.3 7.5 24 12 24z" /><path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-3.7-2.9C.5 8.6 0 10.2 0 12s.5 3.4 1.4 4.9l3.8-2.5z" /><path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.5 0 3.5 2.7 1.4 6.9l3.8 2.9c1-2.9 3.7-5.1 6.8-5.1z" /></svg></span>
  return null
}

export type SiteReview = {
  name: string
  date: string
  stars: number
  text: string
  platform?: string
  color: string
}

export const toSiteReview = (r: StoredReview): SiteReview => ({ ...r, color: avatarColor(r.name) })
