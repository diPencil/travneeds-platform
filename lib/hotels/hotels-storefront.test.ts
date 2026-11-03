import assert from 'node:assert/strict';
import {
  calculateStayAvailability,
  validateOccupancy,
  calculateCancellationPenalty,
  createHotelBookingSnapshot,
} from './booking-foundation';
import {
  validateDateRange,
  roundMoney,
} from './validation';
import type {
  HotelData,
  HotelRoomTypeData,
  HotelRatePlanData,
  HotelRoomInventoryData,
  HotelDailyRateData,
} from './types';

console.log('--- Running TravNeeds Hotels Storefront & Availability Tests ---');

// Mock property
const mockHotel: HotelData = {
  id: 'hotel-test-1',
  slug: 'cairo-grand-palace',
  name: 'Cairo Grand Palace',
  nameAr: 'قصر القاهرة الكبير',
  description: '<p>Luxury Nile property</p>',
  propertyType: 'HOTEL',
  starRating: 5,
  countryCode: 'EG',
  city: 'Cairo',
  address: 'Corniche El Nil',
  checkInTime: '15:00',
  checkOutTime: '11:00',
  gallery: ['/egypt-hero.png'],
  amenities: ['Free WiFi', 'Swimming Pool'],
  status: 'PUBLISHED',
};

// Mock Room Type
const mockRoomType: HotelRoomTypeData = {
  id: 'room-deluxe-1',
  hotelId: 'hotel-test-1',
  name: 'Deluxe Nile View',
  code: 'DLX-NV',
  maxAdults: 2,
  maxChildren: 1,
  maxOccupancy: 3,
  bedConfiguration: '1 King Bed',
  roomSizeSqm: 42,
  amenities: ['Nile View', 'Balcony', 'Espresso Machine'],
  gallery: ['/egypt-hero.png'],
  isActive: true,
};

// Mock Rate Plan
const mockRatePlan: HotelRatePlanData = {
  id: 'rate-bb-1',
  roomTypeId: 'room-deluxe-1',
  name: 'Bed & Breakfast (Flexible)',
  code: 'BB-FLX',
  boardBasis: 'BED_AND_BREAKFAST',
  isRefundable: true,
  cancellationDeadlineDays: 2,
  cancellationPenaltyPercent: 100,
  currency: 'USD',
  basePrice: 150,
  minStayNights: 2,
  maxStayNights: 14,
  isActive: true,
};

// 1. Date Range Validation Tests
{
  const valid = validateDateRange('2026-12-01', '2026-12-05');
  assert.equal(valid.valid, true);
  assert.equal(valid.nights, 4);
  assert.deepEqual(valid.dates, ['2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04']);
  console.log('✅ PASSED: Valid date range correctly calculates 4 nights');

  const invalidSameDay = validateDateRange('2026-12-01', '2026-12-01');
  assert.equal(invalidSameDay.valid, false);
  console.log('✅ PASSED: Same day check-in and check-out rejected');

  const invalidReversed = validateDateRange('2026-12-05', '2026-12-01');
  assert.equal(invalidReversed.valid, false);
  console.log('✅ PASSED: Check-out before check-in rejected');
}

// 2. Occupancy Validation Tests
{
  assert.equal(validateOccupancy(mockRoomType, 2, 0).valid, true);
  assert.equal(validateOccupancy(mockRoomType, 2, 1).valid, true);
  console.log('✅ PASSED: Valid occupancy within room limits accepted');

  const zeroAdults = validateOccupancy(mockRoomType, 0, 1);
  assert.equal(zeroAdults.valid, false);
  console.log('✅ PASSED: 0 adults rejected (at least 1 adult required)');

  const excessAdults = validateOccupancy(mockRoomType, 3, 0);
  assert.equal(excessAdults.valid, false);
  console.log('✅ PASSED: Exceeding maxAdults (3 > 2) rejected');

  const excessChildren = validateOccupancy(mockRoomType, 2, 2);
  assert.equal(excessChildren.valid, false);
  console.log('✅ PASSED: Exceeding maxChildren (2 > 1) rejected');

  const excessCombined = validateOccupancy({ ...mockRoomType, maxOccupancy: 2, maxChildren: 2 }, 2, 1);
  assert.equal(excessCombined.valid, false);
  console.log('✅ PASSED: Exceeding combined maxOccupancy rejected');
}

// 3. Stay Availability & Pricing Engine Tests
{
  // 3-night inventory setup
  const baseInventory: HotelRoomInventoryData[] = [
    { roomTypeId: 'room-deluxe-1', date: '2026-12-01', totalRooms: 5, bookedRooms: 1, heldRooms: 0, stopSale: false, closedToArrival: false, closedToDeparture: false },
    { roomTypeId: 'room-deluxe-1', date: '2026-12-02', totalRooms: 5, bookedRooms: 2, heldRooms: 0, stopSale: false, closedToArrival: false, closedToDeparture: false },
    { roomTypeId: 'room-deluxe-1', date: '2026-12-03', totalRooms: 5, bookedRooms: 0, heldRooms: 0, stopSale: false, closedToArrival: false, closedToDeparture: false },
  ];

  // Standard stay calculation using base price ($150/night * 3 = $450)
  const calc1 = calculateStayAvailability({
    hotel: mockHotel,
    roomType: mockRoomType,
    ratePlan: mockRatePlan,
    inventoryRows: baseInventory,
    checkInDate: '2026-12-01',
    checkOutDate: '2026-12-04',
    roomsRequested: 1,
  });
  assert.equal(calc1.isAvailable, true);
  assert.equal(calc1.nights, 3);
  assert.equal(calc1.subtotal, 450);
  assert.equal(calc1.averageNightlyRate, 150);
  assert.equal(calc1.nightlyBreakdown.length, 3);
  console.log('✅ PASSED: Standard stay calculation produces exact subtotal and nightly breakdown');

  // Daily override pricing test ($180 weekend surge on day 2 -> $150 + $180 + $150 = $480)
  const dailyOverrides: HotelDailyRateData[] = [
    { ratePlanId: 'rate-bb-1', date: '2026-12-02', price: 180, stopSale: false, closedToArrival: false, closedToDeparture: false },
  ];
  const calc2 = calculateStayAvailability({
    hotel: mockHotel,
    roomType: mockRoomType,
    ratePlan: mockRatePlan,
    inventoryRows: baseInventory,
    dailyRateRows: dailyOverrides,
    checkInDate: '2026-12-01',
    checkOutDate: '2026-12-04',
    roomsRequested: 1,
  });
  assert.equal(calc2.isAvailable, true);
  assert.equal(calc2.subtotal, 480);
  assert.equal(calc2.averageNightlyRate, 160);
  assert.equal(calc2.nightlyBreakdown[1].finalPrice, 180);
  console.log('✅ PASSED: Daily rate override overrides ratePlan basePrice accurately');

  // Minimum stay restriction test (ratePlan minStayNights = 2, requested 1 night -> rejected)
  const calcMinStay = calculateStayAvailability({
    hotel: mockHotel,
    roomType: mockRoomType,
    ratePlan: mockRatePlan,
    inventoryRows: baseInventory,
    checkInDate: '2026-12-01',
    checkOutDate: '2026-12-02', // 1 night
    roomsRequested: 1,
  });
  assert.equal(calcMinStay.isAvailable, false);
  assert.match(calcMinStay.unavailableReason || '', /Minimum stay/);
  console.log('✅ PASSED: Minimum stay rule enforced and returns explanatory customer reason');

  // Stop-sale enforcement test (day 2 has stopSale = true)
  const stopSaleInventory: HotelRoomInventoryData[] = [
    { roomTypeId: 'room-deluxe-1', date: '2026-12-01', totalRooms: 5, bookedRooms: 0, heldRooms: 0, stopSale: false, closedToArrival: false, closedToDeparture: false },
    { roomTypeId: 'room-deluxe-1', date: '2026-12-02', totalRooms: 5, bookedRooms: 0, heldRooms: 0, stopSale: true, closedToArrival: false, closedToDeparture: false },
    { roomTypeId: 'room-deluxe-1', date: '2026-12-03', totalRooms: 5, bookedRooms: 0, heldRooms: 0, stopSale: false, closedToArrival: false, closedToDeparture: false },
  ];
  const calcStopSale = calculateStayAvailability({
    hotel: mockHotel,
    roomType: mockRoomType,
    ratePlan: mockRatePlan,
    inventoryRows: stopSaleInventory,
    checkInDate: '2026-12-01',
    checkOutDate: '2026-12-04',
    roomsRequested: 1,
  });
  assert.equal(calcStopSale.isAvailable, false);
  assert.match(calcStopSale.unavailableReason || '', /Stop-Sale/);
  console.log('✅ PASSED: Stop-sale on any stay night rejects reservation');

  // Closed to arrival enforcement test (arrival date has closedToArrival = true)
  const ctaInventory: HotelRoomInventoryData[] = [
    { roomTypeId: 'room-deluxe-1', date: '2026-12-01', totalRooms: 5, bookedRooms: 0, heldRooms: 0, stopSale: false, closedToArrival: true, closedToDeparture: false },
    { roomTypeId: 'room-deluxe-1', date: '2026-12-02', totalRooms: 5, bookedRooms: 0, heldRooms: 0, stopSale: false, closedToArrival: false, closedToDeparture: false },
  ];
  const calcCTA = calculateStayAvailability({
    hotel: mockHotel,
    roomType: mockRoomType,
    ratePlan: mockRatePlan,
    inventoryRows: ctaInventory,
    checkInDate: '2026-12-01',
    checkOutDate: '2026-12-03',
    roomsRequested: 1,
  });
  assert.equal(calcCTA.isAvailable, false);
  assert.match(calcCTA.unavailableReason || '', /Closed to Arrival/);
  console.log('✅ PASSED: Closed to Arrival (CTA) rejects check-in on restricted date');

  // Sold-out inventory test (total: 5, booked: 4, held: 1 -> 0 available, requested 1)
  const soldOutInventory: HotelRoomInventoryData[] = [
    { roomTypeId: 'room-deluxe-1', date: '2026-12-01', totalRooms: 5, bookedRooms: 4, heldRooms: 1, stopSale: false, closedToArrival: false, closedToDeparture: false },
    { roomTypeId: 'room-deluxe-1', date: '2026-12-02', totalRooms: 5, bookedRooms: 0, heldRooms: 0, stopSale: false, closedToArrival: false, closedToDeparture: false },
  ];
  const calcSoldOut = calculateStayAvailability({
    hotel: mockHotel,
    roomType: mockRoomType,
    ratePlan: mockRatePlan,
    inventoryRows: soldOutInventory,
    checkInDate: '2026-12-01',
    checkOutDate: '2026-12-03',
    roomsRequested: 1,
  });
  assert.equal(calcSoldOut.isAvailable, false);
  assert.match(calcSoldOut.unavailableReason || '', /Insufficient rooms/);
  console.log('✅ PASSED: Overbooking prevented when totalRooms - (booked + held) < requestedRooms');
}

// 4. Cancellation Penalty & Refund Calculation Tests
{
  // 5 days before check-in with 2-day deadline -> 100% free cancellation
  const checkIn = '2026-12-10';
  const now = new Date('2026-12-05T12:00:00Z');
  const penaltyFree = calculateCancellationPenalty(mockRatePlan, 400, checkIn, now);
  assert.equal(penaltyFree.isFreeCancellation, true);
  assert.equal(penaltyFree.penaltyAmount, 0);
  assert.equal(penaltyFree.refundAmount, 400);
  console.log('✅ PASSED: Free cancellation within deadline yields 0 penalty and 100% refund');

  // 1 day before check-in with 2-day deadline -> Late cancellation penalty
  const lateDate = new Date('2026-12-09T14:00:00Z');
  const penaltyLate = calculateCancellationPenalty(mockRatePlan, 400, checkIn, lateDate);
  assert.equal(penaltyLate.isFreeCancellation, false);
  assert.equal(penaltyLate.penaltyPercent, 100);
  assert.equal(penaltyLate.penaltyAmount, 400);
  assert.equal(penaltyLate.refundAmount, 0);
  console.log('✅ PASSED: Late cancellation enforces penalty percent');

  // Non-refundable rate plan
  const nonRefPlan: HotelRatePlanData = { ...mockRatePlan, isRefundable: false };
  const penaltyNonRef = calculateCancellationPenalty(nonRefPlan, 400, checkIn, now);
  assert.equal(penaltyNonRef.isRefundable, false);
  assert.equal(penaltyNonRef.penaltyAmount, 400);
  assert.equal(penaltyNonRef.refundAmount, 0);
  console.log('✅ PASSED: Non-refundable rate plan charges 100% penalty at any time');
}

// 5. Multi-Room Snapshot Building Test
{
  const calcRoom1 = calculateStayAvailability({
    hotel: mockHotel,
    roomType: mockRoomType,
    ratePlan: mockRatePlan,
    inventoryRows: [
      { roomTypeId: 'room-deluxe-1', date: '2026-12-01', totalRooms: 5, bookedRooms: 0, heldRooms: 0, stopSale: false, closedToArrival: false, closedToDeparture: false },
      { roomTypeId: 'room-deluxe-1', date: '2026-12-02', totalRooms: 5, bookedRooms: 0, heldRooms: 0, stopSale: false, closedToArrival: false, closedToDeparture: false },
    ],
    checkInDate: '2026-12-01',
    checkOutDate: '2026-12-03',
  });

  const snapshot = createHotelBookingSnapshot({
    hotel: mockHotel,
    checkInDate: '2026-12-01',
    checkOutDate: '2026-12-03',
    guestName: 'Kareem Tarek',
    guestEmail: 'kareem@example.com',
    guestPhone: '+201001234567',
    roomCalculations: [
      {
        calculation: calcRoom1,
        request: { roomTypeId: 'room-deluxe-1', ratePlanId: 'rate-bb-1', adults: 2, children: 0 },
      },
      {
        calculation: calcRoom1,
        request: { roomTypeId: 'room-deluxe-1', ratePlanId: 'rate-bb-1', adults: 1, children: 1, childAges: [7] },
      },
    ],
  });

  assert.equal(snapshot.hotelName, 'Cairo Grand Palace');
  assert.equal(snapshot.nights, 2);
  assert.equal(snapshot.rooms.length, 2);
  assert.equal(snapshot.totalPrice, 600); // 300 + 300
  assert.equal(snapshot.rooms[1].childAges, '7');
  console.log('✅ PASSED: Multi-room booking snapshot generated with frozen line totals and child ages');
}

console.log('\n--- All 16 Storefront & Availability Tests Passed Successfully! ---');

