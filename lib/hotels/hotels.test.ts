/**
 * TravNeeds Phase 2B.1 — Hotels Domain & Foundation Tests
 *
 * Runs standalone via Node.js / tsx without requiring external network
 * or mutating persistent database records.
 */

import {
  validateHotel,
  validateRoomType,
  validateRatePlan,
  validateDateRange,
  validateInventoryBoundaries,
  roundMoney,
  isPricePrecisionValid,
} from './validation';
import {
  calculateStayAvailability,
  validateOccupancy,
  createInventoryLockToken,
  isLockExpired,
  calculateCancellationPenalty,
  createHotelBookingSnapshot,
} from './booking-foundation';
import type {
  HotelData,
  HotelRoomTypeData,
  HotelRatePlanData,
  HotelRoomInventoryData,
  HotelDailyRateData,
} from './types';
import { ModuleRegistry } from '@/lib/modules/registry';
import { isModuleSubscriptionEligible } from '@/lib/modules/entitlements';
import { HotelsModuleManifest, ToursModuleManifest } from '@/lib/modules/catalogue';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exitCode = 1;
  } else {
    passedTests++;
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('--- Running TravNeeds Phase 2B.1 Hotels Foundation Tests ---');

// ============================================================================
// 1. HOTEL PROPERTY VALIDATION
// ============================================================================

const validHotel: HotelData = {
  slug: 'nile-palace-luxor',
  name: 'Nile Palace Luxor Resort',
  nameAr: 'منتجع قصر النيل الأقصر',
  description: 'Luxurious resort overlooking the eternal Nile.',
  propertyType: 'RESORT',
  starRating: 5,
  countryCode: 'EG',
  city: 'Luxor',
  address: 'Corniche El Nile, Luxor',
  postalCode: '85951',
  latitude: 25.68724,
  longitude: 32.63963,
  phone: '+20 95 236 6999',
  email: 'info@nilepalace.com',
  checkInTime: '15:00',
  checkOutTime: '12:00',
  coverImage: '/images/hotels/nile-palace.jpg',
  gallery: ['/images/hotels/nile-palace-1.jpg'],
  amenities: ['pool', 'wifi', 'spa', 'restaurant'],
  status: 'DRAFT',
};

const v1 = validateHotel(validHotel);
assert(v1.valid && v1.errors.length === 0, 'Valid hotel property passes validation');

const v2 = validateHotel({ ...validHotel, name: 'A' });
assert(!v2.valid && v2.errors.some((e) => e.code === 'INVALID_NAME'), 'Hotel name < 2 characters is rejected');

const v3 = validateHotel({ ...validHotel, slug: 'Invalid Slug!' });
assert(!v3.valid && v3.errors.some((e) => e.code === 'INVALID_SLUG'), 'Uppercase and space in slug is rejected');

const v4 = validateHotel({ ...validHotel, propertyType: 'SPACE_STATION' as any });
assert(!v4.valid && v4.errors.some((e) => e.code === 'INVALID_PROPERTY_TYPE'), 'Unknown property type is rejected');

const v5 = validateHotel({ ...validHotel, starRating: 6 });
assert(!v5.valid && v5.errors.some((e) => e.code === 'INVALID_STAR_RATING'), 'Star rating > 5 is rejected');

const v6 = validateHotel({ ...validHotel, starRating: 0 });
assert(!v6.valid && v6.errors.some((e) => e.code === 'INVALID_STAR_RATING'), 'Star rating < 1 is rejected');

const v7 = validateHotel({ ...validHotel, countryCode: 'EGY' });
assert(!v7.valid && v7.errors.some((e) => e.code === 'INVALID_COUNTRY_CODE'), 'Non-ISO2 country code is rejected');

const v8 = validateHotel({ ...validHotel, city: '' });
assert(!v8.valid && v8.errors.some((e) => e.code === 'MISSING_CITY'), 'Missing city is rejected');

const v9 = validateHotel({ ...validHotel, latitude: 120 });
assert(!v9.valid && v9.errors.some((e) => e.code === 'INVALID_LATITUDE'), 'Latitude > 90 is rejected');

const v10 = validateHotel({ ...validHotel, checkInTime: '3:00 PM' });
assert(!v10.valid && v10.errors.some((e) => e.code === 'INVALID_CHECK_IN_TIME'), 'Non-24hr check-in time format rejected');

// ============================================================================
// 2. ROOM TYPE & OCCUPANCY VALIDATION
// ============================================================================

const validRoom: HotelRoomTypeData = {
  hotelId: 'hotel-luxor-1',
  name: 'Deluxe Nile View King',
  code: 'DLX-KNG-NV',
  description: 'Spacious 45 sqm room with panoramic Nile view balcony.',
  maxAdults: 2,
  maxChildren: 1,
  maxOccupancy: 3,
  bedConfiguration: '1 King Bed',
  roomSizeSqm: 45.0,
  amenities: ['balcony', 'minibar', 'ac', 'tv'],
  gallery: [],
  isActive: true,
};

const vr1 = validateRoomType(validRoom);
assert(vr1.valid, 'Valid room type passes validation');

const vr2 = validateRoomType({ ...validRoom, maxAdults: 0 });
assert(!vr2.valid && vr2.errors.some((e) => e.code === 'INVALID_MAX_ADULTS'), 'Room with maxAdults = 0 is rejected');

const vr3 = validateRoomType({ ...validRoom, maxOccupancy: 1, maxAdults: 2 });
assert(!vr3.valid && vr3.errors.some((e) => e.code === 'INVALID_MAX_OCCUPANCY'), 'maxOccupancy < maxAdults is rejected');

const vr4 = validateRoomType({ ...validRoom, roomSizeSqm: -10 });
assert(!vr4.valid && vr4.errors.some((e) => e.code === 'INVALID_ROOM_SIZE'), 'Negative room size is rejected');

const occ1 = validateOccupancy(validRoom, 2, 1);
assert(occ1.valid, '2 adults + 1 child fits inside 3-guest room');

const occ2 = validateOccupancy(validRoom, 3, 0);
assert(!occ2.valid && Boolean(occ2.message?.includes('adults')), '3 adults in 2-adult capacity room is rejected');

const occ3 = validateOccupancy({ ...validRoom, maxChildren: 2 }, 2, 2);
assert(!occ3.valid && Boolean(occ3.message?.includes('occupancy')), '4 total guests in 3-maxOccupancy room is rejected');

const occ4 = validateOccupancy(validRoom, 0, 1);
assert(!occ4.valid && Boolean(occ4.message?.includes('At least 1 adult')), 'Room with 0 adults is rejected');

// ============================================================================
// 3. RATE PLAN VALIDATION
// ============================================================================

const validRatePlan: HotelRatePlanData = {
  roomTypeId: 'room-deluxe-1',
  name: 'Flexible with Breakfast',
  code: 'FLEX-BB',
  description: 'Includes full buffet breakfast. Free cancellation up to 48 hours.',
  boardBasis: 'BED_AND_BREAKFAST',
  isRefundable: true,
  cancellationPolicy: 'Free cancellation up to 2 days before arrival',
  cancellationDeadlineDays: 2,
  cancellationPenaltyPercent: 100.0,
  currency: 'USD',
  basePrice: 150.0,
  minStayNights: 1,
  maxStayNights: 14,
  isActive: true,
};

const rp1 = validateRatePlan(validRatePlan);
assert(rp1.valid, 'Valid rate plan passes validation');

const rp2 = validateRatePlan({ ...validRatePlan, basePrice: -50 });
assert(!rp2.valid && rp2.errors.some((e) => e.code === 'INVALID_BASE_PRICE'), 'Negative base price is rejected');

const rp3 = validateRatePlan({ ...validRatePlan, basePrice: 120.456 });
assert(!rp3.valid && rp3.errors.some((e) => e.code === 'INVALID_PRICE_PRECISION'), 'Price with 3 decimal places rejected');

const rp4 = validateRatePlan({ ...validRatePlan, minStayNights: 0 });
assert(!rp4.valid && rp4.errors.some((e) => e.code === 'INVALID_MIN_STAY'), 'minStayNights < 1 is rejected');

const rp5 = validateRatePlan({ ...validRatePlan, minStayNights: 5, maxStayNights: 3 });
assert(!rp5.valid && rp5.errors.some((e) => e.code === 'INVALID_MAX_STAY'), 'maxStay < minStay is rejected');

const rp6 = validateRatePlan({ ...validRatePlan, cancellationPenaltyPercent: 150 });
assert(!rp6.valid && rp6.errors.some((e) => e.code === 'INVALID_PENALTY_PERCENT'), 'Penalty percent > 100 is rejected');

// ============================================================================
// 4. DATE RANGE CORRECTNESS
// ============================================================================

const dr1 = validateDateRange('2026-12-01', '2026-12-04');
assert(dr1.valid && dr1.nights === 3, 'Valid 3-night range returns nights = 3');
assert(
  dr1.dates.length === 3 &&
    dr1.dates[0] === '2026-12-01' &&
    dr1.dates[1] === '2026-12-02' &&
    dr1.dates[2] === '2026-12-03',
  'Date enumeration returns exact night dates excluding check-out morning',
);

const dr2 = validateDateRange('2026-12-04', '2026-12-04');
assert(!dr2.valid && dr2.nights === 0, 'Same-day check-in and check-out is rejected');

const dr3 = validateDateRange('2026-12-05', '2026-12-01');
assert(!dr3.valid, 'Check-out before check-in is rejected');

const dr4 = validateDateRange('invalid-date', '2026-12-01');
assert(!dr4.valid, 'Malformed date string is rejected');

// ============================================================================
// 5. INVENTORY BOUNDARIES & RESTRICTIONS
// ============================================================================

const ib1 = validateInventoryBoundaries({ totalRooms: 10, bookedRooms: 4, heldRooms: 2 });
assert(ib1.valid, '10 total with 4 booked and 2 held is valid');

const ib2 = validateInventoryBoundaries({ totalRooms: 5, bookedRooms: 4, heldRooms: 2 });
assert(!ib2.valid && ib2.errors.some((e) => e.code === 'OVERBOOKED'), 'Booked (4) + held (2) > total (5) is rejected as overbooked');

const ib3 = validateInventoryBoundaries({ totalRooms: -2, bookedRooms: 0, heldRooms: 0 });
assert(!ib3.valid && ib3.errors.some((e) => e.code === 'INVALID_TOTAL_ROOMS'), 'Negative total allotment is rejected');

// ============================================================================
// 6. STAY AVAILABILITY & CALCULATION ENGINE
// ============================================================================

const sampleInventory: HotelRoomInventoryData[] = [
  { roomTypeId: 'room-1', date: '2026-12-01', totalRooms: 5, bookedRooms: 2, heldRooms: 0, stopSale: false, closedToArrival: false, closedToDeparture: false },
  { roomTypeId: 'room-1', date: '2026-12-02', totalRooms: 5, bookedRooms: 2, heldRooms: 0, stopSale: false, closedToArrival: false, closedToDeparture: false },
  { roomTypeId: 'room-1', date: '2026-12-03', totalRooms: 5, bookedRooms: 1, heldRooms: 0, stopSale: false, closedToArrival: false, closedToDeparture: false },
];

const sampleDailyRates: HotelDailyRateData[] = [
  { ratePlanId: 'rp-1', date: '2026-12-01', price: 150.0, stopSale: false, closedToArrival: false, closedToDeparture: false },
  { ratePlanId: 'rp-1', date: '2026-12-02', price: 180.0, stopSale: false, closedToArrival: false, closedToDeparture: false }, // Seasonal bump
  { ratePlanId: 'rp-1', date: '2026-12-03', price: 150.0, stopSale: false, closedToArrival: false, closedToDeparture: false },
];

const stay1 = calculateStayAvailability({
  hotel: validHotel,
  roomType: validRoom,
  ratePlan: validRatePlan,
  inventoryRows: sampleInventory,
  dailyRateRows: sampleDailyRates,
  checkInDate: '2026-12-01',
  checkOutDate: '2026-12-04',
});

assert(stay1.isAvailable, 'Stay is available across all 3 nights');
assert(stay1.subtotal === 480.0, `Subtotal matches 150 + 180 + 150 = 480.0 (got ${stay1.subtotal})`);
assert(stay1.averageNightlyRate === 160.0, `Average nightly rate is 160.0 (got ${stay1.averageNightlyRate})`);

// Stop sale on day 2
const stopSaleInventory = sampleInventory.map((r) => (r.date === '2026-12-02' ? { ...r, stopSale: true } : r));
const stay2 = calculateStayAvailability({
  hotel: validHotel,
  roomType: validRoom,
  ratePlan: validRatePlan,
  inventoryRows: stopSaleInventory,
  dailyRateRows: sampleDailyRates,
  checkInDate: '2026-12-01',
  checkOutDate: '2026-12-04',
});
assert(!stay2.isAvailable && Boolean(stay2.unavailableReason?.includes('Stop-Sale')), 'Stay rejected when any date has stop-sale');

// Closed to arrival on check-in date
const ctaInventory = sampleInventory.map((r) => (r.date === '2026-12-01' ? { ...r, closedToArrival: true } : r));
const stay3 = calculateStayAvailability({
  hotel: validHotel,
  roomType: validRoom,
  ratePlan: validRatePlan,
  inventoryRows: ctaInventory,
  dailyRateRows: sampleDailyRates,
  checkInDate: '2026-12-01',
  checkOutDate: '2026-12-04',
});
assert(!stay3.isAvailable && Boolean(stay3.unavailableReason?.includes('Closed to Arrival')), 'Check-in on Closed-to-Arrival date rejected');

// Closed to arrival on day 2 does NOT block check-in on day 1
const ctaDay2Inventory = sampleInventory.map((r) => (r.date === '2026-12-02' ? { ...r, closedToArrival: true } : r));
const stay4 = calculateStayAvailability({
  hotel: validHotel,
  roomType: validRoom,
  ratePlan: validRatePlan,
  inventoryRows: ctaDay2Inventory,
  dailyRateRows: sampleDailyRates,
  checkInDate: '2026-12-01',
  checkOutDate: '2026-12-04',
});
assert(stay4.isAvailable, 'Closed-to-arrival on day 2 does not block stay that arrived on day 1');

// ============================================================================
// 7. INVENTORY LOCKING & EXPIRATION
// ============================================================================

const lock = createInventoryLockToken('room-1', '2026-12-01', '2026-12-04', 1, 15);
assert(lock.lockToken.length === 48, 'Inventory lock token is a secure 48-char hex string');
assert(!isLockExpired(lock), 'Newly created lock is not expired');

const expiredLock = {
  ...lock,
  expiresAt: new Date(Date.now() - 1000), // 1 second ago
};
assert(isLockExpired(expiredLock), 'Lock in the past is recognized as expired');

// ============================================================================
// 8. CANCELLATION PENALTY CALCULATIONS
// ============================================================================

const now = new Date('2026-11-20T12:00:00Z');
// Check in is 2026-12-01 (11 days ahead). Deadline is 2 days.
const cp1 = calculateCancellationPenalty(validRatePlan, 480.0, '2026-12-01', now);
assert(cp1.isFreeCancellation && cp1.refundAmount === 480.0 && cp1.penaltyAmount === 0, 'Cancellation before deadline gives 100% refund');

// Check in is 2026-11-21 (1 day ahead, past the 2-day deadline).
const cp2 = calculateCancellationPenalty(validRatePlan, 480.0, '2026-11-21', now);
assert(!cp2.isFreeCancellation && cp2.penaltyAmount === 480.0 && cp2.refundAmount === 0, 'Cancellation after deadline applies 100% penalty');

// Non-refundable rate plan
const nonRefundablePlan: HotelRatePlanData = {
  ...validRatePlan,
  isRefundable: false,
};
const cp3 = calculateCancellationPenalty(nonRefundablePlan, 480.0, '2026-12-01', now);
assert(!cp3.isRefundable && cp3.penaltyAmount === 480.0 && cp3.refundAmount === 0, 'Non-refundable plan applies 100% penalty even 11 days ahead');

// ============================================================================
// 9. COMMERCIAL BOOKING SNAPSHOT GENERATION
// ============================================================================

const snapshot = createHotelBookingSnapshot({
  hotel: validHotel,
  checkInDate: '2026-12-01',
  checkOutDate: '2026-12-04',
  guestName: 'Jane Traveler',
  guestEmail: 'jane@example.com',
  guestPhone: '+1 555 123 4567',
  roomCalculations: [
    {
      calculation: stay1,
      request: { roomTypeId: 'room-1', ratePlanId: 'rp-1', adults: 2, children: 1, childAges: [7] },
    },
  ],
});

assert(snapshot.hotelName === 'Nile Palace Luxor Resort', 'Snapshot freezes hotel name');
assert(snapshot.rooms.length === 1, 'Snapshot records 1 room line');
assert(snapshot.rooms[0].lineTotal === 480.0, 'Room line total is preserved in snapshot');
assert(snapshot.rooms[0].boardBasis === 'BED_AND_BREAKFAST', 'Board basis is preserved in snapshot');
assert(snapshot.totalPrice === 480.0, 'Total booking price is preserved');

// ============================================================================
// 10. MODULE REGISTRY & TOURS PRESERVATION
// ============================================================================

const registry = new ModuleRegistry();
registry.register(ToursModuleManifest);
registry.register(HotelsModuleManifest);

const regHotel = registry.get('hotels');
assert(Boolean(regHotel), 'Hotels module is registered and retrievable');
assert(regHotel?.id === 'hotels', 'Hotels stable id is "hotels"');
assert(regHotel?.lifecycle === 'planned', 'Hotels lifecycle is strictly "planned" (not falsely activated)');
assert(!isModuleSubscriptionEligible(regHotel!), 'Planned Hotels module is not commercially eligible for licensing yet');

const regTours = registry.get('tours');
assert(Boolean(regTours), 'Existing Tours module remains registered');
assert(regTours?.lifecycle === 'available_for_subscription', 'Existing Tours module remains available for subscription');
assert(isModuleSubscriptionEligible(regTours!), 'Tours remains subscription-eligible');

console.log(`\nResults: ${passedTests}/${totalTests} tests passed.`);
if (passedTests === totalTests) {
  console.log('All Phase 2B.1 Hotels Foundation tests passed successfully!');
} else {
  console.error('Some tests failed!');
  process.exit(1);
}
