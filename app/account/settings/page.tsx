import type { Metadata } from 'next'
import { CustomerAccountPage } from '@/components/account/account-portal'

export const metadata: Metadata = {
  title: 'Account Settings',
  description: 'Manage your TravNeeds account settings.',
  robots: { index: false, follow: false, nocache: true },
}

export default function Page() { return <CustomerAccountPage section="settings" /> }
