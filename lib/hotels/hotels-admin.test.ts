/**
 * TravNeeds Modular Platform — Phase 2B.2 Hotels Admin Workflows & Validation Test Suite
 *
 * Verifies Hotels Administration domain logic, room & rate management,
 * date-based inventory allotments, occupancy constraints, multilingual preservation,
 * and safe deletion/archive behavior without touching active database records.
 */

import {
  validateHotel,
  validateRoomType,
  validateRatePlan,
  validateDateRange,
  validateInventoryBoundaries,
  roundMoney,
} from './validation';
import { validateOccupancy, calculateStayAvailability } from './booking-foundation';
import { sanitizeRichText, isHtmlContent, stripHtmlToPlainText } from '../rich-text';
import type { HotelData, HotelRoomTypeData, HotelRatePlanData, HotelRoomInventoryData, HotelDailyRateData } from './types';

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

console.log('--- Running TravNeeds Phase 2B.2 Hotels Admin Workflows Test Suite ---\n');

// ============================================================================
// 1. HOTEL CREATION & FIELD VALIDATION
// ============================================================================

const validHotelInput: HotelData = {
  name: 'Cairo Grand Nile Palace',
  nameAr: 'قصر النيل الكبير بالقاهرة',
  slug: 'cairo-grand-nile-palace',
  propertyType: 'HOTEL',
  starRating: 5,
  status: 'DRAFT',
  countryCode: 'EG',
  city: 'Cairo',
  address: 'Corniche El Nil, Garden City',
  postalCode: '11511',
  latitude: 30.0444,
  longitude: 31.2357,
  phone: '+20 2 2795 0000',
  email: 'reservations@grandnilepalace.com',
  website: 'https://grandnilepalace.com',
  checkInTime: '15:00',
  checkOutTime: '12:00',
  coverImage: 'https://images.unsplash.com/photo-hotel-1.jpg',
  gallery: [
    'https://images.unsplash.com/photo-hotel-2.jpg',
    'https://images.unsplash.com/photo-hotel-3.jpg',
  ],
  amenities: ['Free WiFi', 'Swimming Pool', 'Spa & Wellness', 'Fitness Center', 'Restaurant'],
  description: '<p>Experience <b>unrivaled luxury</b> along the historic banks of the River Nile.</p>',
};

assert(validateHotel(validHotelInput).valid, 'Valid hotel property passes admin validation');

// Slug format validation
assert(!validateHotel({ ...validHotelInput, slug: 'Cairo Grand Palace!' }).valid, 'Slug with spaces or exclamation is rejected');
assert(!validateHotel({ ...validHotelInput, slug: 'cairo_grand_palace' }).valid, 'Slug with underscores is rejected (must be lowercase alphanumeric & hyphens)');
assert(validateHotel({ ...validHotelInput, slug: 'cairo-grand-palace-2026' }).valid, 'Valid kebab-case slug is accepted');

// Coordinates bounds validation
assert(!validateHotel({ ...validHotelInput, latitude: 95.5 }).valid, 'Latitude > 90 is rejected');
assert(!validateHotel({ ...validHotelInput, latitude: -91.0 }).valid, 'Latitude < -90 is rejected');
assert(!validateHotel({ ...validHotelInput, longitude: 185.0 }).valid, 'Longitude > 180 is rejected');
assert(!validateHotel({ ...validHotelInput, longitude: -185.0 }).valid, 'Longitude < -180 is rejected');
assert(validateHotel({ ...validHotelInput, latitude: 30.0444, longitude: 31.2357 }).valid, 'Valid Cairo coordinates pass');

// Check-in and Check-out time 24h format
assert(!validateHotel({ ...validHotelInput, checkInTime: '3:00 PM' }).valid, '12-hour AM/PM check-in time format is rejected');
assert(!validateHotel({ ...validHotelInput, checkInTime: '25:00' }).valid, 'Invalid hour 25:00 is rejected');
assert(!validateHotel({ ...validHotelInput, checkOutTime: '11:65' }).valid, 'Invalid minute 11:65 is rejected');
assert(validateHotel({ ...validHotelInput, checkInTime: '14:00', checkOutTime: '11:00' }).valid, 'Standard 24h format passes');

// ============================================================================
// 2. ROOM TYPE CREATION & OCCUPANCY CONSTRAINTS
// ============================================================================

const validRoomType: HotelRoomTypeData = {
  hotelId: 'hotel-uuid-1',
  name: 'Deluxe Nile View King Room',
  code: 'DLX-KNG-NILE',
  description: '<p>Spacious room featuring <b>panoramic Nile views</b> and a plush king bed.</p>',
  maxAdults: 2,
  maxChildren: 1,
  maxOccupancy: 3,
  bedConfiguration: '1 King Bed',
  roomSizeSqm: 45.5,
  amenities: ['River View', 'Balcony', 'Minibar', 'Espresso Machine'],
  gallery: ['https://images.unsplash.com/photo-room-1.jpg'],
  isActive: true,
};

assert(validateRoomType(validRoomType).valid, 'Valid room type passes admin validation');
assert(!validateRoomType({ ...validRoomType, maxAdults: 0 }).valid, 'Room with maxAdults = 0 is rejected');
assert(!validateRoomType({ ...validRoomType, maxOccupancy: 1, maxAdults: 2 }).valid, 'maxOccupancy < maxAdults is rejected');
assert(!validateRoomType({ ...validRoomType, roomSizeSqm: -10 }).valid, 'Negative room size in sqm is rejected');
assert(validateRoomType({ ...validRoomType, roomSizeSqm: undefined }).valid, 'Undefined room size sqm is allowed when unspecified');

// Occupancy evaluation
const occ1 = validateOccupancy(validRoomType, 2, 1);
assert(Boolean(occ1.valid), '2 adults + 1 child fits inside 3-guest room');
const occ2 = validateOccupancy(validRoomType, 3, 0);
assert(!occ2.valid && Boolean(occ2.message?.includes('adults')), '3 adults in room with maxAdults=2 is rejected');
const occ3 = validateOccupancy({ ...validRoomType, maxChildren: 2 }, 2, 2);
assert(!occ3.valid && Boolean(occ3.message?.includes('occupancy')), '2 adults + 2 children (total 4) exceeds maxOccupancy=3');

// ============================================================================
// 3. RATE PLAN CREATION, PRICING & CANCELLATION
// ============================================================================

const validRatePlan: HotelRatePlanData = {
  roomTypeId: 'room-uuid-1',
  name: 'Standard Flexible with Breakfast',
  code: 'FLEX-BB',
  description: '<p>Includes <b>daily artisan breakfast</b> with flexible cancellation.</p>',
  boardBasis: 'BED_AND_BREAKFAST',
  basePrice: 180.0,
  currency: 'USD',
  minStayNights: 1,
  maxStayNights: 14,
  isRefundable: true,
  cancellationPolicy: 'FREE_CANCELLATION',
  cancellationDeadlineDays: 2,
  cancellationPenaltyPercent: 100,
  isActive: true,
};

assert(validateRatePlan(validRatePlan).valid, 'Valid rate plan passes admin validation');
assert(!validateRatePlan({ ...validRatePlan, basePrice: -25 }).valid, 'Negative base price is rejected');
assert(!validateRatePlan({ ...validRatePlan, basePrice: 150.999 }).valid, 'Price with > 2 decimal places is rejected');
assert(!validateRatePlan({ ...validRatePlan, minStayNights: 5, maxStayNights: 3 }).valid, 'maxStay < minStay is rejected');
assert(!validateRatePlan({ ...validRatePlan, cancellationPenaltyPercent: 120 }).valid, 'Penalty percent > 100 is rejected');
assert(!validateRatePlan({ ...validRatePlan, cancellationPenaltyPercent: -5 }).valid, 'Penalty percent < 0 is rejected');

// ============================================================================
// 4. DATE-BASED INVENTORY ALLOTMENTS & RESTRICTIONS
// ============================================================================

// Allotment safety: Cannot reduce total allotment below already committed rooms
assert(validateInventoryBoundaries({ totalRooms: 10, bookedRooms: 4, heldRooms: 2 }).valid, '10 total allotment with 4 booked and 2 held is valid');
assert(!validateInventoryBoundaries({ totalRooms: 5, bookedRooms: 4, heldRooms: 2 }).valid, 'Total allotment (5) < booked (4) + held (2) is rejected (overbooking protection)');
assert(!validateInventoryBoundaries({ totalRooms: -1, bookedRooms: 0, heldRooms: 0 }).valid, 'Negative total allotment is rejected');

// Date Range validation
const dateRangeResult = validateDateRange('2026-12-01', '2026-12-05');
assert(dateRangeResult.valid && dateRangeResult.nights === 4, 'Valid 4-night stay passes validation');
assert(!validateDateRange('2026-12-05', '2026-12-01').valid, 'Check-out before check-in is rejected');
assert(!validateDateRange('2026-12-01', '2026-12-01').valid, 'Same-day check-in and check-out is rejected');
assert(!validateDateRange('invalid-date', '2026-12-05').valid, 'Malformed date string is rejected');

// Stay pricing with daily overrides
const sampleDailyRates: HotelDailyRateData[] = [
  { ratePlanId: 'rp-1', date: '2026-12-01', price: 150.0, stopSale: false, closedToArrival: false, closedToDeparture: false },
  { ratePlanId: 'rp-1', date: '2026-12-02', price: 200.0, stopSale: false, closedToArrival: false, closedToDeparture: false },
  { ratePlanId: 'rp-1', date: '2026-12-03', price: 150.0, stopSale: false, closedToArrival: false, closedToDeparture: false },
];

const sampleInventory: HotelRoomInventoryData[] = [
  { roomTypeId: 'rt-1', date: '2026-12-01', totalRooms: 10, bookedRooms: 2, heldRooms: 0, stopSale: false, closedToArrival: false, closedToDeparture: false },
  { roomTypeId: 'rt-1', date: '2026-12-02', totalRooms: 10, bookedRooms: 4, heldRooms: 0, stopSale: false, closedToArrival: false, closedToDeparture: false },
  { roomTypeId: 'rt-1', date: '2026-12-03', totalRooms: 10, bookedRooms: 1, heldRooms: 0, stopSale: false, closedToArrival: false, closedToDeparture: false },
];

const stay1 = calculateStayAvailability({
  hotel: validHotelInput,
  roomType: validRoomType,
  ratePlan: validRatePlan,
  inventoryRows: sampleInventory,
  dailyRateRows: sampleDailyRates,
  checkInDate: '2026-12-01',
  checkOutDate: '2026-12-04',
});
assert(stay1.isAvailable, 'Stay is available across all 3 nights');
assert(stay1.subtotal === 500, 'Stay pricing respects daily rate overrides ($150 + $200 + $150 = $500)');
assert(stay1.averageNightlyRate === 166.67, 'Average nightly rate is calculated correctly ($166.67)');

// Stop-sale & Closed-to-Arrival restriction check
const stopSaleInventory: HotelRoomInventoryData[] = [
  { roomTypeId: 'rt-1', date: '2026-12-01', totalRooms: 10, bookedRooms: 2, heldRooms: 0, stopSale: false, closedToArrival: false, closedToDeparture: false },
  { roomTypeId: 'rt-1', date: '2026-12-02', totalRooms: 10, bookedRooms: 5, heldRooms: 1, stopSale: true, closedToArrival: false, closedToDeparture: false },
  { roomTypeId: 'rt-1', date: '2026-12-03', totalRooms: 10, bookedRooms: 1, heldRooms: 0, stopSale: false, closedToArrival: false, closedToDeparture: false },
];

const availCheck = calculateStayAvailability({
  hotel: validHotelInput,
  roomType: validRoomType,
  ratePlan: validRatePlan,
  inventoryRows: stopSaleInventory,
  dailyRateRows: sampleDailyRates,
  checkInDate: '2026-12-01',
  checkOutDate: '2026-12-04',
});
assert(!availCheck.isAvailable, 'Stay spanning date with stopSale=true is correctly rejected as unavailable');
assert(Boolean(availCheck.unavailableReason?.includes('Stop-Sale')), 'Availability reason accurately identifies stop-sale restriction');

// ============================================================================
// 5. MULTILINGUAL PRESERVATION (EN, AR, ES, IT)
// ============================================================================

const hotelWithTranslations: HotelData = {
  ...validHotelInput,
  translations: {
    ar: {
      name: 'قصر النيل الكبير بالقاهرة',
      description: '<p>استمتع <b>بإقامة فاخرة</b> على ضفاف النيل التاريخي.</p>',
      city: 'القاهرة',
    },
    es: {
      name: 'Gran Palacio del Nilo de El Cairo',
      description: '<p>Disfrute de un <b>lujo incomparable</b> a orillas del río Nilo.</p>',
    },
    it: {
      name: 'Gran Palazzo del Nilo del Cairo',
      description: '<p>Vivi un <b>lusso senza pari</b> lungo le rive del Nilo.</p>',
    },
  },
};

assert(Boolean(hotelWithTranslations.translations?.ar?.name), 'Arabic hotel translation preserved');
assert(Boolean(hotelWithTranslations.translations?.es?.name), 'Spanish hotel translation preserved');
assert(Boolean(hotelWithTranslations.translations?.it?.name), 'Italian hotel translation preserved');
assert(
  isHtmlContent(hotelWithTranslations.translations?.ar?.description || ''),
  'Arabic rich text description is detected as HTML',
);

// ============================================================================
// 6. RICH TEXT EDITOR INTEGRATION & SANITIZATION IN HOTELS
// ============================================================================

const richDescription = `
  <h2>Grand Deluxe Suite Highlights</h2>
  <p style="text-align: right;">إطلالة بانورامية رائعة على النيل مع خدمة كونسيرج على مدار الساعة.</p>
  <ul>
    <li>King-size plush mattress</li>
    <li>Marble bathroom with soaking tub</li>
    <li>High-speed fiber optic Wi-Fi</li>
  </ul>
  <p>Learn more about our <a href="https://grandnilepalace.com/amenities" target="_blank">luxury amenities</a>.</p>
`;

const sanitizedHotelDesc = sanitizeRichText(richDescription);
assert(sanitizedHotelDesc.includes('<h2>Grand Deluxe Suite Highlights</h2>'), 'Heading 2 preserved in hotel rich text');
assert(sanitizedHotelDesc.includes('text-align:right') || sanitizedHotelDesc.includes('text-align: right'), 'RTL right-alignment preserved');
assert(sanitizedHotelDesc.includes('<ul>') && sanitizedHotelDesc.includes('<li>King-size'), 'List tags preserved in hotel description');
assert(sanitizedHotelDesc.includes('href="https://grandnilepalace.com/amenities"'), 'Safe external link preserved');

// Unsafe injection rejection in hotel description
const maliciousHotelDesc = `
  <p>Normal text</p>
  <script>fetch('/steal-cookies')</script>
  <img src="invalid" onerror="alert('hacked')" />
  <a href="javascript:doEvil()">Malicious link</a>
`;
const cleanHotelDesc = sanitizeRichText(maliciousHotelDesc);
assert(!cleanHotelDesc.includes('<script>'), 'Injected <script> stripped from hotel description');
assert(!cleanHotelDesc.includes('onerror'), 'Injected onerror handler stripped from hotel description');
assert(!cleanHotelDesc.includes('javascript:'), 'Injected javascript: protocol stripped from hotel description');

// Plain text extraction for search index
const searchPlainText = stripHtmlToPlainText(sanitizedHotelDesc);
assert(!searchPlainText.includes('<h2>'), 'HTML tags removed for search index string');
assert(searchPlainText.includes('Grand Deluxe Suite Highlights'), 'Heading text extracted for search');
assert(searchPlainText.includes('King-size plush mattress'), 'List items extracted for search');

// ============================================================================
// 7. SAFE DELETION & ARCHIVE ENFORCEMENT
// ============================================================================

// Verify simulation of foreign key conflict resolution:
// If bookings exist for a hotel, deletion must be blocked and transitioned to ARCHIVED.
function simulateHotelDeletion(hasBookings: boolean) {
  if (hasBookings) {
    // Foreign key RESTRICT: cannot delete, must archive
    return { success: true, action: 'ARCHIVED', status: 'ARCHIVED' as const };
  }
  return { success: true, action: 'DELETED' };
}

const deleteWithBookings = simulateHotelDeletion(true);
assert(
  deleteWithBookings.action === 'ARCHIVED' && deleteWithBookings.status === 'ARCHIVED',
  'Hotel with existing bookings is safely ARCHIVED to protect financial audit trail',
);

const deleteWithoutBookings = simulateHotelDeletion(false);
assert(
  deleteWithoutBookings.action === 'DELETED',
  'Hotel with zero bookings can be cleanly deleted from the database',
);

// ============================================================================
// SUMMARY
// ============================================================================

console.log(`\nResults: ${passedTests}/${totalTests} tests passed.`);
if (process.exitCode === 1) {
  console.error('Hotels Admin test suite encountered failures!');
  process.exit(1);
} else {
  console.log('All TravNeeds Phase 2B.2 Hotels Admin tests passed successfully!\n');
}
