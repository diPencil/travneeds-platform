'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Pencil,
  Eye,
  EyeOff,
  Trash2,
  Bed,
  Star,
  MapPin,
  CheckCircle2,
  Archive,
  Clock,
  Sparkles,
  Home,
} from 'lucide-react';
import { PageHead } from '@/components/admin/admin-shell';
import {
  AdminStats,
  AdminTableTools,
  AdminTableWrap,
  AdminText,
  Card,
  StatusPill,
  AdminEmpty,
  AdminTableActions,
  AdminIconAction,
} from '@/components/admin/admin-ui';
import { SortableTh, useAdminTableSort } from '@/components/admin/ui/admin-table-sort';
import { useAdminLocale } from '@/components/admin/providers/admin-locale';
import { AdminPagination, usePagination } from '@/components/admin/ui/admin-pagination';
import { AdminConfirmDialog } from '@/components/admin/ui/admin-confirm-dialog';
import { toast } from '@/components/admin/ui/admin-toaster';
import { useHotelsList, type HotelListItem } from '@/lib/hotels/hotels-client';

const LODGING_CATEGORIES: Array<{
  id: 'hotels-resorts' | 'boutique' | 'apartments' | 'villas';
  en: string;
  ar: string;
  types: string[];
  noteEn: string;
  noteAr: string;
  icon: typeof Building2;
  tone: 'orange' | 'green' | 'blue' | 'violet';
}> = [
  {
    id: 'hotels-resorts',
    en: 'Hotels & Resorts',
    ar: 'فنادق ومنتجعات',
    types: ['HOTEL', 'RESORT'],
    noteEn: 'Full-service stays & resorts',
    noteAr: 'إقامات فندقية ومنتجعات متكاملة',
    icon: Building2,
    tone: 'orange',
  },
  {
    id: 'boutique',
    en: 'Boutique & Heritage',
    ar: 'فنادق بطابع مميز',
    types: ['BOUTIQUE', 'GUESTHOUSE', 'BED_AND_BREAKFAST'],
    noteEn: 'Unique character & historic',
    noteAr: 'طابع فريد وتراثي أصيل',
    icon: Sparkles,
    tone: 'green',
  },
  {
    id: 'apartments',
    en: 'Apartments & Suites',
    ar: 'شقق فندقية وأجنحة',
    types: ['APARTMENT', 'MOTEL'],
    noteEn: 'Self-catering & serviced units',
    noteAr: 'إقامات مستقلة ومفروشة',
    icon: Bed,
    tone: 'blue',
  },
  {
    id: 'villas',
    en: 'Villas & Holiday Homes',
    ar: 'فيلات ومنازل عطلات',
    types: ['VILLA'],
    noteEn: 'Private luxury retreats',
    noteAr: 'فيلات وإقامات خاصة',
    icon: Home,
    tone: 'violet',
  },
];

export default function HotelsPage() {
  const ar = useAdminLocale() === 'ar';
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<'all' | 'hotels-resorts' | 'boutique' | 'apartments' | 'villas'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HotelListItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const { data, loading, error, refresh } = useHotelsList({ limit: 200 });

  const hotels: HotelListItem[] = useMemo(() => data?.items ?? [], [data]);

  const rows = useMemo(() => {
    return hotels
      .filter((h) => {
        if (cat === 'all') return true;
        const catObj = LODGING_CATEGORIES.find((c) => c.id === cat);
        return catObj ? catObj.types.includes(h.propertyType) : true;
      })
      .filter((h) => (statusFilter === 'all' ? true : h.status === statusFilter))
      .filter((h) => {
        if (!q) return true;
        const query = q.toLowerCase();
        return (
          h.name.toLowerCase().includes(query) ||
          (h.nameAr ? h.nameAr.toLowerCase().includes(query) : false) ||
          h.city.toLowerCase().includes(query) ||
          h.slug.toLowerCase().includes(query)
        );
      });
  }, [hotels, cat, statusFilter, q]);

  const hotelSort = useAdminTableSort(
    rows,
    {
      name: (row: HotelListItem) => row.name,
      city: (row: HotelListItem) => row.city,
      type: (row: HotelListItem) => row.propertyType,
      stars: (row: HotelListItem) => row.starRating ?? 0,
      rooms: (row: HotelListItem) => row.roomTypeCount,
      status: (row: HotelListItem) => row.status,
    },
    'name',
    'asc',
  );

  const paging = usePagination(hotelSort.sortedRows);

  const statValue = (types: string[]) => {
    const matching = hotels.filter((h) => types.includes(h.propertyType));
    const total = matching.length;
    const published = matching.filter((h) => h.status === 'PUBLISHED').length;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '5px', whiteSpace: 'nowrap' }}>
        <span>{total}</span>
        <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>
          / {published} {ar ? 'منشور' : 'published'}
        </span>
      </span>
    );
  };

  const toggleStatus = async (hotel: HotelListItem) => {
    if (busyId) return;
    setBusyId(hotel.id);
    const newStatus = hotel.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      const res = await fetch(`/api/admin/hotels/${encodeURIComponent(hotel.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel: { status: newStatus },
        }),
        credentials: 'same-origin',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || 'Failed to update hotel status.');
      }
      toast.success(
        newStatus === 'PUBLISHED'
          ? ar
            ? `تم نشر "${hotel.name}".`
            : `"${hotel.name}" is now published.`
          : ar
          ? `تم إيقاف نشر "${hotel.name}".`
          : `"${hotel.name}" has been set to draft.`,
      );
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update hotel status.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/admin/hotels/${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || 'Failed to remove hotel.');
      }
      toast.success(
        body.archived
          ? ar
            ? `تمت أرشفة "${deleteTarget.name}" نظراً لوجود حجوزات سابقة.`
            : `"${deleteTarget.name}" was safely archived because past bookings exist.`
          : ar
          ? `تم حذف "${deleteTarget.name}" بنجاح.`
          : `"${deleteTarget.name}" has been deleted.`,
      );
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete hotel.');
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <>
      <PageHead
        eyebrow="Catalogue"
        title="Hotels"
        titleAr="الفنادق والإقامة"
        sub={`${hotels.length} properties · manage hotel rooms, rate plans, and inventory allotment`}
        subAr={`${hotels.length} فندق · إدارة الغرف، خطط الأسعار، وتقويم المخزون`}
        actions={
          <Link className="sp-btn primary" href="/admin/hotels/new">
            <Plus size={17} />
            <AdminText en="Add Hotel" ar="إضافة فندق" />
          </Link>
        }
      />

      <AdminStats
        items={LODGING_CATEGORIES.map((category) => ({
          label: <AdminText en={category.en} ar={category.ar} />,
          value: statValue(category.types),
          note: <AdminText en={category.noteEn} ar={category.noteAr} />,
          icon: category.icon,
          tone: category.tone,
        }))}
      />

      <Card
        title={<AdminText en="All hotels" ar="كل الفنادق" />}
        sub={
          <AdminText
            en={`${rows.length} records match the current view`}
            ar={`${rows.length} سجل يطابق العرض الحالي`}
          />
        }
      >
        <AdminTableTools
          query={q}
          onQueryChange={setQ}
          placeholder={ar ? 'ابحث باسم الفندق، المدينة، أو الكود...' : 'Search hotel name, city, or slug...'}
        >
          <div className="sp-tabs sp-compact-filter-tabs">
            {[
              { id: 'all', en: 'All', ar: 'الكل' },
              ...LODGING_CATEGORIES.map((c) => ({ id: c.id, en: c.en, ar: c.ar })),
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                className={cat === c.id ? 'active' : ''}
                onClick={() => setCat(c.id as typeof cat)}
              >
                {ar ? c.ar : c.en}
              </button>
            ))}
          </div>
          <select
            className="sp-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            aria-label={ar ? 'فلترة حسب الحالة' : 'Filter by status'}
          >
            <option value="all">{ar ? 'كل الحالات' : 'All statuses'}</option>
            <option value="PUBLISHED">{ar ? 'منشور' : 'Published'}</option>
            <option value="DRAFT">{ar ? 'مسودة' : 'Draft'}</option>
            <option value="ARCHIVED">{ar ? 'مؤرشف' : 'Archived'}</option>
          </select>
        </AdminTableTools>

        {loading ? (
          <AdminEmpty
            title={<AdminText en="Loading hotels…" ar="جارٍ تحميل الفنادق…" />}
            copy={<AdminText en="Querying authoritative lodging records." ar="تتم قراءة سجلات الفنادق المعتمدة." />}
          />
        ) : error ? (
          <AdminEmpty
            title={<AdminText en="Could not load hotels" ar="تعذر تحميل الفنادق" />}
            copy={<AdminText en={error} ar={error} />}
          />
        ) : rows.length ? (
          <AdminTableWrap>
            <table className="sp-table">
              <thead>
                <tr>
                  <th className="sp-row-number">#</th>
                  <SortableTh label={<AdminText en="Hotel" ar="الفندق" />} column="name" {...hotelSort} onSort={hotelSort.sortBy} />
                  <SortableTh label={<AdminText en="City / Country" ar="المدينة / الدولة" />} column="city" {...hotelSort} onSort={hotelSort.sortBy} />
                  <SortableTh label={<AdminText en="Type" ar="النوع" />} column="type" {...hotelSort} onSort={hotelSort.sortBy} />
                  <SortableTh label={<AdminText en="Stars" ar="النجوم" />} column="stars" {...hotelSort} onSort={hotelSort.sortBy} />
                  <SortableTh label={<AdminText en="Room Types" ar="أنواع الغرف" />} column="rooms" {...hotelSort} onSort={hotelSort.sortBy} />
                  <SortableTh label={<AdminText en="Status" ar="الحالة" />} column="status" {...hotelSort} onSort={hotelSort.sortBy} />
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paging.pageRows.map((h, index) => (
                  <tr key={h.id}>
                    <td className="sp-row-number">{paging.from + index}</td>
                    <td>
                      <strong>{ar && h.nameAr ? h.nameAr : h.name}</strong>
                      <br />
                      <small style={{ color: 'var(--sp-muted)' }}>/{h.slug}</small>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={13} style={{ color: 'var(--sp-muted)' }} />
                        <span>
                          {h.city}, {h.countryCode}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', textTransform: 'capitalize' }}>
                        {h.propertyType.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                        {h.starRating ? (
                          <>
                            <Star size={13} fill="#f59e0b" color="#f59e0b" />
                            <span style={{ fontWeight: 600 }}>{h.starRating}</span>
                          </>
                        ) : (
                          <span style={{ color: 'var(--sp-muted)' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Bed size={14} style={{ color: 'var(--sp-muted)' }} />
                        <span>{h.roomTypeCount}</span>
                      </div>
                    </td>
                    <td>
                      <StatusPill
                        status={
                          h.status === 'PUBLISHED'
                            ? 'published'
                            : h.status === 'DRAFT'
                            ? 'draft'
                            : 'archived'
                        }
                      />
                    </td>
                    <td>
                      <AdminTableActions>
                        <AdminIconAction
                          icon={Pencil}
                          label={ar ? `تعديل ${h.name}` : `Edit ${h.name}`}
                          href={`/admin/hotels/${h.id}`}
                        />
                        <button
                          type="button"
                          className="sp-icon-btn"
                          disabled={busyId === h.id || deleteBusy}
                          aria-busy={busyId === h.id}
                          onClick={() => void toggleStatus(h)}
                          aria-label={
                            h.status === 'PUBLISHED'
                              ? ar
                                ? `إيقاف نشر ${h.name}`
                                : `Unpublish ${h.name}`
                              : ar
                              ? `نشر ${h.name}`
                              : `Publish ${h.name}`
                          }
                          title={h.status === 'PUBLISHED' ? (ar ? 'إيقاف النشر' : 'Unpublish') : ar ? 'نشر' : 'Publish'}
                        >
                          {h.status === 'PUBLISHED' ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        <button
                          type="button"
                          className="sp-icon-btn danger"
                          disabled={busyId === h.id || deleteBusy}
                          onClick={() => {
                            setDeleteError('');
                            setDeleteTarget(h);
                          }}
                          aria-label={ar ? `حذف أو أرشفة ${h.name}` : `Delete or archive ${h.name}`}
                          title={ar ? 'حذف أو أرشفة' : 'Delete or archive'}
                        >
                          <Trash2 size={18} />
                        </button>
                      </AdminTableActions>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableWrap>
        ) : (
          <AdminEmpty
            title={<AdminText en="No hotels found" ar="لا توجد فنادق" />}
            copy={
              <AdminText
                en="No hotel properties match the filter. Add your first hotel property to start managing rooms and rates."
                ar="لا توجد فنادق تطابق الفلاتر. أضف أول فندق للبدء في إدارة الغرف والأسعار والمخزون."
              />
            }
          />
        )}

        {rows.length > 0 && (
          <AdminPagination
            page={paging.page}
            pageCount={paging.pageCount}
            onPage={paging.setPage}
            pageSize={paging.pageSize}
            onPageSize={paging.setPageSize}
            from={paging.from}
            to={paging.to}
            total={paging.total}
          />
        )}
      </Card>

      <AdminConfirmDialog
        open={deleteTarget !== null}
        onClose={() => {
          if (!deleteBusy) setDeleteTarget(null);
        }}
        onConfirm={() => {
          void handleDelete();
        }}
        title={<AdminText en="Delete or Archive Hotel?" ar="حذف أو أرشفة الفندق؟" />}
        description={
          <AdminText
            en="If this hotel has historical bookings, it will be safely ARCHIVED rather than deleted to protect financial and guest booking records. If it has no bookings, it will be deleted permanently."
            ar="إذا كان هذا الفندق مرتبطاً بحجوزات سابقة، فسيتم أرشفته بأمان بدلاً من الحذف لحماية السجلات المالية وحجوزات النزلاء. أما إذا لم يكن مرتبطاً بحجوزات فسيتم حذفه نهائياً."
          />
        }
        confirmLabel={
          <AdminText
            en={deleteBusy ? 'Processing…' : 'Confirm'}
            ar={deleteBusy ? 'جارٍ المعالجة…' : 'تأكيد'}
          />
        }
        cancelLabel={<AdminText en="Keep" ar="إلغاء" />}
        tone="danger"
        canConfirm={!deleteBusy}
      >
        <div style={{ display: 'grid', gap: 8 }}>
          <p style={{ margin: 0, fontWeight: 700 }}>{deleteTarget?.name}</p>
          {deleteError ? (
            <p role="alert" style={{ color: '#b91c1c', margin: 0, fontSize: '13px' }}>
              {deleteError}
            </p>
          ) : null}
        </div>
      </AdminConfirmDialog>
    </>
  );
}
