import { notFound } from 'next/navigation'
import { SeoRecordEditor } from '@/components/admin/seo/seo-record-editor'
import { isRecordSeoKind } from '@/lib/record-seo'

export default async function Page({ params }: { params: Promise<{ kind: string; slug: string }> }) {
  const { kind, slug } = await params
  if (!isRecordSeoKind(kind) || !slug.trim()) notFound()
  return <SeoRecordEditor key={`${kind}:${slug}`} kind={kind} slug={slug} />
}
