import type { Metadata } from 'next'
import { CustomerAccountPage } from '@/components/account/account-portal'

export const metadata: Metadata = {
  title: 'Booking Details',
  description: 'View your TravNeeds booking details.',
  robots: { index: false, follow: false, nocache: true },
}

export default function Page() { return <CustomerAccountPage section="bookings" /> }
