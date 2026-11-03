'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, CalendarDays, Check, CircleAlert, Loader2, ShieldCheck, Trash2, Users } from 'lucide-react'
import { Breadcrumb, SiteShell } from '@/components/site'
import { formatPrice, tx, useLocale } from '@/components/locale'
import { removeFromCart, useCart } from '@/lib/cart'
import {
  estimateCart, hasContactErrors, validateBookingContact, validateLineHeadcount,
  type Booking, type BookingContact, type ContactErrors,
} from '@/lib/booking'
import { InternationalPhoneInput } from '@/components/shared/international-phone-input'
import { PaymentInstructions } from './booking-payment'
import { customerErrorText } from '@/lib/customer-error-copy'
import { catalogTours } from '@/data/tours'
import { useDbToursStatus } from '@/lib/tours-client'
import { useCurrentUser } from '@/lib/use-current-user'

const IDEMPOTENCY_KEY_STORAGE = 'sp-checkout-key'

function getOrCreateCheckoutKey(): string {
  try {
    const stored = window.sessionStorage.getItem(IDEMPOTENCY_KEY_STORAGE)
    if (stored && /^[A-Za-z0-9-]{8,64}$/.test(stored)) return stored
    const fresh = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `key-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
    window.sessionStorage.setItem(IDEMPOTENCY_KEY_STORAGE, fresh)
    return fresh
  } catch {
    return `key-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
  }
}

function rotateCheckoutKey() {
  try { window.sessionStorage.removeItem(IDEMPOTENCY_KEY_STORAGE) } catch { /* noop */ }
}

export function CheckoutPage() {
  const { currency, locale } = useLocale()
  const { items } = useCart()
  const dbStatus = useDbToursStatus(catalogTours, { includeNew: true })
  const tourCatalog = dbStatus.data ?? catalogTours
  const estimate = useMemo(() => estimateCart(items, tourCatalog), [items, tourCatalog])
  const { user } = useCurrentUser()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<ContactErrors>({})
  const [attempted, setAttempted] = useState(false)
  const [sending, setSending] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [placed, setPlaced] = useState<{ reference: string; total: number; linked: boolean; guestAccessUrl: string | null } | null>(null)

  // Auto-fill logged-in customer info once available, without overriding manual edits
  useEffect(() => {
    if (!user) return
    setName((prev) => prev.trim() ? prev : [user.firstName, user.lastName].filter(Boolean).join(' ') || '')
    setEmail((prev) => prev.trim() ? prev : user.email || '')
    setPhone((prev) => prev.trim() ? prev : user.phone || '')
  }, [user])

  const sendFailed = tx(locale, {
    en: 'Could not send the request. Please try again.',
    es: 'No se pudo enviar la solicitud. Inténtalo de nuevo.',
    it: 'Impossibile inviare la richiesta. Riprova.',
    ar: 'تعذر إرسال الطلب. حاول مجددًا.',
  })

  const copy = {
    nameRequired: tx(locale, { en: 'Enter your full name.', es: 'Escribe tu nombre completo.', it: 'Inserisci il tuo nome completo.', ar: 'اكتب الاسم الكامل.' }),
    emailRequired: tx(locale, { en: 'Enter your email address.', es: 'Escribe tu correo electrónico.', it: 'Inserisci il tuo indirizzo email.', ar: 'اكتب البريد الإلكتروني.' }),
    emailInvalid: tx(locale, { en: 'Enter a valid email address.', es: 'Escribe un correo electrónico válido.', it: 'Inserisci un indirizzo email valido.', ar: 'اكتب بريدًا إلكترونيًا صحيحًا.' }),
    phoneRequired: tx(locale, { en: 'Enter your phone number.', es: 'Escribe tu número de teléfono.', it: 'Inserisci il tuo numero di telefono.', ar: 'اكتب رقم الهاتف.' }),
    phoneInvalid: tx(locale, { en: 'Enter a valid phone number (at least 7 digits).', es: 'Escribe un teléfono válido (al menos 7 dígitos).', it: 'Inserisci un numero di telefono valido (almeno 7 cifre).', ar: 'اكتب رقم هاتف صحيحًا (7 أرقام على الأقل).' }),
    staleBlocked: tx(locale, { en: 'Remove the unavailable trips from the cart before sending the request.', es: 'Quita los viajes no disponibles del carrito antes de enviar la solicitud.', it: 'Rimuovi i viaggi non disponibili dal carrello prima di inviare la richiesta.', ar: 'أزل الرحلات غير المتاحة من السلة قبل إرسال الطلب.' }),
    fixErrors: tx(locale, { en: 'Review the required fields before sending the request.', es: 'Revisa los campos obligatorios antes de enviar la solicitud.', it: 'Controlla i campi obbligatori prima di inviare la richiesta.', ar: 'راجع الحقول المطلوبة قبل إرسال الطلب.' }),
    headcountError: tx(locale, { en: 'Check travelers count: at least 1 adult required, max 50 per type, max 60 total.', es: 'Comprueba el número de viajeros: mínimo 1 adulto, máximo 50 por tipo y 60 en total.', it: 'Controlla il numero di viaggiatori: richiesto almeno 1 adulto, max 50 per categoria, max 60 in totale.', ar: 'تأكد من عدد المسافرين: يشترط بالغ واحد على الأقل، بحد أقصى 50 لكل فئة و60 إجماليًا.' }),
  }

  const errorText = (field: keyof ContactErrors): string | null => {
    const code = errors[field]
    if (!code) return null
    if (field === 'name') return copy.nameRequired
    if (field === 'email') return code === 'required' ? copy.emailRequired : copy.emailInvalid
    return code === 'required' ? copy.phoneRequired : copy.phoneInvalid
  }

  const staleBlocked = estimate.staleLines.length > 0
  const invalidHeadcount = estimate.validLines.some((line) => validateLineHeadcount(line.item) !== null)
  const showSummary = attempted && (hasContactErrors(errors) || staleBlocked || invalidHeadcount)

  const placeOrder = (e: FormEvent) => {
    e.preventDefault()
    if (sending || placed) return
    const contact: BookingContact = { name: name.trim(), email: email.trim(), phone: phone.trim() }
    const fieldErrors = validateBookingContact(contact)
    setErrors(fieldErrors)
    setAttempted(true)
    setSubmitError('')

    if (!estimate.validLines.length || staleBlocked || invalidHeadcount || hasContactErrors(fieldErrors)) {
      if (invalidHeadcount) setSubmitError(copy.headcountError)
      return
    }

    setSending(true)
    const idempotencyKey = getOrCreateCheckoutKey()
    const draft = {
      lines: estimate.validLines.map((line) => ({
        tourSlug: line.item.tourSlug,
        date: line.item.date,
        adults: line.item.adults,
        children: line.item.children,
        infants: line.item.infants,
        addons: [...line.item.addons],
      })),
      contact,
      notes: notes.trim(),
      currency: 'USD' as const,
      idempotencyKey,
    }

    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(draft),
    })
      .then(async (res) => {
        const data = (await res.json()) as Booking & { error?: string; guestAccessUrl?: string | null }
        if (!res.ok) throw new Error(customerErrorText(locale, data.error, sendFailed))

        const guestAccessUrl = typeof data.guestAccessUrl === 'string' ? data.guestAccessUrl : null
        let linked = true
        if (!guestAccessUrl) {
          try {
            const detail = await fetch(`/api/account/bookings/${encodeURIComponent(data.reference)}`, { credentials: 'same-origin' })
            linked = detail.ok
          } catch { linked = false }
        } else {
          linked = false
        }

        setPlaced({ reference: data.reference, total: data.total, linked, guestAccessUrl })
        // Clear only the submitted items from the cart, preserving any newly added trips
        for (const line of estimate.validLines) {
          removeFromCart(line.item.key)
        }
        rotateCheckoutKey()
      })
      .catch((error: unknown) => {
        setSubmitError(error instanceof Error ? error.message : sendFailed)
      })
      .finally(() => setSending(false))
  }

  return <SiteShell>
    <Breadcrumb items={[tx(locale, { en: 'Checkout', es: 'Compra', it: 'Checkout', ar: 'إتمام الحجز' })]} />
    <main className="container cart-page">
      <header className="car-request-head">
        <span className="eyebrow">{tx(locale, { en: 'Almost done', es: 'Ya casi terminas', it: 'Quasi fatto', ar: 'لم يتبق إلا خطوة واحدة' })}</span>
        <h1>{tx(locale, { en: 'Checkout', es: 'Finalizar compra', it: 'Checkout', ar: 'إتمام الحجز' })}</h1>
      </header>
      {placed ? <div className="form-success large">
        <Check size={42} />
        <h1>{tx(locale, { en: 'Booking request received', es: 'Solicitud de reserva recibida', it: 'Richiesta di prenotazione ricevuta', ar: 'تم استلام طلب الحجز' })}</h1>
        <span className="req-ref">{tx(locale, { en: 'Official reference: ', es: 'Referencia oficial: ', it: 'Riferimento ufficiale: ', ar: 'المرجع الرسمي: ' })}{placed.reference}</span>
        <div className="req-summary-rows">
          <div><span>{tx(locale, { en: 'Booking total', es: 'Total de la reserva', it: 'Totale prenotazione', ar: 'إجمالي الحجز' })}</span><strong>{formatPrice(placed.total, currency, locale)}</strong></div>
        </div>
        <PaymentInstructions layout="note" />
        <p>{placed.guestAccessUrl
          ? tx(locale, { en: 'We rechecked your tour prices and confirmed the total. This private link is the only way to open this booking  -  we have emailed it to you too, and each new email replaces it.', es: 'Hemos revisado los precios de tus tours y confirmado el total. Este enlace privado es la única forma de abrir esta reserva: también te lo hemos enviado por correo y cada correo nuevo lo sustituye.', it: 'Abbiamo ricontrollato i prezzi dei tuoi tour e confermato il totale. Questo link privato è l’unico modo per aprire la prenotazione: te l’abbiamo inviato per email e ogni nuova email lo sostituisce.', ar: 'راجعنا أسعار رحلاتك وأكدنا الإجمالي. هذا الرابط الخاص هو الطريقة الوحيدة لفتح الحجز  -  وقد أرسلناه إليك بالبريد أيضًا، وكل رسالة جديدة تستبدله.' })
          : placed.linked
          ? tx(locale, { en: 'We rechecked your tour prices and confirmed the total. Track your booking from your account.', es: 'Hemos revisado los precios de tus tours y confirmado el total. Sigue tu reserva desde tu cuenta.', it: 'Abbiamo ricontrollato i prezzi dei tuoi tour e confermato il totale. Segui la tua prenotazione dal tuo account.', ar: 'راجعنا أسعار رحلاتك وأكدنا الإجمالي. تابع حجزك من حسابك.' })
          : tx(locale, { en: 'We rechecked your tour prices and confirmed the total. Quote the reference when you contact our team.', es: 'Hemos revisado los precios de tus tours y confirmado el total. Menciona la referencia cuando contactes con nuestro equipo.', it: 'Abbiamo ricontrollato i prezzi dei tuoi tour e confermato il totale. Cita il riferimento quando contatti il nostro team.', ar: 'راجعنا أسعار رحلاتك وأكدنا الإجمالي. اذكر المرجع عند التواصل مع فريقنا.' })}</p>
        <div className="car-success-actions">{placed.guestAccessUrl
          ? <Link className="primary-btn" href={placed.guestAccessUrl}>{tx(locale, { en: 'View your booking', es: 'Ver tu reserva', it: 'Visualizza la prenotazione', ar: 'عرض حجزك' })}</Link>
          : placed.linked && <Link className="primary-btn" href={`/account/bookings/detail?ref=${encodeURIComponent(placed.reference)}`}>{tx(locale, { en: 'View booking', es: 'Ver reserva', it: 'Visualizza prenotazione', ar: 'عرض الحجز' })}</Link>}<Link className="outline-btn" href="/trips">{tx(locale, { en: 'Browse more trips', es: 'Explorar más viajes', it: 'Sfoglia altri viaggi', ar: 'تصفح المزيد من الرحلات' })}</Link></div>
      </div> : !items.length ? <div className="cart-empty">
        <h2>{tx(locale, { en: 'Nothing to check out', es: 'Nada que comprar', it: 'Niente da acquistare', ar: 'لا توجد عناصر لإتمامها' })}</h2>
        <p>{tx(locale, { en: 'Add a trip to the cart first.', es: 'Añade primero un viaje al carrito.', it: 'Aggiungi prima un viaggio al carrello.', ar: 'أضف رحلة إلى السلة أولًا.' })}</p>
        <Link href="/trips" className="primary-btn">{tx(locale, { en: 'Browse trips', es: 'Explorar viajes', it: 'Sfoglia i viaggi', ar: 'تصفح الرحلات' })} <ArrowRight size={17} /></Link>
      </div> : !estimate.validLines.length ? <div className="cart-empty">
        <CircleAlert size={40} />
        <h2>{tx(locale, { en: 'No available trips to check out', es: 'No hay viajes disponibles para comprar', it: 'Nessun viaggio disponibile da acquistare', ar: 'لا توجد رحلات متاحة لإتمامها' })}</h2>
        <p>{tx(locale, { en: 'The trips saved in your cart are no longer available. Clear the cart and pick current trips.', es: 'Los viajes guardados en tu carrito ya no están disponibles. Vacía el carrito y elige viajes actuales.', it: 'I viaggi salvati nel carrello non sono più disponibili. Svuota il carrello e scegli viaggi attuali.', ar: 'الرحلات المحفوظة في السلة لم تعد متاحة. أفرغ السلة واختر رحلات حالية.' })}</p>
        <div className="car-success-actions"><Link href="/cart" className="primary-btn">{tx(locale, { en: 'Back to cart', es: 'Volver al carrito', it: 'Torna al carrello', ar: 'العودة للسلة' })}</Link><Link href="/trips" className="outline-btn">{tx(locale, { en: 'Browse trips', es: 'Explorar viajes', it: 'Sfoglia i viaggi', ar: 'تصفح الرحلات' })}</Link></div>
      </div> : <form className="co-layout" onSubmit={placeOrder} noValidate>
        <div className="co-form-card">
          <h2>{tx(locale, { en: 'Contact details', es: 'Datos de contacto', it: 'Dati di contatto', ar: 'بيانات التواصل' })}</h2>
          {showSummary && <p className="co-error" role="alert"><CircleAlert size={15} />{staleBlocked ? copy.staleBlocked : invalidHeadcount ? copy.headcountError : copy.fixErrors}</p>}
          <div className="form-grid">
            <label className="full">{tx(locale, { en: 'Full name', es: 'Nombre completo', it: 'Nome completo', ar: 'الاسم الكامل' })}<input required value={name} onChange={(e) => { setName(e.target.value); setAttempted(false) }} placeholder={tx(locale, { en: 'Your name', es: 'Tu nombre', it: 'Il tuo nome', ar: 'اكتب اسمك الكامل' })} maxLength={80} autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'co-name-error' : undefined} />{errorText('name') && <span className="field-error" id="co-name-error">{errorText('name')}</span>}</label>
            <label>{tx(locale, { en: 'Email', es: 'Correo electrónico', it: 'Email', ar: 'البريد الإلكتروني' })}<input required type="email" value={email} onChange={(e) => { setEmail(e.target.value); setAttempted(false) }} placeholder="you@example.com" maxLength={120} autoComplete="email" dir="ltr" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'co-email-error' : undefined} />{errorText('email') && <span className="field-error" id="co-email-error">{errorText('email')}</span>}</label>
            <label>{tx(locale, { en: 'Phone', es: 'Teléfono', it: 'Telefono', ar: 'رقم الهاتف' })}<InternationalPhoneInput required value={phone} onChange={(value) => { setPhone(value); setAttempted(false) }} locale={locale} invalid={Boolean(errors.phone)} describedBy={errors.phone ? 'co-phone-error' : undefined} />{errorText('phone') && <span className="field-error" id="co-phone-error">{errorText('phone')}</span>}</label>
            <label className="full">{tx(locale, { en: 'Notes (optional)', es: 'Notas (opcional)', it: 'Note (facoltativo)', ar: 'ملاحظات (اختياري)' })}<textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={tx(locale, { en: 'Anything else we should know', es: 'Cualquier otra cosa que debamos saber', it: 'Altro che dovremmo sapere', ar: 'أية تفاصيل إضافية' })} maxLength={500} /></label>
          </div>
          <h2>{tx(locale, { en: 'Payment arrangements', es: 'Detalles del pago', it: 'Dettagli di pagamento', ar: 'ترتيبات الدفع' })}</h2>
          <p className="co-payment-note"><ShieldCheck size={16} /><span>{tx(locale, { en: 'No charge is made online. Payment details are arranged with our team after your booking request is reviewed.', es: 'No se cobra nada en línea. Los detalles del pago se acuerdan con nuestro equipo después de revisar tu solicitud de reserva.', it: 'Nessun addebito online. I dettagli di pagamento sono concordati con il nostro team dopo la revisione della richiesta.', ar: 'لا يتم خصم أي مبلغ عبر الإنترنت. تُرتب تفاصيل الدفع مع فريقنا بعد مراجعة طلب الحجز.' })}</span></p>
          {submitError && <p className="co-error" role="alert"><CircleAlert size={15} />{submitError}</p>}
        </div>
        <aside className="cart-summary">
          <h2>{tx(locale, { en: 'Order summary', es: 'Resumen del pedido', it: 'Riepilogo ordine', ar: 'ملخص الطلب' })}</h2>
          {estimate.validLines.map(({ item, canonicalTotal, pricedAddons, onRequestAddons }) => <div key={item.key} className="co-line">
            <div className="cart-summary-row"><span>{item.title}</span><strong>{formatPrice(canonicalTotal, currency, locale)}</strong></div>
            <small className="co-line-sub"><CalendarDays size={13} />{item.date || tx(locale, { en: 'Open date', es: 'Fecha abierta', it: 'Data aperta', ar: 'التاريخ مفتوح' })} {item.date ? tx(locale, { en: '(preferred)', es: '(preferida)', it: '(preferita)', ar: '(مفضل)' }) : ''} · <Users size={13} />{item.adults + item.children + item.infants} {tx(locale, { en: 'guest(s)', es: 'viajeros', it: 'viaggiatori', ar: 'ضيوف' })}</small>
            {(pricedAddons.length > 0 || onRequestAddons.length > 0) && <small className="co-line-sub co-line-addons">{[...pricedAddons, ...onRequestAddons.map((a) => `${a} (${tx(locale, { en: 'on request', es: 'bajo petición', it: 'su richiesta', ar: 'حسب الطلب' })})`)].join(' · ')}</small>}
          </div>)}
          {estimate.staleLines.map(({ item }) => <div key={item.key} className="co-line is-stale">
            <div className="cart-summary-row"><span>{item.title}</span><button type="button" className="cart-remove" onClick={() => removeFromCart(item.key)} aria-label={tx(locale, { en: 'Remove from cart', es: 'Quitar del carrito', it: 'Rimuovi dal carrello', ar: 'إزالة من السلة' })}><Trash2 size={16} /></button></div>
            <small className="co-line-sub">{tx(locale, { en: 'No longer available - remove it to continue.', es: 'Ya no disponible - quítalo para continuar.', it: 'Non più disponibile - rimuovilo per continuare.', ar: 'لم تعد متاحة - أزلها للمتابعة.' })}</small>
          </div>)}
          {estimate.discount > 0 && <div className="cart-summary-row discount"><span>{tx(locale, { en: 'Deal savings', es: 'Ahorro por oferta', it: 'Risparmio offerta', ar: 'توفير العروض' })}</span><strong>−{formatPrice(estimate.discount, currency, locale)}</strong></div>}
          <div className="cart-summary-row total"><span>{tx(locale, { en: 'Estimated total', es: 'Total estimado', it: 'Totale stimato', ar: 'الإجمالي التقديري' })}</span><strong>{formatPrice(estimate.subtotal, currency, locale)}</strong></div>
          <p>{tx(locale, { en: 'Frontend estimate only. The final price is recalculated from our catalogue before the booking is confirmed.', es: 'Solo estimación inicial. El precio final se recalcula desde nuestro catálogo antes de confirmar la reserva.', it: 'Solo stima iniziale. Il prezzo finale è ricalcolato dal nostro catalogo prima della conferma.', ar: 'تقدير مبدئي فقط. يُعاد حساب السعر النهائي من قائمتنا قبل تأكيد الحجز.' })}</p>
          <button type="submit" className="primary-btn" disabled={staleBlocked || sending || dbStatus.loading}>{sending ? <>
            <Loader2 size={16} className="animate-spin" /> {tx(locale, { en: 'Submitting request...', es: 'Enviando solicitud...', it: 'Invio della richiesta...', ar: 'جارٍ إرسال الطلب...' })}
          </> : tx(locale, { en: 'Request booking', es: 'Solicitar reserva', it: 'Richiedi prenotazione', ar: 'إرسال طلب الحجز' })} <ArrowRight size={17} /></button>
        </aside>
      </form>}
    </main>
  </SiteShell>
}
