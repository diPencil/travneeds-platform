import type { Metadata } from 'next'
import { CheckoutPage } from '@/components/booking/checkout-page'

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your Egypt trip booking securely.',
  robots: { index: false, follow: false, nocache: true },
}

export default function Page() {
  return <CheckoutPage />
}
