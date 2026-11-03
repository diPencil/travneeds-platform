/**
 * TravNeeds Hotels Module — Domain Validation Rules
 *
 * Implements strict, defensive validations for Hotel properties,
 * Room Types, Rate Plans, Inventory Allotments, and Date Ranges.
 */

import type {
  HotelData,
  HotelRoomTypeData,
  HotelRatePlanData,
  HotelRoomInventoryData,
  HotelPropertyType,
  HotelBoardBasis,
  HotelStatus,
} from './types';

export interface ValidationIssue {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
}

export const VALID_PROPERTY_TYPES: readonly HotelPropertyType[] = [
  'HOTEL',
  'RESORT',
  'BOUTIQUE',
  'APARTMENT',
  'VILLA',
  'MOTEL',
  'GUESTHOUSE',
  'BED_AND_BREAKFAST',
];

export const VALID_BOARD_BASES: readonly HotelBoardBasis[] = [
  'ROOM_ONLY',
  'BED_AND_BREAKFAST',
  'HALF_BOARD',
  'FULL_BOARD',
  'ALL_INCLUSIVE',
  'ULTRA_ALL_INCLUSIVE',
];

export const VALID_STATUSES: readonly HotelStatus[] = [
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED',
];

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const ISO2_REGEX = /^[A-Z]{2}$/;
const CODE_REGEX = /^[A-Za-z0-9_-]{2,50}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Rounds a monetary amount to 2 decimal places (Decimal currency safety).
 */
export function roundMoney(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Checks whether a number conforms to 2-decimal money precision.
 */
export function isPricePrecisionValid(amount: number): boolean {
  if (!Number.isFinite(amount) || amount < 0) return false;
  const rounded = roundMoney(amount);
  return Math.abs(amount - rounded) < 0.00001;
}

/**
 * Validates a normalized Hotel property record.
 */
export function validateHotel(data: Partial<HotelData>): ValidationResult {
  const errors: ValidationIssue[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Hotel name must be at least 2 characters', code: 'INVALID_NAME' });
  } else if (data.name.trim().length > 200) {
    errors.push({ field: 'name', message: 'Hotel name must not exceed 200 characters', code: 'NAME_TOO_LONG' });
  }

  if (!data.slug || typeof data.slug !== 'string' || !SLUG_REGEX.test(data.slug)) {
    errors.push({ field: 'slug', message: 'Slug must be URL-safe (lowercase letters, numbers, hyphens)', code: 'INVALID_SLUG' });
  } else if (data.slug.length > 120) {
    errors.push({ field: 'slug', message: 'Slug must not exceed 120 characters', code: 'SLUG_TOO_LONG' });
  }

  if (data.propertyType && !VALID_PROPERTY_TYPES.includes(data.propertyType)) {
    errors.push({ field: 'propertyType', message: `Invalid property type: ${data.propertyType}`, code: 'INVALID_PROPERTY_TYPE' });
  }

  if (data.starRating !== undefined && data.starRating !== null) {
    if (!Number.isInteger(data.starRating) || data.starRating < 1 || data.starRating > 5) {
      errors.push({ field: 'starRating', message: 'Star rating must be an integer between 1 and 5', code: 'INVALID_STAR_RATING' });
    }
  }

  if (!data.countryCode || !ISO2_REGEX.test(data.countryCode.toUpperCase())) {
    errors.push({ field: 'countryCode', message: 'Country code must be a 2-letter uppercase ISO code (e.g. EG)', code: 'INVALID_COUNTRY_CODE' });
  }

  if (!data.city || typeof data.city !== 'string' || data.city.trim().length < 1) {
    errors.push({ field: 'city', message: 'City is required', code: 'MISSING_CITY' });
  }

  if (!data.address || typeof data.address !== 'string' || data.address.trim().length < 1) {
    errors.push({ field: 'address', message: 'Address is required', code: 'MISSING_ADDRESS' });
  }

  if (data.latitude !== undefined && data.latitude !== null) {
    if (typeof data.latitude !== 'number' || data.latitude < -90 || data.latitude > 90) {
      errors.push({ field: 'latitude', message: 'Latitude must be between -90 and +90', code: 'INVALID_LATITUDE' });
    }
  }

  if (data.longitude !== undefined && data.longitude !== null) {
    if (typeof data.longitude !== 'number' || data.longitude < -180 || data.longitude > 180) {
      errors.push({ field: 'longitude', message: 'Longitude must be between -180 and +180', code: 'INVALID_LONGITUDE' });
    }
  }

  if (data.checkInTime && !TIME_REGEX.test(data.checkInTime)) {
    errors.push({ field: 'checkInTime', message: 'Check-in time must be formatted as HH:MM (24-hour)', code: 'INVALID_CHECK_IN_TIME' });
  }

  if (data.checkOutTime && !TIME_REGEX.test(data.checkOutTime)) {
    errors.push({ field: 'checkOutTime', message: 'Check-out time must be formatted as HH:MM (24-hour)', code: 'INVALID_CHECK_OUT_TIME' });
  }

  if (data.status && !VALID_STATUSES.includes(data.status)) {
    errors.push({ field: 'status', message: `Invalid status: ${data.status}`, code: 'INVALID_STATUS' });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a Hotel Room Type record.
 */
export function validateRoomType(data: Partial<HotelRoomTypeData>): ValidationResult {
  const errors: ValidationIssue[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Room type name must be at least 2 characters', code: 'INVALID_ROOM_NAME' });
  }

  if (!data.code || typeof data.code !== 'string' || !CODE_REGEX.test(data.code)) {
    errors.push({ field: 'code', message: 'Room code must be 2-50 alphanumeric characters (hyphens and underscores allowed)', code: 'INVALID_ROOM_CODE' });
  }

  const maxAdults = data.maxAdults ?? 0;
  const maxChildren = data.maxChildren ?? 0;
  const maxOccupancy = data.maxOccupancy ?? 0;

  if (maxAdults < 1) {
    errors.push({ field: 'maxAdults', message: 'Maximum adults must be at least 1', code: 'INVALID_MAX_ADULTS' });
  }

  if (maxChildren < 0) {
    errors.push({ field: 'maxChildren', message: 'Maximum children cannot be negative', code: 'INVALID_MAX_CHILDREN' });
  }

  if (maxOccupancy < maxAdults) {
    errors.push({ field: 'maxOccupancy', message: 'Maximum occupancy cannot be less than maximum adults', code: 'INVALID_MAX_OCCUPANCY' });
  }

  if (maxOccupancy > 30) {
    errors.push({ field: 'maxOccupancy', message: 'Maximum occupancy exceeds allowable threshold (30)', code: 'EXCESSIVE_MAX_OCCUPANCY' });
  }

  if (data.roomSizeSqm !== undefined && data.roomSizeSqm !== null) {
    if (typeof data.roomSizeSqm !== 'number' || data.roomSizeSqm <= 0) {
      errors.push({ field: 'roomSizeSqm', message: 'Room size in sqm must be a positive number', code: 'INVALID_ROOM_SIZE' });
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a Hotel Rate Plan record.
 */
export function validateRatePlan(data: Partial<HotelRatePlanData>): ValidationResult {
  const errors: ValidationIssue[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Rate plan name must be at least 2 characters', code: 'INVALID_RATE_PLAN_NAME' });
  }

  if (!data.code || typeof data.code !== 'string' || !CODE_REGEX.test(data.code)) {
    errors.push({ field: 'code', message: 'Rate plan code must be 2-50 alphanumeric characters', code: 'INVALID_RATE_PLAN_CODE' });
  }

  if (data.boardBasis && !VALID_BOARD_BASES.includes(data.boardBasis)) {
    errors.push({ field: 'boardBasis', message: `Invalid board basis: ${data.boardBasis}`, code: 'INVALID_BOARD_BASIS' });
  }

  if (data.basePrice === undefined || typeof data.basePrice !== 'number' || data.basePrice <= 0) {
    errors.push({ field: 'basePrice', message: 'Base price must be a positive number', code: 'INVALID_BASE_PRICE' });
  } else if (!isPricePrecisionValid(data.basePrice)) {
    errors.push({ field: 'basePrice', message: 'Base price has invalid decimal precision', code: 'INVALID_PRICE_PRECISION' });
  }

  if (!data.currency || data.currency.trim().length !== 3) {
    errors.push({ field: 'currency', message: 'Currency must be a 3-letter code (e.g. USD)', code: 'INVALID_CURRENCY' });
  }

  const minStay = data.minStayNights ?? 1;
  if (minStay < 1) {
    errors.push({ field: 'minStayNights', message: 'Minimum stay must be at least 1 night', code: 'INVALID_MIN_STAY' });
  }

  if (data.maxStayNights !== undefined && data.maxStayNights !== null) {
    if (data.maxStayNights < minStay) {
      errors.push({ field: 'maxStayNights', message: 'Maximum stay cannot be less than minimum stay', code: 'INVALID_MAX_STAY' });
    }
  }

  if (data.cancellationDeadlineDays !== undefined && data.cancellationDeadlineDays !== null) {
    if (data.cancellationDeadlineDays < 0) {
      errors.push({ field: 'cancellationDeadlineDays', message: 'Cancellation deadline days cannot be negative', code: 'INVALID_CANCELLATION_DEADLINE' });
    }
  }

  if (data.cancellationPenaltyPercent !== undefined && data.cancellationPenaltyPercent !== null) {
    if (data.cancellationPenaltyPercent < 0 || data.cancellationPenaltyPercent > 100) {
      errors.push({ field: 'cancellationPenaltyPercent', message: 'Cancellation penalty percentage must be between 0 and 100', code: 'INVALID_PENALTY_PERCENT' });
    }
  }

  return { valid: errors.length === 0, errors };
}

export interface DateRangeResult {
  valid: boolean;
  nights: number;
  dates: string[]; // List of stay nights (e.g. checkIn up to checkOut - 1 day)
  error?: string;
}

/**
 * Validates check-in and check-out dates and produces an enumerated list of night dates.
 */
export function validateDateRange(checkInDate: string, checkOutDate: string): DateRangeResult {
  if (!DATE_REGEX.test(checkInDate)) {
    return { valid: false, nights: 0, dates: [], error: 'Invalid check-in date format (expected YYYY-MM-DD)' };
  }
  if (!DATE_REGEX.test(checkOutDate)) {
    return { valid: false, nights: 0, dates: [], error: 'Invalid check-out date format (expected YYYY-MM-DD)' };
  }

  const checkIn = new Date(`${checkInDate}T00:00:00Z`);
  const checkOut = new Date(`${checkOutDate}T00:00:00Z`);

  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    return { valid: false, nights: 0, dates: [], error: 'Invalid date values' };
  }

  const diffMs = checkOut.getTime() - checkIn.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { valid: false, nights: 0, dates: [], error: 'Check-out date must be strictly after check-in date' };
  }

  if (diffDays > 90) {
    return { valid: false, nights: diffDays, dates: [], error: 'Maximum reservation length is 90 nights' };
  }

  const dates: string[] = [];
  const current = new Date(checkIn);
  while (current.getTime() < checkOut.getTime()) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return { valid: true, nights: diffDays, dates };
}

/**
 * Validates physical inventory allotment boundaries.
 */
export function validateInventoryBoundaries(inv: Partial<HotelRoomInventoryData>): ValidationResult {
  const errors: ValidationIssue[] = [];

  const total = inv.totalRooms ?? 0;
  const booked = inv.bookedRooms ?? 0;
  const held = inv.heldRooms ?? 0;

  if (total < 0) {
    errors.push({ field: 'totalRooms', message: 'Total rooms cannot be negative', code: 'INVALID_TOTAL_ROOMS' });
  }

  if (booked < 0) {
    errors.push({ field: 'bookedRooms', message: 'Booked rooms cannot be negative', code: 'INVALID_BOOKED_ROOMS' });
  }

  if (held < 0) {
    errors.push({ field: 'heldRooms', message: 'Held rooms cannot be negative', code: 'INVALID_HELD_ROOMS' });
  }

  if (booked + held > total) {
    errors.push({
      field: 'totalRooms',
      message: `Overbooked: booked (${booked}) + held (${held}) exceeds total allotment (${total})`,
      code: 'OVERBOOKED',
    });
  }

  return { valid: errors.length === 0, errors };
}

