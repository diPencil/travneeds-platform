import type { Destination } from '@/data/types'
import { localizeCatalogue } from './catalogue-translations'
import type { Locale } from './locale-config'

/** Private picker only: public catalogues continue using their published endpoint. */
export function tripDestinationOptions(rows: readonly Destination[], locale: Locale, selectedSlug = '') {
  return rows.filter(row => row.showInOneDayTours === true || row.slug === selectedSlug).map(row => {
    const item = localizeCatalogue(row, 'destination', locale)
    const draft = locale === 'es' ? 'Borrador' : locale === 'it' ? 'Bozza' : locale === 'ar' ? 'مسودة' : 'Draft'
    return { value: row.slug, label: item.title + (row.isPublished === false ? ` (${draft})` : '') }
  })
}
