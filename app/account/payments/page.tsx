import type { Metadata } from 'next'
import { CustomerAccountPage } from '@/components/account-portal'

export const metadata: Metadata = {
  title: 'My Payments',
  description: 'View your TravNeeds payment history.',
  robots: { index: false, follow: false, nocache: true },
}

export default function Page() { return <CustomerAccountPage section="payments" /> }
