import 'server-only';

import { db } from './db';
import type { Prisma, HotelPropertyType, HotelStatus, HotelBoardBasis } from '@prisma/client';
import type {
  HotelData,
  HotelPolicyData,
  HotelRoomTypeData,
  HotelRatePlanData,
  HotelRoomInventoryData,
  HotelDailyRateData,
} from '@/lib/hotels/types';
import {
  validateHotel,
  validateRoomType,
  validateRatePlan,
  validateDateRange,
  roundMoney,
} from '@/lib/hotels/validation';
import {
  calculateStayAvailability,
  validateOccupancy,
} from '@/lib/hotels/booking-foundation';

/**
 * Safely converts Prisma Decimal or nullable numeric fields to a standard JavaScript number.
 */
export function decimalToNumber(val: unknown): number | undefined {
  if (val === null || val === undefined) return undefined;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && val !== null && 'toNumber' in val && typeof (val as any).toNumber === 'function') {
    return (val as any).toNumber();
  }
  const parsed = Number(val);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export interface ListHotelsParams {
  query?: string;
  status?: string;
  propertyType?: string;
  starRating?: number;
  city?: string;
  page?: number;
  limit?: number;
}

/**
 * Lists hotels with filtering, search, and pagination.
 */
export async function listHotels(params: ListHotelsParams = {}) {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Prisma.HotelWhereInput = {};

  if (params.status && params.status !== 'all') {
    where.status = params.status.toUpperCase() as HotelStatus;
  }

  if (params.propertyType && params.propertyType !== 'all') {
    where.propertyType = params.propertyType.toUpperCase() as HotelPropertyType;
  }

  if (params.starRating && params.starRating > 0) {
    where.starRating = params.starRating;
  }

  if (params.city && params.city.trim()) {
    where.city = { contains: params.city.trim() };
  }

  if (params.query && params.query.trim()) {
    const q = params.query.trim();
    where.OR = [
      { name: { contains: q } },
      { nameAr: { contains: q } },
      { slug: { contains: q } },
      { city: { contains: q } },
      { address: { contains: q } },
    ];
  }

  const [total, items, statsGroup] = await Promise.all([
    db.hotel.count({ where }),
    db.hotel.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            roomTypes: true,
            bookings: true,
          },
        },
        roomTypes: {
          where: { isActive: true },
          select: {
            ratePlans: {
              where: { isActive: true },
              select: {
                basePrice: true,
                currency: true,
              },
            },
          },
        },
      },
    }),
    db.hotel.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
  ]);

  const stats = {
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
  };

  for (const g of statsGroup) {
    stats.total += g._count.id;
    if (g.status === 'PUBLISHED') stats.published = g._count.id;
    if (g.status === 'DRAFT') stats.draft = g._count.id;
    if (g.status === 'ARCHIVED') stats.archived = g._count.id;
  }

  const serialized = items.map((h) => {
    let startingPrice: number | undefined;
    let currency = 'USD';
    for (const rt of (h as any).roomTypes || []) {
      for (const rp of rt.ratePlans || []) {
        const p = decimalToNumber(rp.basePrice);
        if (p !== undefined && (startingPrice === undefined || p < startingPrice)) {
          startingPrice = p;
          currency = rp.currency || 'USD';
        }
      }
    }

    return {
      id: h.id,
      slug: h.slug,
      name: h.name,
      nameAr: h.nameAr ?? undefined,
      description: h.description,
      propertyType: h.propertyType,
      starRating: h.starRating ?? undefined,
      countryCode: h.countryCode,
      city: h.city,
      address: h.address,
      postalCode: h.postalCode ?? undefined,
      latitude: decimalToNumber(h.latitude),
      longitude: decimalToNumber(h.longitude),
      phone: h.phone ?? undefined,
      email: h.email ?? undefined,
      website: h.website ?? undefined,
      checkInTime: h.checkInTime,
      checkOutTime: h.checkOutTime,
      coverImage: h.coverImage ?? undefined,
      gallery: JSON.parse(h.gallery || '[]'),
      amenities: JSON.parse(h.amenities || '[]'),
      seoTitle: h.seoTitle ?? undefined,
      seoDescription: h.seoDescription ?? undefined,
      translations: h.translations ? JSON.parse(h.translations) : undefined,
      status: h.status,
      createdAt: h.createdAt.toISOString(),
      updatedAt: h.updatedAt.toISOString(),
      roomTypeCount: h._count.roomTypes,
      bookingCount: h._count.bookings,
      startingPrice,
      currency,
    };
  });

  return {
    items: serialized,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    stats,
  };
}

/**
 * Retrieves a single hotel with its policy, room types, and rate plans.
 */
export async function getHotelById(id: string) {
  const h = await db.hotel.findUnique({
    where: { id },
    include: {
      policy: true,
      roomTypes: {
        orderBy: { sortOrder: 'asc' },
        include: {
          ratePlans: {
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: {
              inventory: true,
              bookingRooms: true,
            },
          },
        },
      },
      _count: {
        select: {
          bookings: true,
        },
      },
    },
  });

  if (!h) return null;

  return {
    id: h.id,
    slug: h.slug,
    name: h.name,
    nameAr: h.nameAr ?? undefined,
    description: h.description,
    propertyType: h.propertyType,
    starRating: h.starRating ?? undefined,
    countryCode: h.countryCode,
    city: h.city,
    address: h.address,
    postalCode: h.postalCode ?? undefined,
    latitude: decimalToNumber(h.latitude),
    longitude: decimalToNumber(h.longitude),
    phone: h.phone ?? undefined,
    email: h.email ?? undefined,
    website: h.website ?? undefined,
    checkInTime: h.checkInTime,
    checkOutTime: h.checkOutTime,
    coverImage: h.coverImage ?? undefined,
    gallery: JSON.parse(h.gallery || '[]'),
    amenities: JSON.parse(h.amenities || '[]'),
    seoTitle: h.seoTitle ?? undefined,
    seoDescription: h.seoDescription ?? undefined,
    translations: h.translations ? JSON.parse(h.translations) : undefined,
    status: h.status,
    createdAt: h.createdAt.toISOString(),
    updatedAt: h.updatedAt.toISOString(),
    bookingCount: h._count.bookings,
    policy: h.policy
      ? {
          id: h.policy.id,
          hotelId: h.policy.hotelId,
          checkInAge: h.policy.checkInAge,
          checkInInstructions: h.policy.checkInInstructions ?? undefined,
          childAgeMax: h.policy.childAgeMax,
          infantAgeMax: h.policy.infantAgeMax,
          allowExtraBeds: h.policy.allowExtraBeds,
          extraBedPricePerNight: decimalToNumber(h.policy.extraBedPricePerNight),
          allowCribs: h.policy.allowCribs,
          cribPricePerNight: decimalToNumber(h.policy.cribPricePerNight),
          petsAllowed: h.policy.petsAllowed,
          petFeePerStay: decimalToNumber(h.policy.petFeePerStay),
          cancellationSummary: h.policy.cancellationSummary ?? undefined,
          paymentPolicy: h.policy.paymentPolicy ?? undefined,
          depositRequired: h.policy.depositRequired,
          depositPercentage: decimalToNumber(h.policy.depositPercentage),
          customPolicies: h.policy.customPolicies ? JSON.parse(h.policy.customPolicies) : undefined,
          translations: h.policy.translations ? JSON.parse(h.policy.translations) : undefined,
        }
      : null,
    roomTypes: h.roomTypes.map((rt) => ({
      id: rt.id,
      hotelId: rt.hotelId,
      name: rt.name,
      code: rt.code,
      description: rt.description ?? undefined,
      maxAdults: rt.maxAdults,
      maxChildren: rt.maxChildren,
      maxOccupancy: rt.maxOccupancy,
      bedConfiguration: rt.bedConfiguration ?? undefined,
      roomSizeSqm: decimalToNumber(rt.roomSizeSqm),
      amenities: JSON.parse(rt.amenities || '[]'),
      gallery: JSON.parse(rt.gallery || '[]'),
      isActive: rt.isActive,
      sortOrder: rt.sortOrder,
      translations: rt.translations ? JSON.parse(rt.translations) : undefined,
      inventoryCount: rt._count.inventory,
      bookingCount: rt._count.bookingRooms,
      ratePlans: rt.ratePlans.map((rp) => ({
        id: rp.id,
        roomTypeId: rp.roomTypeId,
        name: rp.name,
        code: rp.code,
        description: rp.description ?? undefined,
        boardBasis: rp.boardBasis,
        isRefundable: rp.isRefundable,
        cancellationPolicy: rp.cancellationPolicy ?? undefined,
        cancellationDeadlineDays: rp.cancellationDeadlineDays ?? undefined,
        cancellationPenaltyPercent: decimalToNumber(rp.cancellationPenaltyPercent),
        currency: rp.currency,
        basePrice: decimalToNumber(rp.basePrice) ?? 0,
        minStayNights: rp.minStayNights,
        maxStayNights: rp.maxStayNights ?? undefined,
        isActive: rp.isActive,
        translations: rp.translations ? JSON.parse(rp.translations) : undefined,
      })),
    })),
  };
}

/**
 * Retrieves a single hotel by slug with its policy, active room types, and rate plans.
 * When publishedOnly is true, non-published hotels return null and inactive rooms/rates are excluded.
 */
export async function getHotelBySlug(slug: string, publishedOnly: boolean = false) {
  const h = await db.hotel.findUnique({
    where: { slug },
    include: {
      policy: true,
      roomTypes: {
        where: publishedOnly ? { isActive: true } : undefined,
        orderBy: { sortOrder: 'asc' },
        include: {
          ratePlans: {
            where: publishedOnly ? { isActive: true } : undefined,
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: {
              inventory: true,
              bookingRooms: true,
            },
          },
        },
      },
      _count: {
        select: {
          bookings: true,
        },
      },
    },
  });

  if (!h) return null;
  if (publishedOnly && h.status !== 'PUBLISHED') return null;

  return {
    id: h.id,
    slug: h.slug,
    name: h.name,
    nameAr: h.nameAr ?? undefined,
    description: h.description,
    propertyType: h.propertyType,
    starRating: h.starRating ?? undefined,
    countryCode: h.countryCode,
    city: h.city,
    address: h.address,
    postalCode: h.postalCode ?? undefined,
    latitude: decimalToNumber(h.latitude),
    longitude: decimalToNumber(h.longitude),
    phone: h.phone ?? undefined,
    email: h.email ?? undefined,
    website: h.website ?? undefined,
    checkInTime: h.checkInTime,
    checkOutTime: h.checkOutTime,
    coverImage: h.coverImage ?? undefined,
    gallery: JSON.parse(h.gallery || '[]'),
    amenities: JSON.parse(h.amenities || '[]'),
    seoTitle: h.seoTitle ?? undefined,
    seoDescription: h.seoDescription ?? undefined,
    translations: h.translations ? JSON.parse(h.translations) : undefined,
    status: h.status,
    createdAt: h.createdAt.toISOString(),
    updatedAt: h.updatedAt.toISOString(),
    bookingCount: h._count.bookings,
    policy: h.policy
      ? {
          id: h.policy.id,
          hotelId: h.policy.hotelId,
          checkInAge: h.policy.checkInAge,
          checkInInstructions: h.policy.checkInInstructions ?? undefined,
          childAgeMax: h.policy.childAgeMax,
          infantAgeMax: h.policy.infantAgeMax,
          allowExtraBeds: h.policy.allowExtraBeds,
          extraBedPricePerNight: decimalToNumber(h.policy.extraBedPricePerNight),
          allowCribs: h.policy.allowCribs,
          cribPricePerNight: decimalToNumber(h.policy.cribPricePerNight),
          petsAllowed: h.policy.petsAllowed,
          petFeePerStay: decimalToNumber(h.policy.petFeePerStay),
          cancellationSummary: h.policy.cancellationSummary ?? undefined,
          paymentPolicy: h.policy.paymentPolicy ?? undefined,
          depositRequired: h.policy.depositRequired,
          depositPercentage: decimalToNumber(h.policy.depositPercentage),
          customPolicies: h.policy.customPolicies ? JSON.parse(h.policy.customPolicies) : undefined,
          translations: h.policy.translations ? JSON.parse(h.policy.translations) : undefined,
        }
      : null,
    roomTypes: h.roomTypes.map((rt) => ({
      id: rt.id,
      hotelId: rt.hotelId,
      name: rt.name,
      code: rt.code,
      description: rt.description ?? undefined,
      maxAdults: rt.maxAdults,
      maxChildren: rt.maxChildren,
      maxOccupancy: rt.maxOccupancy,
      bedConfiguration: rt.bedConfiguration ?? undefined,
      roomSizeSqm: decimalToNumber(rt.roomSizeSqm),
      amenities: JSON.parse(rt.amenities || '[]'),
      gallery: JSON.parse(rt.gallery || '[]'),
      isActive: rt.isActive,
      sortOrder: rt.sortOrder,
      translations: rt.translations ? JSON.parse(rt.translations) : undefined,
      inventoryCount: rt._count.inventory,
      bookingCount: rt._count.bookingRooms,
      ratePlans: rt.ratePlans.map((rp) => ({
        id: rp.id,
        roomTypeId: rp.roomTypeId,
        name: rp.name,
        code: rp.code,
        description: rp.description ?? undefined,
        boardBasis: rp.boardBasis,
        isRefundable: rp.isRefundable,
        cancellationPolicy: rp.cancellationPolicy ?? undefined,
        cancellationDeadlineDays: rp.cancellationDeadlineDays ?? undefined,
        cancellationPenaltyPercent: decimalToNumber(rp.cancellationPenaltyPercent),
        currency: rp.currency,
        basePrice: decimalToNumber(rp.basePrice) ?? 0,
        minStayNights: rp.minStayNights,
        maxStayNights: rp.maxStayNights ?? undefined,
        isActive: rp.isActive,
        translations: rp.translations ? JSON.parse(rp.translations) : undefined,
      })),
    })),
  };
}

export interface HotelStayQuoteInput {
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  adults?: number;
  children?: number;
  roomsRequested?: number;
}

/**
 * Calculates live availability and stay prices for all rooms and rate plans under a published hotel.
 */
export async function getHotelStayQuote(slug: string, input: HotelStayQuoteInput) {
  const { checkInDate, checkOutDate, adults = 2, children = 0, roomsRequested = 1 } = input;
  const hotel = await getHotelBySlug(slug, true);
  if (!hotel) {
    throw new Error('Hotel not found or not published.');
  }

  const range = validateDateRange(checkInDate, checkOutDate);
  if (!range.valid) {
    throw new Error(range.error || 'Invalid stay dates.');
  }

  const start = new Date(`${checkInDate}T00:00:00Z`);
  const end = new Date(`${checkOutDate}T23:59:59Z`);

  const roomTypeIds = hotel.roomTypes.map((rt) => rt.id);
  const ratePlanIds = hotel.roomTypes.flatMap((rt) => rt.ratePlans.map((rp) => rp.id));

  const [inventoryRows, dailyRateRows] = await Promise.all([
    db.hotelRoomInventory.findMany({
      where: {
        roomTypeId: { in: roomTypeIds },
        date: { gte: start, lte: end },
      },
    }),
    db.hotelDailyRate.findMany({
      where: {
        ratePlanId: { in: ratePlanIds },
        date: { gte: start, lte: end },
      },
    }),
  ]);

  const inventoryByRoom = new Map<string, any[]>();
  for (const inv of inventoryRows) {
    const arr = inventoryByRoom.get(inv.roomTypeId) || [];
    arr.push({
      id: inv.id,
      roomTypeId: inv.roomTypeId,
      date: inv.date.toISOString().slice(0, 10),
      totalRooms: inv.totalRooms,
      bookedRooms: inv.bookedRooms,
      heldRooms: inv.heldRooms,
      stopSale: inv.stopSale,
      closedToArrival: inv.closedToArrival,
      closedToDeparture: inv.closedToDeparture,
    });
    inventoryByRoom.set(inv.roomTypeId, arr);
  }

  const dailyByRatePlan = new Map<string, any[]>();
  for (const dr of dailyRateRows) {
    const arr = dailyByRatePlan.get(dr.ratePlanId) || [];
    arr.push({
      id: dr.id,
      ratePlanId: dr.ratePlanId,
      date: dr.date.toISOString().slice(0, 10),
      price: decimalToNumber(dr.price) ?? 0,
      stopSale: dr.stopSale,
      closedToArrival: dr.closedToArrival,
      closedToDeparture: dr.closedToDeparture,
      minStay: dr.minStay ?? undefined,
    });
    dailyByRatePlan.set(dr.ratePlanId, arr);
  }

  let lowestPrice: number | undefined;
  let quoteCurrency = 'USD';

  const roomResults = hotel.roomTypes.map((rt) => {
    const occupancyCheck = validateOccupancy(rt as any, adults, children);
    const roomInventory = inventoryByRoom.get(rt.id) || [];

    const availablePlans = rt.ratePlans.map((rp) => {
      const rpDaily = dailyByRatePlan.get(rp.id) || [];
      const calc = calculateStayAvailability({
        hotel: hotel as any,
        roomType: rt as any,
        ratePlan: rp as any,
        inventoryRows: roomInventory,
        dailyRateRows: rpDaily,
        checkInDate,
        checkOutDate,
        roomsRequested,
      });

      if (calc.isAvailable && occupancyCheck.valid) {
        if (lowestPrice === undefined || calc.subtotal < lowestPrice) {
          lowestPrice = calc.subtotal;
          quoteCurrency = calc.currency;
        }
      }

      return {
        ratePlan: rp,
        calculation: calc,
        isEligibleForOccupancy: occupancyCheck.valid,
        occupancyError: occupancyCheck.message,
      };
    });

    const isAnyPlanAvailable = availablePlans.some((p) => p.calculation.isAvailable && occupancyCheck.valid);

    return {
      roomType: rt,
      isEligibleForOccupancy: occupancyCheck.valid,
      occupancyError: occupancyCheck.message,
      isAvailable: isAnyPlanAvailable,
      plans: availablePlans,
    };
  });

  return {
    hotelId: hotel.id,
    hotelSlug: hotel.slug,
    hotelName: hotel.name,
    checkInDate,
    checkOutDate,
    nights: range.nights,
    adults,
    children,
    roomsRequested,
    lowestStayPrice: lowestPrice,
    currency: quoteCurrency,
    roomTypes: roomResults,
  };
}

/**
 * Creates a new hotel and default policy record in a transaction.
 */
export async function createHotel(input: {
  hotel: Partial<HotelData>;
  policy?: Partial<HotelPolicyData>;
}) {
  const validation = validateHotel(input.hotel);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.map((e) => e.message).join(', ')}`);
  }

  const existingSlug = await db.hotel.findUnique({
    where: { slug: input.hotel.slug },
  });
  if (existingSlug) {
    throw new Error(`A hotel with slug "${input.hotel.slug}" already exists.`);
  }

  return db.$transaction(async (tx) => {
    const createdHotel = await tx.hotel.create({
      data: {
        slug: input.hotel.slug!,
        name: input.hotel.name!,
        nameAr: input.hotel.nameAr || null,
        description: input.hotel.description ?? '',
        propertyType: (input.hotel.propertyType as HotelPropertyType) || 'HOTEL',
        starRating: input.hotel.starRating || null,
        countryCode: input.hotel.countryCode!.toUpperCase(),
        city: input.hotel.city!,
        address: input.hotel.address!,
        postalCode: input.hotel.postalCode || null,
        latitude: input.hotel.latitude !== undefined ? input.hotel.latitude : null,
        longitude: input.hotel.longitude !== undefined ? input.hotel.longitude : null,
        phone: input.hotel.phone || null,
        email: input.hotel.email || null,
        website: input.hotel.website || null,
        checkInTime: input.hotel.checkInTime || '15:00',
        checkOutTime: input.hotel.checkOutTime || '11:00',
        coverImage: input.hotel.coverImage || null,
        gallery: JSON.stringify(input.hotel.gallery || []),
        amenities: JSON.stringify(input.hotel.amenities || []),
        seoTitle: input.hotel.seoTitle || null,
        seoDescription: input.hotel.seoDescription || null,
        translations: input.hotel.translations ? JSON.stringify(input.hotel.translations) : null,
        status: (input.hotel.status as HotelStatus) || 'DRAFT',
      },
    });

    const pol = input.policy || {};
    await tx.hotelPolicy.create({
      data: {
        hotelId: createdHotel.id,
        checkInAge: pol.checkInAge ?? 18,
        checkInInstructions: pol.checkInInstructions || null,
        childAgeMax: pol.childAgeMax ?? 11,
        infantAgeMax: pol.infantAgeMax ?? 2,
        allowExtraBeds: Boolean(pol.allowExtraBeds),
        extraBedPricePerNight: pol.extraBedPricePerNight ?? null,
        allowCribs: Boolean(pol.allowCribs),
        cribPricePerNight: pol.cribPricePerNight ?? null,
        petsAllowed: Boolean(pol.petsAllowed),
        petFeePerStay: pol.petFeePerStay ?? null,
        cancellationSummary: pol.cancellationSummary || null,
        paymentPolicy: pol.paymentPolicy || null,
        depositRequired: Boolean(pol.depositRequired),
        depositPercentage: pol.depositPercentage ?? 0.0,
        customPolicies: pol.customPolicies ? JSON.stringify(pol.customPolicies) : null,
        translations: pol.translations ? JSON.stringify(pol.translations) : null,
      },
    });

    return createdHotel;
  });
}

/**
 * Updates an existing hotel and its policy.
 */
export async function updateHotel(
  id: string,
  input: {
    hotel: Partial<HotelData>;
    policy?: Partial<HotelPolicyData>;
  },
) {
  const existing = await db.hotel.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Hotel not found.');
  }

  // If slug is changing, verify uniqueness
  if (input.hotel.slug && input.hotel.slug !== existing.slug) {
    const slugClash = await db.hotel.findUnique({ where: { slug: input.hotel.slug } });
    if (slugClash) {
      throw new Error(`A hotel with slug "${input.hotel.slug}" already exists.`);
    }
  }

  const mergedHotel: any = {
    ...existing,
    nameAr: input.hotel.nameAr !== undefined ? input.hotel.nameAr : (existing.nameAr ?? undefined),
    postalCode: input.hotel.postalCode !== undefined ? input.hotel.postalCode : (existing.postalCode ?? undefined),
    ...input.hotel,
    starRating: input.hotel.starRating !== undefined ? input.hotel.starRating : existing.starRating ?? undefined,
    latitude: decimalToNumber(input.hotel.latitude !== undefined ? input.hotel.latitude : existing.latitude),
    longitude: decimalToNumber(input.hotel.longitude !== undefined ? input.hotel.longitude : existing.longitude),
  };

  const validation = validateHotel(mergedHotel);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.map((e) => e.message).join(', ')}`);
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.hotel.update({
      where: { id },
      data: {
        slug: input.hotel.slug ?? existing.slug,
        name: input.hotel.name ?? existing.name,
        nameAr: input.hotel.nameAr !== undefined ? input.hotel.nameAr : existing.nameAr,
        description: input.hotel.description ?? existing.description,
        propertyType: (input.hotel.propertyType as HotelPropertyType) ?? existing.propertyType,
        starRating: input.hotel.starRating !== undefined ? input.hotel.starRating : existing.starRating,
        countryCode: input.hotel.countryCode ? input.hotel.countryCode.toUpperCase() : existing.countryCode,
        city: input.hotel.city ?? existing.city,
        address: input.hotel.address ?? existing.address,
        postalCode: input.hotel.postalCode !== undefined ? input.hotel.postalCode : existing.postalCode,
        latitude: input.hotel.latitude !== undefined ? input.hotel.latitude : existing.latitude,
        longitude: input.hotel.longitude !== undefined ? input.hotel.longitude : existing.longitude,
        phone: input.hotel.phone !== undefined ? input.hotel.phone : existing.phone,
        email: input.hotel.email !== undefined ? input.hotel.email : existing.email,
        website: input.hotel.website !== undefined ? input.hotel.website : existing.website,
        checkInTime: input.hotel.checkInTime ?? existing.checkInTime,
        checkOutTime: input.hotel.checkOutTime ?? existing.checkOutTime,
        coverImage: input.hotel.coverImage !== undefined ? input.hotel.coverImage : existing.coverImage,
        gallery: input.hotel.gallery ? JSON.stringify(input.hotel.gallery) : undefined,
        amenities: input.hotel.amenities ? JSON.stringify(input.hotel.amenities) : undefined,
        seoTitle: input.hotel.seoTitle !== undefined ? input.hotel.seoTitle : existing.seoTitle,
        seoDescription: input.hotel.seoDescription !== undefined ? input.hotel.seoDescription : existing.seoDescription,
        translations: input.hotel.translations ? JSON.stringify(input.hotel.translations) : undefined,
        status: (input.hotel.status as HotelStatus) ?? existing.status,
      },
    });

    if (input.policy) {
      const pol = input.policy;
      await tx.hotelPolicy.upsert({
        where: { hotelId: id },
        create: {
          hotelId: id,
          checkInAge: pol.checkInAge ?? 18,
          checkInInstructions: pol.checkInInstructions || null,
          childAgeMax: pol.childAgeMax ?? 11,
          infantAgeMax: pol.infantAgeMax ?? 2,
          allowExtraBeds: Boolean(pol.allowExtraBeds),
          extraBedPricePerNight: pol.extraBedPricePerNight ?? null,
          allowCribs: Boolean(pol.allowCribs),
          cribPricePerNight: pol.cribPricePerNight ?? null,
          petsAllowed: Boolean(pol.petsAllowed),
          petFeePerStay: pol.petFeePerStay ?? null,
          cancellationSummary: pol.cancellationSummary || null,
          paymentPolicy: pol.paymentPolicy || null,
          depositRequired: Boolean(pol.depositRequired),
          depositPercentage: pol.depositPercentage ?? 0.0,
          customPolicies: pol.customPolicies ? JSON.stringify(pol.customPolicies) : null,
          translations: pol.translations ? JSON.stringify(pol.translations) : null,
        },
        update: {
          checkInAge: pol.checkInAge,
          checkInInstructions: pol.checkInInstructions,
          childAgeMax: pol.childAgeMax,
          infantAgeMax: pol.infantAgeMax,
          allowExtraBeds: pol.allowExtraBeds,
          extraBedPricePerNight: pol.extraBedPricePerNight,
          allowCribs: pol.allowCribs,
          cribPricePerNight: pol.cribPricePerNight,
          petsAllowed: pol.petsAllowed,
          petFeePerStay: pol.petFeePerStay,
          cancellationSummary: pol.cancellationSummary,
          paymentPolicy: pol.paymentPolicy,
          depositRequired: pol.depositRequired,
          depositPercentage: pol.depositPercentage,
          customPolicies: pol.customPolicies ? JSON.stringify(pol.customPolicies) : undefined,
          translations: pol.translations ? JSON.stringify(pol.translations) : undefined,
        },
      });
    }

    return updated;
  });
}

/**
 * Safely deletes or archives a hotel.
 * If bookings exist, permanently deleting is rejected; instead, archive is advised.
 */
export async function deleteHotel(id: string, forceArchive: boolean = false) {
  const existing = await db.hotel.findUnique({
    where: { id },
    include: {
      _count: {
        select: { bookings: true },
      },
    },
  });

  if (!existing) {
    throw new Error('Hotel not found.');
  }

  if (existing._count.bookings > 0) {
    if (forceArchive) {
      return db.hotel.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      });
    }
    throw new Error(
      `Cannot delete hotel "${existing.name}": ${existing._count.bookings} historical booking(s) exist. Please set status to ARCHIVED instead.`,
    );
  }

  return db.hotel.delete({ where: { id } });
}

// ============================================================================
// ROOM TYPES
// ============================================================================

export async function createRoomType(hotelId: string, data: Partial<HotelRoomTypeData>) {
  const validation = validateRoomType(data);
  if (!validation.valid) {
    throw new Error(`Room validation failed: ${validation.errors.map((e) => e.message).join(', ')}`);
  }

  const existingCode = await db.hotelRoomType.findUnique({
    where: { hotelId_code: { hotelId, code: data.code! } },
  });
  if (existingCode) {
    throw new Error(`Room type code "${data.code}" already exists in this hotel.`);
  }

  return db.hotelRoomType.create({
    data: {
      hotelId,
      name: data.name!,
      code: data.code!,
      description: data.description || null,
      maxAdults: data.maxAdults ?? 2,
      maxChildren: data.maxChildren ?? 1,
      maxOccupancy: data.maxOccupancy ?? 3,
      bedConfiguration: data.bedConfiguration || null,
      roomSizeSqm: data.roomSizeSqm ?? null,
      amenities: JSON.stringify(data.amenities || []),
      gallery: JSON.stringify(data.gallery || []),
      isActive: data.isActive !== false,
      sortOrder: data.sortOrder ?? 0,
      translations: data.translations ? JSON.stringify(data.translations) : null,
    },
  });
}

export async function updateRoomType(id: string, data: Partial<HotelRoomTypeData>) {
  const existing = await db.hotelRoomType.findUnique({ where: { id } });
  if (!existing) throw new Error('Room type not found.');

  if (data.code && data.code !== existing.code) {
    const codeClash = await db.hotelRoomType.findUnique({
      where: { hotelId_code: { hotelId: existing.hotelId, code: data.code } },
    });
    if (codeClash) throw new Error(`Room type code "${data.code}" already exists in this hotel.`);
  }

  const merged: any = {
    ...existing,
    amenities: data.amenities ?? JSON.parse(existing.amenities || '[]'),
    gallery: data.gallery ?? JSON.parse(existing.gallery || '[]'),
    roomSizeSqm: decimalToNumber(data.roomSizeSqm !== undefined ? data.roomSizeSqm : existing.roomSizeSqm),
    ...data,
  };
  const validation = validateRoomType(merged);
  if (!validation.valid) {
    throw new Error(`Room validation failed: ${validation.errors.map((e) => e.message).join(', ')}`);
  }

  return db.hotelRoomType.update({
    where: { id },
    data: {
      name: data.name ?? existing.name,
      code: data.code ?? existing.code,
      description: data.description !== undefined ? data.description : existing.description,
      maxAdults: data.maxAdults ?? existing.maxAdults,
      maxChildren: data.maxChildren ?? existing.maxChildren,
      maxOccupancy: data.maxOccupancy ?? existing.maxOccupancy,
      bedConfiguration: data.bedConfiguration !== undefined ? data.bedConfiguration : existing.bedConfiguration,
      roomSizeSqm: data.roomSizeSqm !== undefined ? data.roomSizeSqm : existing.roomSizeSqm,
      amenities: data.amenities ? JSON.stringify(data.amenities) : undefined,
      gallery: data.gallery ? JSON.stringify(data.gallery) : undefined,
      isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
      sortOrder: data.sortOrder ?? existing.sortOrder,
      translations: data.translations ? JSON.stringify(data.translations) : undefined,
    },
  });
}

export async function deleteRoomType(id: string) {
  const existing = await db.hotelRoomType.findUnique({
    where: { id },
    include: {
      _count: { select: { bookingRooms: true } },
    },
  });
  if (!existing) throw new Error('Room type not found.');

  if (existing._count.bookingRooms > 0) {
    throw new Error(`Cannot delete room type "${existing.name}": historical bookings exist. Deactivate it instead.`);
  }

  return db.hotelRoomType.delete({ where: { id } });
}

// ============================================================================
// RATE PLANS
// ============================================================================

export async function createRatePlan(roomTypeId: string, data: Partial<HotelRatePlanData>) {
  const validation = validateRatePlan(data);
  if (!validation.valid) {
    throw new Error(`Rate plan validation failed: ${validation.errors.map((e) => e.message).join(', ')}`);
  }

  const existingCode = await db.hotelRatePlan.findUnique({
    where: { roomTypeId_code: { roomTypeId, code: data.code! } },
  });
  if (existingCode) {
    throw new Error(`Rate plan code "${data.code}" already exists for this room type.`);
  }

  return db.hotelRatePlan.create({
    data: {
      roomTypeId,
      name: data.name!,
      code: data.code!,
      description: data.description || null,
      boardBasis: (data.boardBasis as HotelBoardBasis) || 'ROOM_ONLY',
      isRefundable: data.isRefundable !== false,
      cancellationPolicy: data.cancellationPolicy || null,
      cancellationDeadlineDays: data.cancellationDeadlineDays ?? 2,
      cancellationPenaltyPercent: data.cancellationPenaltyPercent ?? 100.0,
      currency: data.currency ? data.currency.toUpperCase() : 'USD',
      basePrice: data.basePrice!,
      minStayNights: data.minStayNights ?? 1,
      maxStayNights: data.maxStayNights || null,
      isActive: data.isActive !== false,
      translations: data.translations ? JSON.stringify(data.translations) : null,
    },
  });
}

export async function updateRatePlan(id: string, data: Partial<HotelRatePlanData>) {
  const existing = await db.hotelRatePlan.findUnique({ where: { id } });
  if (!existing) throw new Error('Rate plan not found.');

  if (data.code && data.code !== existing.code) {
    const codeClash = await db.hotelRatePlan.findUnique({
      where: { roomTypeId_code: { roomTypeId: existing.roomTypeId, code: data.code } },
    });
    if (codeClash) throw new Error(`Rate plan code "${data.code}" already exists for this room type.`);
  }

  const merged: any = {
    ...existing,
    basePrice: data.basePrice ?? decimalToNumber(existing.basePrice) ?? 0,
    ...data,
  };
  const validation = validateRatePlan(merged);
  if (!validation.valid) {
    throw new Error(`Rate plan validation failed: ${validation.errors.map((e) => e.message).join(', ')}`);
  }

  return db.hotelRatePlan.update({
    where: { id },
    data: {
      name: data.name ?? existing.name,
      code: data.code ?? existing.code,
      description: data.description !== undefined ? data.description : existing.description,
      boardBasis: (data.boardBasis as HotelBoardBasis) ?? existing.boardBasis,
      isRefundable: data.isRefundable !== undefined ? data.isRefundable : existing.isRefundable,
      cancellationPolicy: data.cancellationPolicy !== undefined ? data.cancellationPolicy : existing.cancellationPolicy,
      cancellationDeadlineDays: data.cancellationDeadlineDays !== undefined ? data.cancellationDeadlineDays : existing.cancellationDeadlineDays,
      cancellationPenaltyPercent: data.cancellationPenaltyPercent !== undefined ? data.cancellationPenaltyPercent : existing.cancellationPenaltyPercent,
      currency: data.currency ? data.currency.toUpperCase() : existing.currency,
      basePrice: data.basePrice !== undefined ? data.basePrice : existing.basePrice,
      minStayNights: data.minStayNights ?? existing.minStayNights,
      maxStayNights: data.maxStayNights !== undefined ? data.maxStayNights : existing.maxStayNights,
      isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
      translations: data.translations ? JSON.stringify(data.translations) : undefined,
    },
  });
}

export async function deleteRatePlan(id: string) {
  const existing = await db.hotelRatePlan.findUnique({
    where: { id },
    include: {
      _count: { select: { bookingRooms: true } },
    },
  });
  if (!existing) throw new Error('Rate plan not found.');

  if (existing._count.bookingRooms > 0) {
    throw new Error(`Cannot delete rate plan "${existing.name}": historical bookings exist. Deactivate it instead.`);
  }

  return db.hotelRatePlan.delete({ where: { id } });
}

// ============================================================================
// INVENTORY ALLOTMENTS & RESTRICTIONS
// ============================================================================

export interface BulkInventoryUpdateInput {
  roomTypeId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD (inclusive)
  totalRooms?: number;
  stopSale?: boolean;
  closedToArrival?: boolean;
  closedToDeparture?: boolean;
  ratePlanOverrides?: {
    ratePlanId: string;
    price?: number;
    stopSale?: boolean;
  }[];
}

/**
 * Queries room inventory and daily rates across a date range.
 */
export async function getRoomInventory(roomTypeId: string, startDate: string, endDate: string) {
  const range = validateDateRange(startDate, endDate);
  if (!range.valid) throw new Error(range.error || 'Invalid date range.');

  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T23:59:59Z`);

  const [inventoryRows, ratePlans] = await Promise.all([
    db.hotelRoomInventory.findMany({
      where: {
        roomTypeId,
        date: { gte: start, lte: end },
      },
      orderBy: { date: 'asc' },
    }),
    db.hotelRatePlan.findMany({
      where: { roomTypeId, isActive: true },
      include: {
        dailyRates: {
          where: { date: { gte: start, lte: end } },
        },
      },
    }),
  ]);

  const inventoryMap = new Map<string, (typeof inventoryRows)[0]>();
  for (const inv of inventoryRows) {
    const key = inv.date.toISOString().slice(0, 10);
    inventoryMap.set(key, inv);
  }

  // Build complete date list including days with no configured row (default totalRooms = 0)
  const days = range.dates.map((dateStr) => {
    const inv = inventoryMap.get(dateStr);
    const total = inv ? inv.totalRooms : 0;
    const booked = inv ? inv.bookedRooms : 0;
    const held = inv ? inv.heldRooms : 0;
    const available = Math.max(0, total - (booked + held));

    const rates = ratePlans.map((rp) => {
      const daily = rp.dailyRates.find((dr) => dr.date.toISOString().slice(0, 10) === dateStr);
      return {
        ratePlanId: rp.id,
        ratePlanName: rp.name,
        code: rp.code,
        price: daily ? decimalToNumber(daily.price) ?? 0 : decimalToNumber(rp.basePrice) ?? 0,
        isOverride: Boolean(daily),
        stopSale: daily ? daily.stopSale : false,
      };
    });

    return {
      date: dateStr,
      totalRooms: total,
      bookedRooms: booked,
      heldRooms: held,
      availableRooms: available,
      stopSale: inv ? inv.stopSale : false,
      closedToArrival: inv ? inv.closedToArrival : false,
      closedToDeparture: inv ? inv.closedToDeparture : false,
      rates,
    };
  });

  return days;
}

/**
 * Transactionally updates or inserts inventory across a date range.
 * Guarantees that totalRooms cannot be reduced below committed reservations (booked + held).
 */
export async function bulkUpdateInventory(input: BulkInventoryUpdateInput) {
  const { roomTypeId, startDate, endDate, totalRooms, stopSale, closedToArrival, closedToDeparture, ratePlanOverrides } = input;

  const range = validateDateRange(startDate, endDate);
  if (!range.valid) throw new Error(range.error || 'Invalid date range.');

  const room = await db.hotelRoomType.findUnique({ where: { id: roomTypeId } });
  if (!room) throw new Error('Room type not found.');

  return db.$transaction(async (tx) => {
    const results = [];

    for (const dateStr of range.dates) {
      const dateObj = new Date(`${dateStr}T00:00:00Z`);

      const existing = await tx.hotelRoomInventory.findUnique({
        where: { roomTypeId_date: { roomTypeId, date: dateObj } },
      });

      if (totalRooms !== undefined && existing) {
        const committed = existing.bookedRooms + existing.heldRooms;
        if (totalRooms < committed) {
          throw new Error(
            `Cannot set total rooms to ${totalRooms} on ${dateStr}: ${committed} rooms are already committed (${existing.bookedRooms} booked, ${existing.heldRooms} held).`,
          );
        }
      }

      const updated = await tx.hotelRoomInventory.upsert({
        where: { roomTypeId_date: { roomTypeId, date: dateObj } },
        create: {
          roomTypeId,
          date: dateObj,
          totalRooms: totalRooms !== undefined ? Math.max(0, totalRooms) : 1,
          bookedRooms: 0,
          heldRooms: 0,
          stopSale: stopSale !== undefined ? stopSale : false,
          closedToArrival: closedToArrival !== undefined ? closedToArrival : false,
          closedToDeparture: closedToDeparture !== undefined ? closedToDeparture : false,
        },
        update: {
          totalRooms: totalRooms !== undefined ? Math.max(0, totalRooms) : undefined,
          stopSale: stopSale !== undefined ? stopSale : undefined,
          closedToArrival: closedToArrival !== undefined ? closedToArrival : undefined,
          closedToDeparture: closedToDeparture !== undefined ? closedToDeparture : undefined,
        },
      });

      results.push(updated);

      if (ratePlanOverrides && ratePlanOverrides.length > 0) {
        for (const override of ratePlanOverrides) {
          if (override.price !== undefined || override.stopSale !== undefined) {
            const rp = await tx.hotelRatePlan.findUnique({ where: { id: override.ratePlanId } });
            if (!rp) continue;

            const finalPrice = override.price !== undefined ? roundMoney(override.price) : decimalToNumber(rp.basePrice) ?? 0;

            await tx.hotelDailyRate.upsert({
              where: { ratePlanId_date: { ratePlanId: override.ratePlanId, date: dateObj } },
              create: {
                ratePlanId: override.ratePlanId,
                date: dateObj,
                price: finalPrice,
                stopSale: override.stopSale !== undefined ? override.stopSale : false,
              },
              update: {
                price: override.price !== undefined ? finalPrice : undefined,
                stopSale: override.stopSale !== undefined ? override.stopSale : undefined,
              },
            });
          }
        }
      }
    }

    return { updatedCount: results.length };
  });
}
