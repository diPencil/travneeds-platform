import type { Metadata } from 'next';
import { HotelsPage } from '@/components/hotels/hotels-page';
import { getSiteUrl, getHreflangEntries } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = await getSiteUrl();
  const hreflang = await getHreflangEntries('/hotels');

  return {
    title: { absolute: 'Hotels & Accommodations in Egypt | TravNeeds' },
    description: 'Discover luxury Nile hotels, Red Sea resorts, and boutique stays across Egypt with live room rates and instant availability.',
    alternates: { canonical: `${siteUrl}/hotels`, languages: hreflang },
  };
}

export default function Page() {
  return <HotelsPage />;
}

