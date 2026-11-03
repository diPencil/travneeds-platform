import type { Metadata } from 'next'
import { CustomerAccountPage } from '@/components/account/account-portal'

export const metadata: Metadata = {
  title: 'Change Password',
  description: 'Change your TravNeeds account password.',
  robots: { index: false, follow: false, nocache: true },
}

export default function Page() { return <CustomerAccountPage section="settings" /> }
