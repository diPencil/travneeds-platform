'use client';

import { useAdminLocale } from '@/components/admin/providers/admin-locale';
import { HotelPropertyEditor } from '@/components/admin/hotels/hotel-property-editor';

export default function NewHotelPage() {
  const ar = useAdminLocale() === 'ar';
  return <HotelPropertyEditor hotelId="new" ar={ar} />;
}
