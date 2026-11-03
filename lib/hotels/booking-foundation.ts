/**
 * TravNeeds Hotels Module — Booking Integration & Inventory Foundation
 *
 * Provides isolated calculation, validation, locking, and snapshot
 * generation for Hotel bookings, designed to integrate seamlessly into
 * the shared Booking Engine without breaking existing Tour bookings.
 */

import crypto from 'node:crypto';
import type {
  HotelData,
  HotelRoomTypeData,
  HotelRatePlanData,
  HotelRoomInventoryData,
  HotelDailyRateData,
  HotelStayCalculation,
  HotelNightlyPriceBreakdown,
  HotelRoomReservationRequest,
  HotelBookingSnapshot,
} from './types';
import {
  validateDateRange,
  roundMoney,
} from './validation';

export interface RoomAvailabilityCheckInput {
  hotel: HotelData;
  roomType: HotelRoomTypeData;
  ratePlan: HotelRatePlanData;
  inventoryRows: HotelRoomInventoryData[];
  dailyRateRows?: HotelDailyRateData[];
  checkInDate: string;
  checkOutDate: string;
  roomsRequested?: number;
}

/**
 * Calculates stay price breakdown and verifies date-based inventory & rate restrictions.
 */
export function calculateStayAvailability(input: RoomAvailabilityCheckInput): HotelStayCalculation {
  const {
    hotel,
    roomType,
    ratePlan,
    inventoryRows,
    dailyRateRows = [],
    checkInDate,
    checkOutDate,
    roomsRequested = 1,
  } = input;

  const range = validateDateRange(checkInDate, checkOutDate);
  if (!range.valid) {
    return {
      checkInDate,
      checkOutDate,
      nights: 0,
      roomTypeId: roomType.id ?? '',
      ratePlanId: ratePlan.id ?? '',
      roomTypeName: roomType.name,
      ratePlanName: ratePlan.name,
      boardBasis: ratePlan.boardBasis,
      nightlyBreakdown: [],
      subtotal: 0,
      averageNightlyRate: 0,
      currency: ratePlan.currency,
      isAvailable: false,
      unavailableReason: range.error,
    };
  }

  // Min stay rule
  if (range.nights < ratePlan.minStayNights) {
    return {
      checkInDate,
      checkOutDate,
      nights: range.nights,
      roomTypeId: roomType.id ?? '',
      ratePlanId: ratePlan.id ?? '',
      roomTypeName: roomType.name,
      ratePlanName: ratePlan.name,
      boardBasis: ratePlan.boardBasis,
      nightlyBreakdown: [],
      subtotal: 0,
      averageNightlyRate: 0,
      currency: ratePlan.currency,
      isAvailable: false,
      unavailableReason: `Minimum stay for this rate plan is ${ratePlan.minStayNights} nights`,
    };
  }

  // Max stay rule
  if (ratePlan.maxStayNights && range.nights > ratePlan.maxStayNights) {
    return {
      checkInDate,
      checkOutDate,
      nights: range.nights,
      roomTypeId: roomType.id ?? '',
      ratePlanId: ratePlan.id ?? '',
      roomTypeName: roomType.name,
      ratePlanName: ratePlan.name,
      boardBasis: ratePlan.boardBasis,
      nightlyBreakdown: [],
      subtotal: 0,
      averageNightlyRate: 0,
      currency: ratePlan.currency,
      isAvailable: false,
      unavailableReason: `Maximum stay for this rate plan is ${ratePlan.maxStayNights} nights`,
    };
  }

  const inventoryByDate = new Map<string, HotelRoomInventoryData>();
  for (const inv of inventoryRows) {
    inventoryByDate.set(inv.date, inv);
  }

  const dailyRatesByDate = new Map<string, HotelDailyRateData>();
  for (const dr of dailyRateRows) {
    dailyRatesByDate.set(dr.date, dr);
  }

  const nightlyBreakdown: HotelNightlyPriceBreakdown[] = [];
  let subtotal = 0;

  for (let i = 0; i < range.dates.length; i++) {
    const dateStr = range.dates[i];
    const isArrivalDay = i === 0;
    const inv = inventoryByDate.get(dateStr);

    // If no inventory row exists, default allotment is 0 (closed)
    if (!inv) {
      return {
        checkInDate,
        checkOutDate,
        nights: range.nights,
        roomTypeId: roomType.id ?? '',
        ratePlanId: ratePlan.id ?? '',
        roomTypeName: roomType.name,
        ratePlanName: ratePlan.name,
        boardBasis: ratePlan.boardBasis,
        nightlyBreakdown: [],
        subtotal: 0,
        averageNightlyRate: 0,
        currency: ratePlan.currency,
        isAvailable: false,
        unavailableReason: `No room inventory configured for ${dateStr}`,
      };
    }

    // Stop sale check
    if (inv.stopSale) {
      return {
        checkInDate,
        checkOutDate,
        nights: range.nights,
        roomTypeId: roomType.id ?? '',
        ratePlanId: ratePlan.id ?? '',
        roomTypeName: roomType.name,
        ratePlanName: ratePlan.name,
        boardBasis: ratePlan.boardBasis,
        nightlyBreakdown: [],
        subtotal: 0,
        averageNightlyRate: 0,
        currency: ratePlan.currency,
        isAvailable: false,
        unavailableReason: `Rooms are marked as Stop-Sale on ${dateStr}`,
      };
    }

    // Closed to arrival check
    if (isArrivalDay && inv.closedToArrival) {
      return {
        checkInDate,
        checkOutDate,
        nights: range.nights,
        roomTypeId: roomType.id ?? '',
        ratePlanId: ratePlan.id ?? '',
        roomTypeName: roomType.name,
        ratePlanName: ratePlan.name,
        boardBasis: ratePlan.boardBasis,
        nightlyBreakdown: [],
        subtotal: 0,
        averageNightlyRate: 0,
        currency: ratePlan.currency,
        isAvailable: false,
        unavailableReason: `Check-in is not permitted on ${dateStr} (Closed to Arrival)`,
      };
    }

    // Available inventory calculation
    const available = inv.totalRooms - (inv.bookedRooms + inv.heldRooms);
    if (available < roomsRequested) {
      return {
        checkInDate,
        checkOutDate,
        nights: range.nights,
        roomTypeId: roomType.id ?? '',
        ratePlanId: ratePlan.id ?? '',
        roomTypeName: roomType.name,
        ratePlanName: ratePlan.name,
        boardBasis: ratePlan.boardBasis,
        nightlyBreakdown: [],
        subtotal: 0,
        averageNightlyRate: 0,
        currency: ratePlan.currency,
        isAvailable: false,
        unavailableReason: `Insufficient rooms on ${dateStr} (${available} available, ${roomsRequested} requested)`,
      };
    }

    // Rate plan daily override or base price
    const dailyRate = dailyRatesByDate.get(dateStr);
    if (dailyRate?.stopSale) {
      return {
        checkInDate,
        checkOutDate,
        nights: range.nights,
        roomTypeId: roomType.id ?? '',
        ratePlanId: ratePlan.id ?? '',
        roomTypeName: roomType.name,
        ratePlanName: ratePlan.name,
        boardBasis: ratePlan.boardBasis,
        nightlyBreakdown: [],
        subtotal: 0,
        averageNightlyRate: 0,
        currency: ratePlan.currency,
        isAvailable: false,
        unavailableReason: `Rate plan is unavailable on ${dateStr}`,
      };
    }

    const price = dailyRate ? dailyRate.price : ratePlan.basePrice;
    nightlyBreakdown.push({
      date: dateStr,
      basePrice: ratePlan.basePrice,
      finalPrice: price,
      currency: ratePlan.currency,
    });
    subtotal = roundMoney(subtotal + price);
  }

  const averageNightlyRate = range.nights > 0 ? roundMoney(subtotal / range.nights) : 0;

  return {
    checkInDate,
    checkOutDate,
    nights: range.nights,
    roomTypeId: roomType.id ?? '',
    ratePlanId: ratePlan.id ?? '',
    roomTypeName: roomType.name,
    ratePlanName: ratePlan.name,
    boardBasis: ratePlan.boardBasis,
    nightlyBreakdown,
    subtotal,
    averageNightlyRate,
    currency: ratePlan.currency,
    isAvailable: true,
  };
}

/**
 * Validates guest occupancy against room type capacity rules.
 */
export function validateOccupancy(
  roomType: HotelRoomTypeData,
  adults: number,
  children: number,
): { valid: boolean; message?: string } {
  if (adults < 1) {
    return { valid: false, message: 'At least 1 adult is required per room' };
  }
  if (adults > roomType.maxAdults) {
    return { valid: false, message: `Room capacity exceeded: maximum ${roomType.maxAdults} adults allowed` };
  }
  if (children > roomType.maxChildren) {
    return { valid: false, message: `Room capacity exceeded: maximum ${roomType.maxChildren} children allowed` };
  }
  const total = adults + children;
  if (total > roomType.maxOccupancy) {
    return { valid: false, message: `Total occupancy exceeded: maximum ${roomType.maxOccupancy} guests allowed` };
  }
  return { valid: true };
}

export interface InventoryLockToken {
  lockToken: string;
  roomTypeId: string;
  ratePlanId?: string;
  checkInDate: string;
  checkOutDate: string;
  quantity: number;
  expiresAt: Date;
  isConfirmed: boolean;
}

/**
 * Creates an in-memory lock specification to reserve inventory during checkout.
 * Default TTL is 15 minutes.
 */
export function createInventoryLockToken(
  roomTypeId: string,
  checkInDate: string,
  checkOutDate: string,
  quantity: number = 1,
  ttlMinutes: number = 15,
  ratePlanId?: string,
): InventoryLockToken {
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  return {
    lockToken: token,
    roomTypeId,
    ratePlanId,
    checkInDate,
    checkOutDate,
    quantity,
    expiresAt,
    isConfirmed: false,
  };
}

/**
 * Evaluates whether an inventory lock has expired.
 */
export function isLockExpired(lock: InventoryLockToken, now: Date = new Date()): boolean {
  return now.getTime() > lock.expiresAt.getTime();
}

export interface CancellationPenaltyResult {
  isRefundable: boolean;
  isFreeCancellation: boolean;
  penaltyPercent: number;
  penaltyAmount: number;
  refundAmount: number;
  reason: string;
}

/**
 * Calculates cancellation fee and refund amounts based on rate plan rules and cancellation time.
 */
export function calculateCancellationPenalty(
  ratePlan: HotelRatePlanData,
  totalPrice: number,
  checkInDate: string,
  cancellationDate: Date = new Date(),
): CancellationPenaltyResult {
  if (!ratePlan.isRefundable) {
    return {
      isRefundable: false,
      isFreeCancellation: false,
      penaltyPercent: 100,
      penaltyAmount: totalPrice,
      refundAmount: 0,
      reason: 'Non-refundable rate plan',
    };
  }

  const checkIn = new Date(`${checkInDate}T00:00:00Z`);
  const diffMs = checkIn.getTime() - cancellationDate.getTime();
  const daysBeforeCheckIn = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const deadlineDays = ratePlan.cancellationDeadlineDays ?? 2;

  if (daysBeforeCheckIn >= deadlineDays) {
    return {
      isRefundable: true,
      isFreeCancellation: true,
      penaltyPercent: 0,
      penaltyAmount: 0,
      refundAmount: totalPrice,
      reason: `Cancelled ${daysBeforeCheckIn} days before check-in (deadline was ${deadlineDays} days)`,
    };
  }

  const penaltyPercent = ratePlan.cancellationPenaltyPercent ?? 100;
  const penaltyAmount = roundMoney((totalPrice * penaltyPercent) / 100);
  const refundAmount = roundMoney(totalPrice - penaltyAmount);

  return {
    isRefundable: true,
    isFreeCancellation: false,
    penaltyPercent,
    penaltyAmount,
    refundAmount,
    reason: `Late cancellation (${daysBeforeCheckIn} days before check-in, deadline was ${deadlineDays} days)`,
  };
}

export interface CreateBookingSnapshotInput {
  hotel: HotelData;
  checkInDate: string;
  checkOutDate: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  specialRequests?: string;
  currency?: string;
  roomCalculations: {
    calculation: HotelStayCalculation;
    request: HotelRoomReservationRequest;
  }[];
}

/**
 * Builds an immutable commercial snapshot for a Hotel booking.
 * Once created, this data represents the frozen legal agreement,
 * immune to future room renaming or price changes.
 */
export function createHotelBookingSnapshot(input: CreateBookingSnapshotInput): HotelBookingSnapshot {
  const {
    hotel,
    checkInDate,
    checkOutDate,
    guestName,
    guestEmail,
    guestPhone,
    specialRequests,
    currency = 'USD',
    roomCalculations,
  } = input;

  const range = validateDateRange(checkInDate, checkOutDate);
  const nights = range.valid ? range.nights : 1;

  let totalPrice = 0;
  const rooms = roomCalculations.map(({ calculation, request }) => {
    totalPrice = roundMoney(totalPrice + calculation.subtotal);
    return {
      roomTypeId: calculation.roomTypeId,
      ratePlanId: calculation.ratePlanId,
      roomTypeName: calculation.roomTypeName,
      ratePlanName: calculation.ratePlanName,
      boardBasis: calculation.boardBasis,
      adults: request.adults,
      children: request.children,
      childAges: request.childAges?.join(','),
      nightlyBreakdown: calculation.nightlyBreakdown,
      lineTotal: calculation.subtotal,
    };
  });

  return {
    hotelId: hotel.id ?? hotel.slug,
    hotelName: hotel.name,
    checkInDate,
    checkOutDate,
    nights,
    guestName,
    guestEmail,
    guestPhone,
    specialRequests,
    rooms,
    totalPrice,
    currency,
  };
}

