'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Bed,
  Users,
  Maximize2,
  ShieldCheck,
  Ban,
  Check,
  ChevronDown,
  Info,
  CalendarDays,
} from 'lucide-react';
import { formatPrice, tx, useLocale } from '@/components/locale';

export interface RoomSelectionCardProps {
  roomType: {
    id: string;
    name: string;
    code: string;
    description?: string;
    maxAdults: number;
    maxChildren: number;
    maxOccupancy: number;
    bedConfiguration?: string;
    roomSizeSqm?: number;
    amenities: string[];
    gallery: string[];
  };
  plans: {
    ratePlan: {
      id: string;
      name: string;
      code: string;
      description?: string;
      boardBasis: string;
      isRefundable: boolean;
      cancellationPolicy?: string;
      cancellationDeadlineDays?: number;
      currency: string;
      basePrice: number;
    };
    calculation: {
      checkInDate: string;
      checkOutDate: string;
      nights: number;
      subtotal: number;
      averageNightlyRate: number;
      currency: string;
      isAvailable: boolean;
      unavailableReason?: string;
      nightlyBreakdown: { date: string; finalPrice: number; currency: string }[];
    };
    isEligibleForOccupancy: boolean;
    occupancyError?: string;
  }[];
  selectedPlanId: string | null;
  onSelectPlan: (ratePlanId: string) => void;
}

export function RoomSelectionCard({
  roomType,
  plans,
  selectedPlanId,
  onSelectPlan,
}: RoomSelectionCardProps) {
  const { currency, locale } = useLocale();
  const ar = locale === 'ar';
  const [showNightlyForPlan, setShowNightlyForPlan] = useState<string | null>(null);

  const thumb = roomType.gallery?.[0] || '/egypt-hero.png';

  const boardBasisLabels: Record<string, { en: string; ar: string; es: string; it: string }> = {
    ROOM_ONLY: { en: 'Room Only', ar: 'إقامة بدون وجبات', es: 'Solo habitación', it: 'Solo pernottamento' },
    BED_AND_BREAKFAST: { en: 'Breakfast Included', ar: 'شامل الإفطار', es: 'Desayuno incluido', it: 'Colazione inclusa' },
    HALF_BOARD: { en: 'Half Board (Breakfast + Dinner)', ar: 'إقامة مع وجبتين (إفطار وعشاء)', es: 'Media pensión', it: 'Mezza pensione' },
    FULL_BOARD: { en: 'Full Board (3 Meals)', ar: 'إقامة كاملة (3 وجبات)', es: 'Pensión completa', it: 'Pensione completa' },
    ALL_INCLUSIVE: { en: 'All Inclusive', ar: 'شامل كلياً (وجبات ومشروبات)', es: 'Todo incluido', it: 'All inclusive' },
    ULTRA_ALL_INCLUSIVE: { en: 'Ultra All Inclusive', ar: 'شامل كلياً فائق التميز', es: 'Ultra todo incluido', it: 'Ultra all inclusive' },
  };

  return (
    <article
      style={{
        border: '1.5px solid #e2e8f0',
        borderRadius: '16px',
        background: '#fff',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        marginBottom: '20px',
      }}
    >
      {/* Top Header: Room Category Information */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 220px) minmax(0, 1fr)',
          gap: '20px',
          padding: '18px 20px',
          background: '#fafbfc',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        {/* Room Photo */}
        <div
          style={{
            position: 'relative',
            height: '140px',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#e2e8f0',
          }}
        >
          <Image
            src={thumb}
            alt={roomType.name}
            fill
            sizes="240px"
            style={{ objectFit: 'cover' }}
          />
        </div>

        {/* Room Specs & Capacity */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--sp-blue-deep, #0d2250)' }}>
              {roomType.name}
            </h3>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#64748b',
                background: '#e2e8f0',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              {roomType.code}
            </span>
          </div>

          {/* Specs Badges */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              margin: '8px 0',
              fontSize: '12.5px',
              color: '#475569',
            }}
          >
            {roomType.bedConfiguration && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Bed size={15} color="#2563eb" />
                <b>{roomType.bedConfiguration}</b>
              </span>
            )}
            {roomType.roomSizeSqm && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Maximize2 size={14} color="#64748b" />
                {roomType.roomSizeSqm} m²
              </span>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Users size={14} color="#64748b" />
              {tx(locale, {
                en: `Max ${roomType.maxOccupancy} guests (${roomType.maxAdults} adults, ${roomType.maxChildren} children)`,
                ar: `أقصى سعة ${roomType.maxOccupancy} نزلاء (${roomType.maxAdults} بالغين، ${roomType.maxChildren} أطفال)`,
                es: `Máx ${roomType.maxOccupancy} huéspedes`,
                it: `Max ${roomType.maxOccupancy} ospiti`,
              })}
            </span>
          </div>

          {roomType.description && (
            <p style={{ margin: '4px 0 8px', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              {roomType.description}
            </p>
          )}

          {/* Amenities Pills */}
          {roomType.amenities && roomType.amenities.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {roomType.amenities.map((item) => (
                <span
                  key={item}
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    background: '#fff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '2px 7px',
                    color: '#334155',
                  }}
                >
                  ✓ {item}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Table: Available Rate Plans & Prices */}
      <div style={{ padding: '16px 20px' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: '13.5px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          {tx(locale, {
            en: 'Available Rate Options',
            ar: 'خيارات خطط الأسعار والوجبات المتاحة',
            es: 'Opciones de tarifa disponibles',
            it: 'Opzioni tariffarie disponibili',
          })}
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {plans.map(({ ratePlan, calculation, isEligibleForOccupancy, occupancyError }) => {
            const isSelected = selectedPlanId === ratePlan.id;
            const isAvailable = calculation.isAvailable && isEligibleForOccupancy;
            const board = boardBasisLabels[ratePlan.boardBasis] || { en: ratePlan.boardBasis, ar: ratePlan.boardBasis, es: ratePlan.boardBasis, it: ratePlan.boardBasis };

            return (
              <div
                key={ratePlan.id}
                style={{
                  border: isSelected ? '2px solid #f7951d' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  background: isSelected ? '#fffbf5' : '#fff',
                  transition: 'all 0.15s ease',
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr) auto',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                {/* Plan Info & Board Basis */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: '14.5px', color: 'var(--sp-blue-deep, #0d2250)' }}>
                      {ratePlan.name}
                    </strong>
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: '#1e40af',
                        background: '#dbeafe',
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      {tx(locale, board)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, fontSize: '12px' }}>
                    {ratePlan.isRefundable ? (
                      <span style={{ color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                        <ShieldCheck size={14} />
                        {tx(locale, {
                          en: `Free cancellation up to ${ratePlan.cancellationDeadlineDays ?? 2} days before arrival`,
                          ar: `إلغاء مجاني حتى ${ratePlan.cancellationDeadlineDays ?? 2} أيام قبل الوصول`,
                          es: `Cancelación gratuita hasta ${ratePlan.cancellationDeadlineDays ?? 2} días antes`,
                          it: `Cancellazione gratuita fino a ${ratePlan.cancellationDeadlineDays ?? 2} giorni prima`,
                        })}
                      </span>
                    ) : (
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>
                        {tx(locale, {
                          en: 'Non-refundable',
                          ar: 'غير قابلة للاسترداد',
                          es: 'No reembolsable',
                          it: 'Non rimborsabile',
                        })}
                      </span>
                    )}
                  </div>

                  {!isEligibleForOccupancy && (
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                      ⚠️ {occupancyError}
                    </p>
                  )}

                  {!calculation.isAvailable && (
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                      ⚠️ {calculation.unavailableReason}
                    </p>
                  )}
                </div>

                {/* Price Breakdown */}
                <div style={{ textAlign: ar ? 'left' : 'right' }}>
                  {isAvailable ? (
                    <>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {calculation.nights} {tx(locale, { en: 'nights total', ar: 'ليالٍ إجمالي', es: 'noches', it: 'notti' })}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#0d2250', lineHeight: 1.1 }}>
                        {formatPrice(calculation.subtotal, currency, locale)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>
                        {formatPrice(calculation.averageNightlyRate, currency, locale)} / {tx(locale, { en: 'night avg', ar: 'ليلة متوسط', es: 'noche', it: 'notte' })}
                      </div>
                    </>
                  ) : (
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>
                      {tx(locale, { en: 'Unavailable for dates', ar: 'غير متاح للتواريخ', es: 'No disponible', it: 'Non disponibile' })}
                    </span>
                  )}
                </div>

                {/* Select Button */}
                <div>
                  <button
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => onSelectPlan(ratePlan.id)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      background: isSelected ? '#16a34a' : isAvailable ? '#f7951d' : '#e2e8f0',
                      color: isAvailable ? '#fff' : '#94a3b8',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: isAvailable ? 'pointer' : 'not-allowed',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: isAvailable ? '0 2px 6px rgba(247,149,29,0.2)' : 'none',
                    }}
                  >
                    {isSelected ? (
                      <>
                        <Check size={16} />
                        {tx(locale, { en: 'Selected', ar: 'محددة', es: 'Seleccionada', it: 'Selezionata' })}
                      </>
                    ) : (
                      tx(locale, { en: 'Select Room', ar: 'اختيار الغرفة', es: 'Seleccionar', it: 'Seleziona' })
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

