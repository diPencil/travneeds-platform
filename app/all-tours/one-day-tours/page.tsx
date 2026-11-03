import type { Metadata } from 'next'
import { pageContentMetadata } from '@/lib/server/page-content-metadata'
import { ServerShowcaseHero } from '@/components/cms/server-showcase-hero'
import { OneDayToursRegions } from '@/components/site'
import { getSiteUrl, getHreflangEntries } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = await getSiteUrl()
  const hreflang = await getHreflangEntries('/all-tours/one-day-tours')

  return {
    title: 'One-Day Tours in Egypt',
    description: 'Book half-day and full-day Cairo day tours, Luxor and Aswan excursions with TravNeeds. Expert guides, instant confirmation, and unforgettable Egypt experiences.',
    alternates: { canonical: `${siteUrl}/all-tours/one-day-tours`, languages: hreflang },
    ...(await pageContentMetadata('one-day')),
  }
}

export default function Page() {
  return <ServerShowcaseHero id="one-day"><OneDayToursRegions /></ServerShowcaseHero>
}
