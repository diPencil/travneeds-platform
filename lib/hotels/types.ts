/**
 * TravNeeds Hotels Module — Domain Type Contracts
 *
 * Defines the normalized interfaces, enums, and data transfer types
 * for Hotel properties, Room Types, Rate Plans, Inventory Allotments,
 * and Booking Snapshots.
 *
 * Fully supports canonical English content with localized overlays (EN, AR, ES, IT).
 */

import type { Locale } from '@/lib/locale-config';

export type HotelPropertyType =
  | 'HOTEL'
  | 'RESORT'
  | 'BOUTIQUE'
  | 'APARTMENT'
  | 'VILLA'
  | 'MOTEL'
  | 'GUESTHOUSE'
  | 'BED_AND_BREAKFAST';

export type HotelStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type HotelBoardBasis =
  | 'ROOM_ONLY'
  | 'BED_AND_BREAKFAST'
  | 'HALF_BOARD'
  | 'FULL_BOARD'
  | 'ALL_INCLUSIVE'
  | 'ULTRA_ALL_INCLUSIVE';

export type HotelBookingStatus =
  | 'HOLD'
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

/** Multilingual localized overlay for text fields across supported locales. */
export type HotelTranslations = Partial<Record<Locale, Record<string, string>>>;

export interface HotelPolicyData {
  id?: string;
  hotelId?: string;
  checkInAge: number;
  checkInInstructions?: string;
  childAgeMax: number;
  infantAgeMax: number;
  allowExtraBeds: boolean;
  extraBedPricePerNight?: number;
  allowCribs: boolean;
  cribPricePerNight?: number;
  petsAllowed: boolean;
  petFeePerStay?: number;
  cancellationSummary?: string;
  paymentPolicy?: string;
  depositRequired: boolean;
  depositPercentage?: number;
  customPolicies?: Record<string, string>;
  translations?: HotelTranslations;
}

export interface HotelData {
  id?: string;
  slug: string;
  name: string;
  nameAr?: string;
  description: string;
  propertyType: HotelPropertyType;
  starRating?: number; // 1 to 5
  countryCode: string; // 2-letter ISO (e.g. "EG")
  city: string;
  address: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  checkInTime: string; // e.g. "15:00"
  checkOutTime: string; // e.g. "11:00"
  coverImage?: string;
  gallery: string[];
  amenities: string[];
  seoTitle?: string;
  seoDescription?: string;
  status: HotelStatus;
  translations?: HotelTranslations;
  policy?: HotelPolicyData;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface HotelRoomTypeData {
  id?: string;
  hotelId: string;
  name: string;
  code: string; // e.g. "DLX-KNG"
  description?: string;
  maxAdults: number;
  maxChildren: number;
  maxOccupancy: number;
  bedConfiguration?: string; // e.g. "1 King Bed"
  roomSizeSqm?: number;
  amenities: string[];
  gallery: string[];
  isActive: boolean;
  sortOrder?: number;
  translations?: HotelTranslations;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface HotelRatePlanData {
  id?: string;
  roomTypeId: string;
  name: string;
  code: string; // e.g. "FLEX-BB"
  description?: string;
  boardBasis: HotelBoardBasis;
  isRefundable: boolean;
  cancellationPolicy?: string;
  cancellationDeadlineDays?: number; // Days before arrival
  cancellationPenaltyPercent?: number; // 0.00 to 100.00
  currency: string; // "USD", "EUR", "EGP"
  basePrice: number;
  minStayNights: number;
  maxStayNights?: number;
  isActive: boolean;
  translations?: HotelTranslations;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface HotelRoomInventoryData {
  id?: string;
  roomTypeId: string;
  date: string; // YYYY-MM-DD
  totalRooms: number;
  bookedRooms: number;
  heldRooms: number;
  stopSale: boolean;
  closedToArrival: boolean;
  closedToDeparture: boolean;
}

export interface HotelDailyRateData {
  id?: string;
  ratePlanId: string;
  date: string; // YYYY-MM-DD
  price: number;
  stopSale: boolean;
  closedToArrival: boolean;
  closedToDeparture: boolean;
  minStay?: number;
}

export interface HotelNightlyPriceBreakdown {
  date: string; // YYYY-MM-DD
  basePrice: number;
  finalPrice: number;
  currency: string;
}

export interface HotelStayCalculation {
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  roomTypeId: string;
  ratePlanId: string;
  roomTypeName: string;
  ratePlanName: string;
  boardBasis: HotelBoardBasis;
  nightlyBreakdown: HotelNightlyPriceBreakdown[];
  subtotal: number;
  averageNightlyRate: number;
  currency: string;
  isAvailable: boolean;
  unavailableReason?: string;
}

export interface HotelReservationGuest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialRequests?: string;
}

export interface HotelRoomReservationRequest {
  roomTypeId: string;
  ratePlanId: string;
  adults: number;
  children: number;
  childAges?: number[];
}

export interface HotelBookingSnapshot {
  hotelId: string;
  hotelName: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  specialRequests?: string;
  rooms: {
    roomTypeId: string;
    ratePlanId: string;
    roomTypeName: string;
    ratePlanName: string;
    boardBasis: HotelBoardBasis;
    adults: number;
    children: number;
    childAges?: string;
    nightlyBreakdown: HotelNightlyPriceBreakdown[];
    lineTotal: number;
  }[];
  totalPrice: number;
  currency: string;
}

