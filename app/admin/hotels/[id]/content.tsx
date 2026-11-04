'use client';

import Link from 'next/link';
import { useAdminLocale } from '@/components/admin/providers/admin-locale';
import { useHotelDetail } from '@/lib/hotels/hotels-client';
import { HotelPropertyEditor } from '@/components/admin/hotels/hotel-property-editor';
import { AdminEmpty, AdminText } from '@/components/admin/admin-ui';

export function HotelEditPageContent({ hotelId }: { hotelId: string }) {
  const ar = useAdminLocale() === 'ar';
  const { hotel, loading, error, refresh } = useHotelDetail(hotelId);

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <AdminEmpty
          title={<AdminText en="Loading hotel property…" ar="جارٍ تحميل بيانات الفندق…" />}
          copy={
            <AdminText
              en="Fetching property specifications, rooms, rate plans, and live inventory."
              ar="تتم قراءة تفاصيل الفندق والغرف وخطط الأسعار وتقويم المخزون."
            />
          }
        />
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <AdminEmpty
          title={<AdminText en="Hotel not found" ar="لم يتم العثور على الفندق" />}
          copy={
            <AdminText
              en={error || 'The requested hotel property does not exist or has been removed.'}
              ar={error || 'الفندق المطلوب غير موجود أو تم حذفه.'}
            />
          }
        />
        <div style={{ marginTop: 20 }}>
          <Link href="/admin/hotels" className="sp-btn">
            {ar ? 'العودة إلى قائمة الفنادق' : 'Back to Hotels list'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <HotelPropertyEditor
      key={hotel.id}
      initialHotel={hotel}
      hotelId={hotel.id}
      ar={ar}
      onRefresh={refresh}
    />
  );
}
