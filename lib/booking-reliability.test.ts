import assert from 'node:assert/strict';
import { cartKey, removeAddonFromCartItem, sanitizeCartItem, type CartItem } from './cart';
import { estimateCart, resolveCartLine, validateLineHeadcount } from './booking';
import type { Tour } from '@/data/types';

console.log('--- Running TravNeeds Cart & Booking Reliability Tests ---');

// 1. cartKey normalization
{
  const item1: Omit<CartItem, 'key'> = {
    tourSlug: 'cairo-day-tour',
    title: 'Cairo Day Tour',
    image: '',
    date: '2026-12-01',
    adults: 2,
    children: 1,
    infants: 0,
    addons: ['Lunch', 'Guide'],
    addonTotal: 30,
    adultUnit: 50,
    childUnit: 25,
    infantUnit: 0,
    total: 155,
  };
  const item2: Omit<CartItem, 'key'> = {
    ...item1,
    tourSlug: '  CAIRO-DAY-TOUR  ',
    addons: ['Guide', 'Lunch'], // different order
  };
  assert.equal(cartKey(item1), cartKey(item2), 'cartKey must be deterministic across addon order and slug casing');
  console.log('✅ PASSED: cartKey normalization and deterministic ordering');
}

// 2. Headcount boundaries
{
  assert.equal(validateLineHeadcount({ adults: 0, children: 1, infants: 0 }), 'adults_required');
  assert.equal(validateLineHeadcount({ adults: 51, children: 0, infants: 0 }), 'adults_max');
  assert.equal(validateLineHeadcount({ adults: 2, children: 51, infants: 0 }), 'children_max');
  assert.equal(validateLineHeadcount({ adults: 2, children: 0, infants: 51 }), 'infants_max');
  assert.equal(validateLineHeadcount({ adults: 40, children: 20, infants: 5 }), 'total_max'); // 65 > 60
  assert.equal(validateLineHeadcount({ adults: 2, children: 2, infants: 1 }), null); // 5 is valid
  console.log('✅ PASSED: Headcount validation bounds (min 1 adult, max 50 per type, max 60 total)');
}

// 3. Dynamic published tour resolution
{
  const dynamicTour: Tour = {
    slug: 'new-published-luxor-trip',
    title: 'New Published Luxor Trip',
    category: 'multi-days-tours',
    location: 'Luxor',
    price: 300,
    duration: '3 Days',
    image: '/luxor.jpg',
    summary: 'A wonderful Luxor trip',
    detail: {
      overview: ['Overview'],
      highlights: [],
      itinerary: [],
      locations: [],
      addOns: [
        { title: 'Hot Air Balloon', price: 120 },
        { title: 'Private Photographer' }, // unpriced / on-request
      ],
    },
  };

  const cartItem: CartItem = {
    key: 'item-1',
    tourSlug: 'new-published-luxor-trip',
    title: 'New Published Luxor Trip',
    image: '/luxor.jpg',
    date: '2026-11-15',
    adults: 2,
    children: 0,
    infants: 0,
    addons: ['Hot Air Balloon', 'Private Photographer'],
    addonTotal: 120,
    adultUnit: 300,
    childUnit: 0,
    infantUnit: 0,
    total: 720,
  };

  // Without live catalog, dynamic tour would be stale
  const staleResolution = resolveCartLine(cartItem);
  assert.equal(staleResolution.stale, true, 'Without dynamic tour in catalog, it is marked stale');

  // With live catalog passed, it resolves cleanly!
  const liveResolution = resolveCartLine(cartItem, [dynamicTour]);
  assert.equal(liveResolution.stale, false, 'Dynamic tour from database resolves as valid');
  assert.equal(liveResolution.pricedAddons.length, 1);
  assert.equal(liveResolution.pricedAddons[0], 'Hot Air Balloon');
  assert.equal(liveResolution.onRequestAddons.length, 1);
  assert.equal(liveResolution.onRequestAddons[0], 'Private Photographer');
  assert.equal(liveResolution.addonTotal, 120, 'Unpriced add-on is NOT added to total and NOT free');
  console.log('✅ PASSED: Dynamic DB tours resolve cleanly and unpriced add-ons are kept on-request');
}

console.log('--- All Cart & Booking Reliability Tests Passed Successfully! ---');
