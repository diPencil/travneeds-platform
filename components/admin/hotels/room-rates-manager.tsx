'use client';

import { useState } from 'react';
import {
  Bed,
  Plus,
  Pencil,
  Trash2,
  Users,
  ChevronDown,
  ChevronRight,
  X,
  CreditCard,
  DollarSign,
  Tag,
  ShieldAlert,
} from 'lucide-react';
import { toast } from '@/components/admin/admin-toaster';
import { AdminConfirmDialog } from '@/components/admin/admin-confirm-dialog';
import { Card, AdminText, StatusPill, AdminEmpty, AdminTableWrap, AdminTableActions, AdminIconAction } from '@/components/admin/admin-ui';

export interface RoomRatesManagerProps {
  hotelId: string;
  roomTypes: any[];
  ar: boolean;
  onRefresh: () => void;
  viewMode?: 'rooms' | 'rates' | 'all';
}

export function RoomRatesManager({ hotelId, roomTypes, ar, onRefresh, viewMode = 'all' }: RoomRatesManagerProps) {
  const [expandedRoomId, setExpandedRoomId] = useState<string>(roomTypes[0]?.id || '');

  // Room modal state
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any | null>(null);
  const [roomSaving, setRoomSaving] = useState(false);

  // Rate plan modal state
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [targetRoomTypeId, setTargetRoomTypeId] = useState<string>('');
  const [editingRate, setEditingRate] = useState<any | null>(null);
  const [rateSaving, setRateSaving] = useState(false);

  // Deletion confirm states
  const [deleteTarget, setDeleteTarget] = useState<{ kind: 'room' | 'rate'; id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Room Form fields
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [roomDesc, setRoomDesc] = useState('');
  const [maxAdults, setMaxAdults] = useState(2);
  const [maxChildren, setMaxChildren] = useState(1);
  const [maxOccupancy, setMaxOccupancy] = useState(3);
  const [bedConfig, setBedConfig] = useState('1 King Bed');
  const [roomSize, setRoomSize] = useState<string>('35');
  const [roomActive, setRoomActive] = useState(true);

  // Rate Plan Form fields
  const [rateName, setRateName] = useState('');
  const [rateCode, setRateCode] = useState('');
  const [rateDesc, setRateDesc] = useState('');
  const [boardBasis, setBoardBasis] = useState('ROOM_ONLY');
  const [isRefundable, setIsRefundable] = useState(true);
  const [basePrice, setBasePrice] = useState<string>('120');
  const [currency, setCurrency] = useState('USD');
  const [cancelDeadline, setCancelDeadline] = useState(2);
  const [cancelPenalty, setCancelPenalty] = useState(100);
  const [minStay, setMinStay] = useState(1);
  const [maxStay, setMaxStay] = useState<string>('');
  const [rateActive, setRateActive] = useState(true);

  const openNewRoom = () => {
    setEditingRoom(null);
    setRoomName('');
    setRoomCode('');
    setRoomDesc('');
    setMaxAdults(2);
    setMaxChildren(1);
    setMaxOccupancy(3);
    setBedConfig('1 King Bed');
    setRoomSize('35');
    setRoomActive(true);
    setRoomModalOpen(true);
  };

  const openEditRoom = (rt: any) => {
    setEditingRoom(rt);
    setRoomName(rt.name);
    setRoomCode(rt.code);
    setRoomDesc(rt.description || '');
    setMaxAdults(rt.maxAdults);
    setMaxChildren(rt.maxChildren);
    setMaxOccupancy(rt.maxOccupancy);
    setBedConfig(rt.bedConfiguration || '1 King Bed');
    setRoomSize(rt.roomSizeSqm ? String(rt.roomSizeSqm) : '');
    setRoomActive(rt.isActive);
    setRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) {
      toast.error(ar ? 'يرجى حفظ الفندق أولاً قبل إضافة الغرف.' : 'Please save the hotel first before adding rooms.');
      return;
    }
    setRoomSaving(true);
    try {
      const payload = {
        name: roomName.trim(),
        code: roomCode.trim().toUpperCase(),
        description: roomDesc.trim() || undefined,
        maxAdults: Number(maxAdults),
        maxChildren: Number(maxChildren),
        maxOccupancy: Number(maxOccupancy),
        bedConfiguration: bedConfig.trim() || undefined,
        roomSizeSqm: roomSize ? Number(roomSize) : undefined,
        isActive: roomActive,
      };

      const url = editingRoom
        ? `/api/admin/hotels/${encodeURIComponent(hotelId)}/room-types/${encodeURIComponent(editingRoom.id)}`
        : `/api/admin/hotels/${encodeURIComponent(hotelId)}/room-types`;

      const method = editingRoom ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin',
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to save room.');
      }

      toast.success(
        editingRoom
          ? ar
            ? 'تم حفظ فئة الغرفة.'
            : 'Room category saved.'
          : ar
          ? 'تم إنشاء فئة الغرفة.'
          : 'Room category created.',
        { dedupeKey: 'room-save' },
      );
      setRoomModalOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save room.', { dedupeKey: 'room-save' });
    } finally {
      setRoomSaving(false);
    }
  };

  const openNewRate = (rtId: string) => {
    setTargetRoomTypeId(rtId);
    setEditingRate(null);
    setRateName('');
    setRateCode('');
    setRateDesc('');
    setBoardBasis('ROOM_ONLY');
    setIsRefundable(true);
    setBasePrice('120');
    setCurrency('USD');
    setCancelDeadline(2);
    setCancelPenalty(100);
    setMinStay(1);
    setMaxStay('');
    setRateActive(true);
    setRateModalOpen(true);
  };

  const openEditRate = (rtId: string, rp: any) => {
    setTargetRoomTypeId(rtId);
    setEditingRate(rp);
    setRateName(rp.name);
    setRateCode(rp.code);
    setRateDesc(rp.description || '');
    setBoardBasis(rp.boardBasis);
    setIsRefundable(rp.isRefundable);
    setBasePrice(String(rp.basePrice));
    setCurrency(rp.currency || 'USD');
    setCancelDeadline(rp.cancellationDeadlineDays ?? 2);
    setCancelPenalty(rp.cancellationPenaltyPercent ?? 100);
    setMinStay(rp.minStayNights || 1);
    setMaxStay(rp.maxStayNights ? String(rp.maxStayNights) : '');
    setRateActive(rp.isActive);
    setRateModalOpen(true);
  };

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setRateSaving(true);
    try {
      const payload = {
        roomTypeId: targetRoomTypeId,
        name: rateName.trim(),
        code: rateCode.trim().toUpperCase(),
        description: rateDesc.trim() || undefined,
        boardBasis,
        isRefundable,
        basePrice: Number(basePrice),
        currency,
        cancellationDeadlineDays: Number(cancelDeadline),
        cancellationPenaltyPercent: Number(cancelPenalty),
        minStayNights: Number(minStay),
        maxStayNights: maxStay ? Number(maxStay) : undefined,
        isActive: rateActive,
      };

      const url = editingRate
        ? `/api/admin/hotels/${encodeURIComponent(hotelId)}/rate-plans/${encodeURIComponent(editingRate.id)}`
        : `/api/admin/hotels/${encodeURIComponent(hotelId)}/rate-plans`;

      const method = editingRate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin',
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to save rate plan.');
      }

      toast.success(
        editingRate
          ? ar
            ? 'تم حفظ خطة السعر.'
            : 'Rate plan saved.'
          : ar
          ? 'تم إنشاء خطة السعر.'
          : 'Rate plan created.',
        { dedupeKey: 'rate-save' },
      );
      setRateModalOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save rate plan.', { dedupeKey: 'rate-save' });
    } finally {
      setRateSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const url =
        deleteTarget.kind === 'room'
          ? `/api/admin/hotels/${encodeURIComponent(hotelId)}/room-types/${encodeURIComponent(deleteTarget.id)}`
          : `/api/admin/hotels/${encodeURIComponent(hotelId)}/rate-plans/${encodeURIComponent(deleteTarget.id)}`;

      const res = await fetch(url, {
        method: 'DELETE',
        credentials: 'same-origin',
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to delete.');
      }

      toast.success(
        ar ? `تم حذف "${deleteTarget.name}".` : `"${deleteTarget.name}" deleted.`,
        { dedupeKey: 'room-delete' },
      );
      setDeleteTarget(null);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete item.', { dedupeKey: 'room-delete' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card
        title={
          viewMode === 'rooms' ? (
            <AdminText en="Room Categories Catalogue" ar="دليل فئات الغرف" />
          ) : viewMode === 'rates' ? (
            <AdminText en="Rate Plans & Pricing" ar="خطط الأسعار والتسعير" />
          ) : (
            <AdminText en="Room Categories & Rate Plans" ar="فئات الغرف وخطط الأسعار" />
          )
        }
        sub={
          viewMode === 'rooms' ? (
            <AdminText
              en={`${roomTypes.length} categories registered · capacity & beds`}
              ar={`${roomTypes.length} فئة مسجلة · السعة والأسرّة`}
            />
          ) : viewMode === 'rates' ? (
            <AdminText
              en="Configure board basis, base prices, and cancellation policies"
              ar="تهيئة خطط الوجبات، الأسعار الأساسية، وسياسات الإلغاء"
            />
          ) : (
            <AdminText
              en={`${roomTypes.length} room types registered`}
              ar={`${roomTypes.length} فئة غرفة مسجلة`}
            />
          )
        }
        action={
          <button
            type="button"
            className="sp-btn primary"
            onClick={openNewRoom}
            style={{
              whiteSpace: 'nowrap',
              flexShrink: 0,
              minHeight: 34,
              padding: '0 14px',
              fontSize: '12px',
              gap: 6,
            }}
          >
            <Plus size={14} />
            <AdminText en="Add Room" ar="إضافة غرفة" />
          </button>
        }
      >
        {roomTypes.length === 0 ? (
          <AdminEmpty
            title={<AdminText en="No room types created yet" ar="لم يتم إنشاء أي فئات غرف بعد" />}
            copy={
              <AdminText
                en="Click 'Add Room' to set up your first guest room category, bed configuration, and pricing rate plans."
                ar="انقر على 'إضافة غرفة' لإعداد أول فئة غرف للنزلاء وترتيب الأسرّة وخطط الأسعار."
              />
            }
          />
        ) : (
          <div className="sp-repeat-list">
            {roomTypes.map((rt) => {
              const isExpanded = expandedRoomId === rt.id;
              const ratePlans = rt.ratePlans || [];

              return (
                <article
                  key={rt.id}
                  className="sp-repeat-card"
                  style={{ background: '#fff', border: '1px solid var(--sp-border)' }}
                >
                  {/* Room Header Accordion Row */}
                  <header
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      padding: '4px 0',
                    }}
                    onClick={() => setExpandedRoomId(isExpanded ? '' : rt.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="sp-icon-btn" style={{ width: 32, height: 32, minHeight: 32 }}>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong style={{ fontSize: '14px', color: 'var(--sp-blue-deep)' }}>{rt.name}</strong>
                          <span style={{ fontSize: '11px', background: '#eef3ff', color: 'var(--sp-blue)', padding: '2px 7px', borderRadius: 6, fontWeight: 700 }}>
                            {rt.code}
                          </span>
                          <StatusPill status={rt.isActive ? 'active' : 'inactive'} />
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontSize: '12px', color: 'var(--sp-muted)', marginTop: 2 }}>
                          <span>
                            <Users size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginInlineEnd: 4 }} />
                            {rt.maxAdults} {ar ? 'بالغ' : 'Adults'} / {rt.maxChildren} {ar ? 'طفل' : 'Children'} ({ar ? 'إجمالي' : 'Total'}: {rt.maxOccupancy})
                          </span>
                          {rt.bedConfiguration && <span>• {rt.bedConfiguration}</span>}
                          {rt.roomSizeSqm && <span>• {rt.roomSizeSqm} m²</span>}
                          <span>• {ratePlans.length} {ar ? 'خطط أسعار' : 'rate plans'}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="sp-icon-btn"
                        onClick={() => openEditRoom(rt)}
                        title={ar ? 'تعديل الغرفة' : 'Edit room category'}
                        aria-label={ar ? 'تعديل الغرفة' : 'Edit room category'}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="sp-icon-btn danger"
                        onClick={() => setDeleteTarget({ kind: 'room', id: rt.id, name: rt.name })}
                        title={ar ? 'حذف الغرفة' : 'Delete room category'}
                        aria-label={ar ? 'حذف الغرفة' : 'Delete room category'}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </header>

                  {/* Expanded Room Content: Rate Plans */}
                  {isExpanded && (
                    <div style={{ marginTop: 10, borderTop: '1px solid var(--sp-border)', paddingTop: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--sp-blue-deep)' }}>
                          <AdminText en={`Rate Plans for ${rt.name}`} ar={`خطط أسعار ${rt.name}`} />
                        </span>
                        <button
                          type="button"
                          className="sp-btn"
                          onClick={() => openNewRate(rt.id)}
                          style={{ minHeight: 34, padding: '0 14px', fontSize: '12px' }}
                        >
                          <Plus size={14} />
                          <AdminText en="Add Rate Plan" ar="إضافة خطة سعر" />
                        </button>
                      </div>

                      {ratePlans.length === 0 ? (
                        <div style={{ padding: '16px', textAlign: 'center', background: '#f8f9fc', borderRadius: 8, fontSize: '12.5px', color: 'var(--sp-muted)' }}>
                          <AdminText
                            en="No rate plans added yet. Add a rate plan to set base prices and meal options."
                            ar="لم تتم إضافة خطط أسعار بعد. أضف خطة سعر لتحديد السعر الأساسي وخطة الوجبات."
                          />
                        </div>
                      ) : (
                        <AdminTableWrap>
                          <table className="sp-table">
                            <thead>
                              <tr>
                                <th><AdminText en="Rate Plan" ar="خطة السعر" /></th>
                                <th><AdminText en="Code" ar="الرمز" /></th>
                                <th><AdminText en="Board Basis" ar="خطة الوجبات" /></th>
                                <th><AdminText en="Base Price" ar="السعر الأساسي" /></th>
                                <th><AdminText en="Min/Max Stay" ar="مدة الإقامة" /></th>
                                <th><AdminText en="Cancellation Policy" ar="سياسة الإلغاء" /></th>
                                <th><AdminText en="Status" ar="الحالة" /></th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {ratePlans.map((rp: any) => (
                                <tr key={rp.id}>
                                  <td><strong>{rp.name}</strong></td>
                                  <td><code>{rp.code}</code></td>
                                  <td>
                                    <span style={{ fontSize: '11.5px', textTransform: 'capitalize' }}>
                                      {rp.boardBasis.replace(/_/g, ' ').toLowerCase()}
                                    </span>
                                  </td>
                                  <td>
                                    <span style={{ fontWeight: 700, color: 'var(--sp-blue-deep)' }}>
                                      ${Number(rp.basePrice).toFixed(2)}
                                    </span>
                                  </td>
                                  <td>
                                    <span>
                                      {rp.minStayNights || 1} {rp.maxStayNights ? `— ${rp.maxStayNights}` : '+'} {ar ? 'ليالٍ' : 'nights'}
                                    </span>
                                  </td>
                                  <td>
                                    <span style={{ fontSize: '12px' }}>
                                      {rp.isRefundable
                                        ? ar
                                          ? `إلغاء مجاني حتى ${rp.cancellationDeadlineDays || 2} يوم`
                                          : `Free cancel up to ${rp.cancellationDeadlineDays || 2}d`
                                        : ar
                                        ? 'غير قابل للاسترداد'
                                        : 'Non-refundable'}
                                    </span>
                                  </td>
                                  <td>
                                    <StatusPill status={rp.isActive ? 'active' : 'inactive'} />
                                  </td>
                                  <td>
                                    <AdminTableActions>
                                      <AdminIconAction
                                        icon={Pencil}
                                        label={ar ? 'تعديل السعر' : 'Edit rate plan'}
                                        onClick={() => openEditRate(rt.id, rp)}
                                      />
                                      <button
                                        type="button"
                                        className="sp-icon-btn danger"
                                        onClick={() => setDeleteTarget({ kind: 'rate', id: rp.id, name: rp.name })}
                                        title={ar ? 'حذف خطة السعر' : 'Delete rate plan'}
                                        aria-label={ar ? 'حذف خطة السعر' : 'Delete rate plan'}
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </AdminTableActions>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </AdminTableWrap>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </Card>

      {/* 2. Room Type Modal Dialog (Native TravNeeds .sp-modal-backdrop) */}
      {roomModalOpen && (
        <div className="sp-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="room-modal-title">
          <div className="sp-modal">
            <header className="sp-modal-head">
              <div>
                <strong id="room-modal-title">
                  {editingRoom ? (ar ? 'تعديل فئة الغرفة' : 'Edit Room Category') : ar ? 'إضافة فئة غرفة جديدة' : 'Add Room Category'}
                </strong>
                <small>
                  {ar ? 'تحديد مواصفات الغرفة وسعة النزلاء والأسرّة' : 'Define room size, occupancy thresholds, and bed configuration'}
                </small>
              </div>
              <button
                type="button"
                className="sp-icon-btn"
                onClick={() => setRoomModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleSaveRoom} className="sp-form">
              <label>
                <AdminText en="Room Category Name (Canonical English)*" ar="اسم فئة الغرفة (بالإنجليزية المعتمدة)*" />
                <input
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Deluxe Nile View Suite"
                />
              </label>

              <label>
                <AdminText en="Room Code (Unique)*" ar="رمز الغرفة (فريد داخل الفندق)*" />
                <input
                  required
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="DLX-NILE"
                />
              </label>

              <div className="sp-form-2">
                <label>
                  <AdminText en="Max Adults*" ar="أقصى عدد بالغين*" />
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={maxAdults}
                    onChange={(e) => setMaxAdults(Number(e.target.value))}
                  />
                </label>
                <label>
                  <AdminText en="Max Children" ar="أقصى عدد أطفال" />
                  <input
                    type="number"
                    min="0"
                    max="6"
                    value={maxChildren}
                    onChange={(e) => setMaxChildren(Number(e.target.value))}
                  />
                </label>
              </div>

              <div className="sp-form-2">
                <label>
                  <AdminText en="Max Total Occupancy*" ar="أقصى طاقة استيعابية كلية*" />
                  <input
                    type="number"
                    min="1"
                    max="16"
                    required
                    value={maxOccupancy}
                    onChange={(e) => setMaxOccupancy(Number(e.target.value))}
                  />
                </label>
                <label>
                  <AdminText en="Room Size (sqm)" ar="مساحة الغرفة (م²)" />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={roomSize}
                    onChange={(e) => setRoomSize(e.target.value)}
                    placeholder="45"
                  />
                </label>
              </div>

              <label>
                <AdminText en="Bed Configuration" ar="ترتيب الأسرّة" />
                <input
                  value={bedConfig}
                  onChange={(e) => setBedConfig(e.target.value)}
                  placeholder="1 King Bed or 2 Twin Beds"
                />
              </label>

              <label>
                <AdminText en="Room Description" ar="وصف تفصيلي للغرفة" />
                <textarea
                  rows={3}
                  value={roomDesc}
                  onChange={(e) => setRoomDesc(e.target.value)}
                  placeholder={ar ? 'إطلالة مباشرة على النيل مع شرفة خاصة...' : 'Direct Nile view with private balcony and marble bath...'}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={roomActive}
                  onChange={(e) => setRoomActive(e.target.checked)}
                  style={{ width: 'auto', minHeight: 'auto', margin: 0 }}
                />
                <strong><AdminText en="Active and available for booking" ar="فئة الغرفة نشطة وقابلة للحجز" /></strong>
              </label>

              <div className="sp-confirm-actions">
                <button type="button" className="sp-btn" onClick={() => setRoomModalOpen(false)}>
                  <AdminText en="Cancel" ar="إلغاء" />
                </button>
                <button type="submit" className="sp-btn primary" disabled={roomSaving}>
                  <AdminText en={roomSaving ? 'Saving…' : 'Save Room'} ar={roomSaving ? 'جارٍ الحفظ…' : 'حفظ الغرفة'} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Rate Plan Modal Dialog (Native TravNeeds .sp-modal-backdrop) */}
      {rateModalOpen && (
        <div className="sp-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="rate-modal-title">
          <div className="sp-modal">
            <header className="sp-modal-head">
              <div>
                <strong id="rate-modal-title">
                  {editingRate ? (ar ? 'تعديل خطة السعر' : 'Edit Rate Plan') : ar ? 'إضافة خطة سعر جديدة' : 'Add Rate Plan'}
                </strong>
                <small>
                  {ar ? 'تحديد السعر الأساسي وخطة الوجبات وشروط الإلغاء' : 'Configure base nightly rate, board basis, and cancellation policy'}
                </small>
              </div>
              <button
                type="button"
                className="sp-icon-btn"
                onClick={() => setRateModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleSaveRate} className="sp-form">
              <label>
                <AdminText en="Rate Plan Name (Canonical English)*" ar="اسم خطة السعر (بالإنجليزية المعتمدة)*" />
                <input
                  required
                  value={rateName}
                  onChange={(e) => setRateName(e.target.value)}
                  placeholder="e.g. Standard Flexible with Breakfast"
                />
              </label>

              <div className="sp-form-2">
                <label>
                  <AdminText en="Rate Code (Unique)*" ar="رمز الخطة (فريد)*" />
                  <input
                    required
                    value={rateCode}
                    onChange={(e) => setRateCode(e.target.value.toUpperCase())}
                    placeholder="FLEX-BB"
                  />
                </label>
                <label>
                  <AdminText en="Board Basis*" ar="خطة الوجبات*" />
                  <select
                    value={boardBasis}
                    onChange={(e) => setBoardBasis(e.target.value)}
                  >
                    <option value="ROOM_ONLY">{ar ? 'غرفة فقط (Room Only)' : 'Room Only'}</option>
                    <option value="BED_AND_BREAKFAST">{ar ? 'شامل الإفطار (Bed & Breakfast)' : 'Bed & Breakfast'}</option>
                    <option value="HALF_BOARD">{ar ? 'نصف إقامة (Half Board)' : 'Half Board'}</option>
                    <option value="FULL_BOARD">{ar ? 'إقامة كاملة (Full Board)' : 'Full Board'}</option>
                    <option value="ALL_INCLUSIVE">{ar ? 'شامل كلياً (All Inclusive)' : 'All Inclusive'}</option>
                    <option value="ULTRA_ALL_INCLUSIVE">{ar ? 'شامل كلياً الترا (Ultra All Inclusive)' : 'Ultra All Inclusive'}</option>
                  </select>
                </label>
              </div>

              <div className="sp-form-2">
                <label>
                  <AdminText en="Base Price (USD)*" ar="السعر الأساسي لكل ليلة (دولار)*" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="150.00"
                  />
                </label>
                <label>
                  <AdminText en="Currency" ar="العملة" />
                  <input
                    value={currency}
                    readOnly
                    style={{ background: '#f8f9fc', color: 'var(--sp-muted)' }}
                  />
                </label>
              </div>

              <div className="sp-form-2">
                <label>
                  <AdminText en="Minimum Stay (Nights)*" ar="الحد الأدنى للإقامة (ليالٍ)*" />
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={minStay}
                    onChange={(e) => setMinStay(Number(e.target.value))}
                  />
                </label>
                <label>
                  <AdminText en="Maximum Stay (Nights)" ar="الحد الأقصى للإقامة (ليالٍ)" />
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={maxStay}
                    onChange={(e) => setMaxStay(e.target.value)}
                    placeholder="Unlimited"
                  />
                </label>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isRefundable}
                  onChange={(e) => setIsRefundable(e.target.checked)}
                  style={{ width: 'auto', minHeight: 'auto', margin: 0 }}
                />
                <strong><AdminText en="Refundable (Subject to cancellation terms)" ar="قابل للاسترداد (وفقاً لشروط الإلغاء)" /></strong>
              </label>

              {isRefundable && (
                <div className="sp-form-2">
                  <label>
                    <AdminText en="Free Cancellation Deadline (Days before arrival)" ar="مهلة الإلغاء المجاني (أيام قبل الوصول)" />
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={cancelDeadline}
                      onChange={(e) => setCancelDeadline(Number(e.target.value))}
                    />
                  </label>
                  <label>
                    <AdminText en="Late Cancellation Penalty (%)" ar="نسبة غرامة الإلغاء المتأخر (%)" />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={cancelPenalty}
                      onChange={(e) => setCancelPenalty(Number(e.target.value))}
                    />
                  </label>
                </div>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={rateActive}
                  onChange={(e) => setRateActive(e.target.checked)}
                  style={{ width: 'auto', minHeight: 'auto', margin: 0 }}
                />
                <strong><AdminText en="Plan active for public booking" ar="خطة السعر نشطة ومتاحة للحجز العام" /></strong>
              </label>

              <div className="sp-confirm-actions">
                <button type="button" className="sp-btn" onClick={() => setRateModalOpen(false)}>
                  <AdminText en="Cancel" ar="إلغاء" />
                </button>
                <button type="submit" className="sp-btn primary" disabled={rateSaving}>
                  <AdminText en={rateSaving ? 'Saving…' : 'Save Rate Plan'} ar={rateSaving ? 'جارٍ الحفظ…' : 'حفظ خطة السعر'} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Delete Confirmation Dialog */}
      <AdminConfirmDialog
        open={deleteTarget !== null}
        title={
          <AdminText
            en={`Confirm Delete ${deleteTarget?.kind === 'room' ? 'Room Category' : 'Rate Plan'}?`}
            ar={`تأكيد حذف ${deleteTarget?.kind === 'room' ? 'فئة الغرفة' : 'خطة السعر'}؟`}
          />
        }
        description={
          <AdminText
            en={`Are you sure you want to delete "${deleteTarget?.name}"? If bookings exist, deletion will be blocked to preserve historical guest records.`}
            ar={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟ في حال وجود حجوزات مرتبطة بها، سيتم حظر الحذف لحماية سجلات النزلاء التاريخية.`}
          />
        }
        confirmLabel={<AdminText en={deleting ? 'Deleting…' : 'Confirm Delete'} ar={deleting ? 'جارٍ الحذف…' : 'تأكيد الحذف'} />}
        cancelLabel={<AdminText en="Keep" ar="إلغاء" />}
        tone="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
