import 'server-only'
import { Prisma } from '@prisma/client'
import { db } from './db'
import { HeroConflictError } from './website-heroes'
import { isOfferActive, offerHref } from '../special-offers'
import { isTourPublished } from '../tour-publish'
import { recordSeoObject, recordSeoStateFromPayload, transitionRecordSeo, type RecordSeoAction, type RecordSeoDescriptor, type RecordSeoKind } from '../record-seo'

export class RecordSeoNotFoundError extends Error { readonly status = 404; readonly statusCode = 404 }
export class RecordSeoNotEligibleError extends RecordSeoNotFoundError {}
type Row = { id?: string; slug: string; title?: string; name?: string; summary?: string; excerpt?: string; copy?: string; image?: string; coverImage?: string; status?: string; isPublished?: boolean; active?: boolean; showInDestinations?: boolean; showInOneDayTours?: boolean; tourSlug?: string | null; startsAt?: Date | null; deadline?: string | null; detail?: string | null; content?: string; translations?: string | null; seoTitle?: string | null; seoDescription?: string | null; updatedAt: Date }
type Delegate = {
  findUnique(args: { where: { slug: string } }): Promise<Row | null>
  findMany(): Promise<Row[]>
  updateMany(args: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<{ count: number }>
}
function delegate(kind: RecordSeoKind, client: Prisma.TransactionClient = db): Delegate {
  if (kind === 'hotel') return client.hotel as unknown as Delegate
  return client[kind === 'category' ? 'multiDayCategory' : kind] as unknown as Delegate
}
function field(kind: RecordSeoKind) {
  if (kind === 'hotel') return 'translations'
  return kind === 'tour' || kind === 'destination' ? 'detail' : 'content'
}
function descriptor(kind: RecordSeoKind, row: Row): RecordSeoDescriptor {
  const paths: Record<RecordSeoKind, string> = { tour: '/all-tours/', blog: '/blogs/', destination: '/destinations/', event: '/events/', offer: '/special-offers/', category: '/all-tours/multi-days-tours/', hotel: '/hotels/' }
  const publicUrl = kind === 'offer' ? offerHref(row) : paths[kind] + row.slug
  const published = kind === 'tour' ? isTourPublished(row) : kind === 'category' ? row.active === true : kind === 'offer' ? isOfferActive(row) : kind === 'hotel' ? row.status === 'PUBLISHED' : row.isPublished === true
  const module = { tour: 'trips', blog: 'blogs', destination: 'destinations', event: 'events', offer: 'offers', category: 'multi-day-categories', hotel: 'hotels' }[kind]
  const sourceEditor = kind === 'hotel' ? `/admin/hotels/${row.id || row.slug}` : `/admin/${module}/${kind === 'tour' ? 'builder' : 'new'}?slug=${encodeURIComponent(row.slug)}`
  const canonicalPaths = [publicUrl, ...(kind === 'destination' && row.showInOneDayTours ? [`/all-tours/one-day-tours/${row.slug}`] : [])]
  return { kind, slug: row.slug, name: row.title ?? row.name ?? row.slug, publicUrl, published, canonicalPaths, sourceEditor, description: row.seoDescription ?? row.summary ?? row.excerpt ?? row.copy ?? '', image: row.coverImage ?? row.image ?? '', updatedAt: row.updatedAt.toISOString() }
}
async function load(kind: RecordSeoKind, slug: string, client: Prisma.TransactionClient = db) {
  const row = await delegate(kind, client).findUnique({ where: { slug } })
  if (!row) throw new RecordSeoNotFoundError('Record not found.')
  if (kind === 'offer' && row.tourSlug) throw new RecordSeoNotEligibleError('Linked offers use their tour SEO.')
  const translation = kind === 'category' ? await client.catalogueTranslation.findUnique({ where: { entityType_slug: { entityType: 'category', slug } } }) : null
  const raw = kind === 'category' ? translation?.payload ?? '{}' : row[field(kind)]
  let state = recordSeoStateFromPayload(raw, kind === 'tour')
  if (kind === 'hotel' && !state.published && !state.draft && (row.seoTitle || row.seoDescription)) {
    state = {
      ...state,
      published: {
        text: {
          en: { title: row.seoTitle || '', description: row.seoDescription || '' },
          ar: { title: '', description: '' },
          es: { title: '', description: '' },
          it: { title: '', description: '' },
        },
        image: row.coverImage || '',
      },
    }
  }
  const record = descriptor(kind, row)
  return { row, raw, translation, record, state }
}
export async function readRecordSeo(kind: RecordSeoKind, slug: string) {
  const { record, state } = await load(kind, slug)
  return { record, state }
}
export async function changeRecordSeo(kind: RecordSeoKind, slug: string, action: RecordSeoAction, revision: number, content?: unknown) {
  const change = async (client: Prisma.TransactionClient) => {
    // Serialize category SEO with translation edits and slug renames, including
    // first insertion when there is no translation row to lock yet.
    if (kind === 'category') await client.$queryRaw`SELECT slug FROM multi_day_categories WHERE slug = ${slug} FOR UPDATE`
    const current = await load(kind, slug, client)
    if (current.state.revision !== revision) throw new HeroConflictError('This record changed. Reload before saving SEO.')
    const state = transitionRecordSeo(current.state, action, content)
    const value = JSON.stringify({ ...recordSeoObject(current.raw, kind === 'tour'), seoManager: state })
    let count: number
    if (kind === 'hotel') {
      const publishedText = state.published?.text.en ?? state.draft?.text.en
      count = (await client.hotel.updateMany({
        where: { slug, updatedAt: current.row.updatedAt },
        data: {
          translations: value,
          ...(publishedText?.title ? { seoTitle: publishedText.title } : {}),
          ...(publishedText?.description ? { seoDescription: publishedText.description } : {}),
        },
      })).count
    } else if (kind === 'category') {
      if (current.translation) {
        count = (await client.catalogueTranslation.updateMany({ where: { entityType: 'category', slug, payload: current.translation.payload }, data: { payload: value } })).count
      } else {
        try { await client.catalogueTranslation.create({ data: { entityType: 'category', slug, payload: value } }); count = 1 }
        catch (error) { if ((error as { code?: string }).code === 'P2002') throw new HeroConflictError('This record changed. Reload before saving SEO.'); throw error }
      }
    } else {
      count = (await delegate(kind, client).updateMany({ where: { slug, [field(kind)]: current.raw, updatedAt: current.row.updatedAt }, data: { [field(kind)]: value } })).count
    }
    if (count !== 1) throw new HeroConflictError('This record changed. Reload before saving SEO.')
    return { record: current.record, state }
  }
  return kind === 'category' ? db.$transaction(change) : change(db)
}
/** Admin-private inventory; callers must authorize before exposing this result. */
export async function listRecordSeo() {
  const kinds: RecordSeoKind[] = ['tour', 'blog', 'destination', 'event', 'offer', 'category', 'hotel']
  const groups = await Promise.all(kinds.map(async kind => {
    const rows = await delegate(kind).findMany()
    const translations = kind === 'category' ? await db.catalogueTranslation.findMany({ where: { entityType: 'category' } }) : []
    const payloads = new Map(translations.map(row => [row.slug, row.payload]))
    return rows.filter(row => kind !== 'offer' || !row.tourSlug).map(row => {
      const record = descriptor(kind, row)
      const raw = kind === 'category' ? payloads.get(row.slug) ?? '{}' : row[field(kind)]
      return { record, state: recordSeoStateFromPayload(raw, kind === 'tour'), ...(kind === 'tour' ? { cruiseType: (row as Row & { cruiseType?: string | null }).cruiseType } : {}) }
    })
  }))
  return groups.flat()
}
export async function getPublishedRecordSeo(kind: RecordSeoKind, slug: string) {
  try {
    const { record, state } = await readRecordSeo(kind, slug)
    return record.published ? state.published : null
  } catch (error) { if (error instanceof RecordSeoNotFoundError) return null; throw error }
}
