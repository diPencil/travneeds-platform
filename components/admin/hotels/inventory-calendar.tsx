'use client';

import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Check,
  RefreshCw,
  Ban,
  ShieldAlert,
  SlidersHorizontal,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { toast } from '@/components/admin/ui/admin-toaster';
import { Card, AdminText, StatusPill, AdminEmpty, AdminTableWrap } from '@/components/admin/admin-ui';

export interface InventoryCalendarProps {
  hotelId: string;
  roomTypes: {
    id: string;
    name: string;
    code: string;
    ratePlans: { id: string; name: string; code: string; basePrice: number; currency: string }[];
  }[];
  ar: boolean;
}

export function InventoryCalendar({ hotelId, roomTypes, ar }: InventoryCalendarProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>(roomTypes[0]?.id || '');

  const todayStr = new Date().toISOString().slice(0, 10);
  const nextMonthDate = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);
  const nextMonthStr = nextMonthDate.toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(nextMonthStr);

  const [days, setDays] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bulk update form state
  const [showBulk, setShowBulk] = useState(false);
  const [bulkStart, setBulkStart] = useState(todayStr);
  const [bulkEnd, setBulkEnd] = useState(nextMonthStr);
  const [bulkTotal, setBulkTotal] = useState<string>('5');
  const [bulkStopSale, setBulkStopSale] = useState<boolean>(false);
  const [bulkCta, setBulkCta] = useState<boolean>(false);
  const [bulkCtd, setBulkCtd] = useState<boolean>(false);
  const [bulkPrice, setBulkPrice] = useState<string>('');
  const [selectedRatePlanId, setSelectedRatePlanId] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const currentRoom = roomTypes.find((r) => r.id === selectedRoomId);

  useEffect(() => {
    if (!selectedRoomId && roomTypes.length > 0) {
      setSelectedRoomId(roomTypes[0].id);
    }
  }, [roomTypes, selectedRoomId]);

  const fetchCalendar = async () => {
    if (!selectedRoomId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/hotels/${encodeURIComponent(hotelId)}/inventory?roomTypeId=${encodeURIComponent(
          selectedRoomId,
        )}&startDate=${startDate}&endDate=${endDate}`,
        { credentials: 'same-origin' },
      );
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to load inventory.');
      }
      const data = await res.json();
      setDays(data.days || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [selectedRoomId, startDate, endDate]);

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) return;
    setUpdating(true);
    try {
      const payload: any = {
        roomTypeId: selectedRoomId,
        startDate: bulkStart,
        endDate: bulkEnd,
        totalRooms: bulkTotal !== '' ? Number.parseInt(bulkTotal, 10) : undefined,
        stopSale: bulkStopSale,
        closedToArrival: bulkCta,
        closedToDeparture: bulkCtd,
      };

      if (selectedRatePlanId && bulkPrice !== '') {
        payload.ratePlanOverrides = [
          {
            ratePlanId: selectedRatePlanId,
            price: Number.parseFloat(bulkPrice),
          },
        ];
      }

      const res = await fetch(`/api/admin/hotels/${encodeURIComponent(hotelId)}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin',
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to update inventory.');
      }

      toast.success(
        ar ? 'تم تطبيق التحديث الجماعي للمخزون بنجاح.' : 'Bulk inventory update applied successfully.',
        { dedupeKey: 'inventory-update' },
      );
      setShowBulk(false);
      fetchCalendar();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update inventory.', { dedupeKey: 'inventory-update' });
    } finally {
      setUpdating(false);
    }
  };

  if (!roomTypes.length) {
    return (
      <Card
        title={<AdminText en="Inventory & Restrictions Calendar" ar="تقويم المخزون والقيود" />}
        sub={<AdminText en="Daily room allotments, restrictions, and rate overrides" ar="المخصصات اليومية للغرف والقيود وتعديلات الأسعار" />}
      >
        <AdminEmpty
          title={<AdminText en="No room types configured" ar="لم يتم العثور على فئات غرف" />}
          copy={
            <AdminText
              en="Please add at least one room category under 'Rooms & Rates' before managing allotments and calendar inventory."
              ar="يرجى إضافة فئة غرفة واحدة على الأقل في تبويب 'الغرف والأسعار' قبل إدارة الحصص وتقويم المخزون."
            />
          }
        />
      </Card>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* 1. Main Calendar Card */}
      <Card
        title={<AdminText en="Room Inventory & Restriction Calendar" ar="تقويم مخصصات الغرف والقيود اليومية" />}
        sub={
          <AdminText
            en={`Monitoring room availability from ${startDate} to ${endDate} (${days.length} days view)`}
            ar={`متابعة توافر الغرف من ${startDate} إلى ${endDate} (عرض ${days.length} يوماً)`}
          />
        }
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className={showBulk ? 'sp-btn primary' : 'sp-btn'}
              onClick={() => setShowBulk(!showBulk)}
            >
              <SlidersHorizontal size={15} />
              <AdminText en={showBulk ? 'Hide Bulk Tool' : 'Bulk Date Range Update'} ar={showBulk ? 'إخفاء أداة التحديث' : 'تحديث فترة محددة'} />
            </button>
            <button
              type="button"
              className="sp-icon-btn"
              onClick={fetchCalendar}
              disabled={loading}
              title={ar ? 'تحديث الجدول' : 'Refresh inventory'}
              aria-label={ar ? 'تحديث الجدول' : 'Refresh inventory'}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        }
      >
        {/* Filter Controls Toolbar */}
        <div className="sp-table-tools" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '13px', color: 'var(--sp-blue-deep)' }}>
              <AdminText en="Room Type:" ar="فئة الغرفة:" />
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="sp-filter-select"
              >
                {roomTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name} ({rt.code})
                  </option>
                ))}
              </select>
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--sp-muted)' }}>
                <AdminText en="From:" ar="من:" />
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  minHeight: 38,
                  padding: '0 10px',
                  borderRadius: 10,
                  border: '1px solid var(--sp-border)',
                  background: '#fff',
                  font: 'inherit',
                  fontSize: '12.5px',
                }}
              />
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--sp-muted)' }}>
                <AdminText en="To:" ar="إلى:" />
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  minHeight: 38,
                  padding: '0 10px',
                  borderRadius: 10,
                  border: '1px solid var(--sp-border)',
                  background: '#fff',
                  font: 'inherit',
                  fontSize: '12.5px',
                }}
              />
            </div>
          </div>
        </div>

        {/* 2. Bulk Update Drawer Section */}
        {showBulk && (
          <div style={{ marginBottom: 16, padding: 16, border: '1.5px solid var(--sp-orange)', borderRadius: 14, background: '#fffcf7' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Sparkles size={17} color="var(--sp-orange)" />
              <strong style={{ fontSize: '14px', color: 'var(--sp-blue-deep)' }}>
                <AdminText en="Bulk Allotment & Rates Multi-Date Tool" ar="تحديث جماعي للمخصصات والأسعار لفترة محددة" />
              </strong>
            </header>

            <form onSubmit={handleBulkSubmit} className="sp-form">
              <div className="sp-form-2">
                <label>
                  <AdminText en="Start Date*" ar="من تاريخ*" />
                  <input
                    type="date"
                    required
                    value={bulkStart}
                    onChange={(e) => setBulkStart(e.target.value)}
                  />
                </label>
                <label>
                  <AdminText en="End Date*" ar="إلى تاريخ*" />
                  <input
                    type="date"
                    required
                    value={bulkEnd}
                    onChange={(e) => setBulkEnd(e.target.value)}
                  />
                </label>
              </div>

              <div className="sp-form-2">
                <label>
                  <AdminText en="Total Rooms (Allotment)" ar="إجمالي الغرف المخصصة (Allotment)" />
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={bulkTotal}
                    onChange={(e) => setBulkTotal(e.target.value)}
                    placeholder="5"
                  />
                </label>

                <div className="sp-form-2">
                  <label>
                    <AdminText en="Rate Plan to Override" ar="خطة السعر للتعديل" />
                    <select
                      value={selectedRatePlanId}
                      onChange={(e) => setSelectedRatePlanId(e.target.value)}
                    >
                      <option value="">{ar ? 'بدون تعديل سعر' : 'No price override'}</option>
                      {currentRoom?.ratePlans.map((rp) => (
                        <option key={rp.id} value={rp.id}>
                          {rp.name} ({rp.code})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <AdminText en="New Daily Price (USD)" ar="السعر اليومي الجديد (دولار)" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={bulkPrice}
                      onChange={(e) => setBulkPrice(e.target.value)}
                      placeholder="180.00"
                      disabled={!selectedRatePlanId}
                    />
                  </label>
                </div>
              </div>

              {/* Restriction Checkboxes */}
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', padding: '10px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={bulkStopSale}
                    onChange={(e) => setBulkStopSale(e.target.checked)}
                    style={{ width: 'auto', minHeight: 'auto', margin: 0 }}
                  />
                  <span><AdminText en="Stop Sale (Close Booking)" ar="إيقاف البيع (Stop Sale)" /></span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={bulkCta}
                    onChange={(e) => setBulkCta(e.target.checked)}
                    style={{ width: 'auto', minHeight: 'auto', margin: 0 }}
                  />
                  <span><AdminText en="Closed to Arrival (CTA)" ar="إغلاق الوصول (CTA)" /></span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={bulkCtd}
                    onChange={(e) => setBulkCtd(e.target.checked)}
                    style={{ width: 'auto', minHeight: 'auto', margin: 0 }}
                  />
                  <span><AdminText en="Closed to Departure (CTD)" ar="إغلاق المغادرة (CTD)" /></span>
                </label>
              </div>

              <div className="sp-confirm-actions">
                <button type="button" className="sp-btn" onClick={() => setShowBulk(false)}>
                  <AdminText en="Cancel" ar="إلغاء" />
                </button>
                <button type="submit" className="sp-btn primary" disabled={updating}>
                  <AdminText en={updating ? 'Applying…' : 'Apply Update to Range'} ar={updating ? 'جارٍ التطبيق…' : 'تطبيق التحديث على الفترة'} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 3. Calendar Data Table */}
        {error ? (
          <AdminEmpty title={<AdminText en="Could not load calendar" ar="تعذر تحميل التقويم" />} copy={<AdminText en={error} ar={error} />} />
        ) : loading ? (
          <AdminEmpty title={<AdminText en="Loading inventory…" ar="جارٍ تحميل المخصصات…" />} copy={<AdminText en="Reading date-based allotments and rates." ar="تتم قراءة الحصص والأسعار اليومية." />} />
        ) : (
          <AdminTableWrap>
            <table className="sp-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 120 }}><AdminText en="Date" ar="التاريخ" /></th>
                  <th style={{ minWidth: 80 }}><AdminText en="Total" ar="المخصص" /></th>
                  <th style={{ minWidth: 80 }}><AdminText en="Booked" ar="محجوز" /></th>
                  <th style={{ minWidth: 80 }}><AdminText en="Held" ar="معلّق" /></th>
                  <th style={{ minWidth: 90 }}><AdminText en="Available" ar="المتاح" /></th>
                  <th style={{ minWidth: 120 }}><AdminText en="Restrictions" ar="القيود" /></th>
                  {currentRoom?.ratePlans.map((rp) => (
                    <th key={rp.id} style={{ minWidth: 110 }}>
                      {rp.code}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map((day) => {
                  const dateObj = new Date(day.date);
                  const dayName = dateObj.toLocaleDateString(ar ? 'ar-EG' : 'en-US', { weekday: 'short' });
                  const isWeekend = dateObj.getUTCDay() === 5 || dateObj.getUTCDay() === 6;

                  return (
                    <tr
                      key={day.date}
                      style={{
                        background: day.stopSale ? '#fff1f2' : isWeekend ? '#f8faff' : undefined,
                      }}
                    >
                      <td>
                        <strong>{day.date}</strong>
                        <br />
                        <small style={{ color: 'var(--sp-muted)' }}>{dayName}</small>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700 }}>{day.totalRooms}</span>
                      </td>
                      <td>
                        <span style={{ color: day.bookedRooms > 0 ? '#b45309' : 'var(--sp-muted)' }}>
                          {day.bookedRooms}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: day.heldRooms > 0 ? '#2563eb' : 'var(--sp-muted)' }}>
                          {day.heldRooms}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 800,
                            color: day.availableRooms > 0 ? '#15803d' : '#be123c',
                          }}
                        >
                          {day.availableRooms}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
                          {day.stopSale && (
                            <span className="sp-pill is-failed">
                              {ar ? 'مغلق' : 'Stop Sale'}
                            </span>
                          )}
                          {day.closedToArrival && (
                            <span className="sp-pill is-pending">
                              CTA
                            </span>
                          )}
                          {day.closedToDeparture && (
                            <span className="sp-pill is-pending">
                              CTD
                            </span>
                          )}
                          {!day.stopSale && !day.closedToArrival && !day.closedToDeparture && (
                            <span style={{ color: 'var(--sp-muted)', fontSize: '11px' }}>—</span>
                          )}
                        </div>
                      </td>
                      {currentRoom?.ratePlans.map((rp) => {
                        const price = day.ratePlanPrices?.[rp.id] ?? rp.basePrice;
                        const isOverridden = day.ratePlanPrices?.[rp.id] !== undefined;

                        return (
                          <td key={rp.id}>
                            <span
                              style={{
                                fontWeight: 700,
                                color: isOverridden ? 'var(--sp-orange)' : 'var(--sp-blue-deep)',
                              }}
                            >
                              ${Number(price).toFixed(2)}
                            </span>
                            {isOverridden && (
                              <small style={{ display: 'block', fontSize: '10px', color: 'var(--sp-orange)' }}>
                                {ar ? 'معدل' : 'override'}
                              </small>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </AdminTableWrap>
        )}
      </Card>
    </div>
  );
}
