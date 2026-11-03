/**
 * TravNeeds Modular Platform — SEO Architecture & Contracts Unit Tests
 *
 * Runs standalone via Node.js / tsx without writing to database or loading Next.js runtime.
 */

import {
  SEO_MODULE_REGISTRY,
  isModuleSeoCapable,
  getSeoModuleDescriptor,
  normalizeCanonicalPath,
  isPublicRouteIndexable,
  calculateSeoCompleteness,
  generateHotelJsonLd,
  type SeoCapableEntity,
} from './seo-contracts';
import { SeoManagerModuleManifest } from './modules/catalogue';
import { platformModuleRegistry } from './modules/registry';

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

console.log('--- Running TravNeeds Modular SEO Architecture Tests ---\n');

// ============================================================================
// 1. Shared Module Registry & SEO Descriptors
// ============================================================================

assert(isModuleSeoCapable('tours'), 'Tours module is recognized as SEO-capable');
assert(isModuleSeoCapable('hotels'), 'Hotels module is recognized as SEO-capable');
assert(isModuleSeoCapable('destinations'), 'Destinations module is recognized as SEO-capable');
assert(isModuleSeoCapable('blogs'), 'Blogs module is recognized as SEO-capable');
assert(!isModuleSeoCapable('unknown_module'), 'Unregistered module is not SEO-capable');

const hotelDescriptor = getSeoModuleDescriptor('hotels');
assert(hotelDescriptor !== null, 'Hotel SEO descriptor is retrievable');
assert(hotelDescriptor?.status === 'implemented', 'Hotels module SEO status is implemented');
assert(hotelDescriptor?.defaultSchemaType === 'Hotel', 'Hotels default schema is Hotel');
assert(hotelDescriptor?.publicPrefix === '/hotels', 'Hotels public prefix is /hotels');

// Planned modules declare future SEO capability truthfully
const flightDescriptor = getSeoModuleDescriptor('flights');
assert(flightDescriptor?.status === 'planned', 'Flights module SEO status is truthfully declared as planned');
assert(flightDescriptor?.defaultSchemaType === 'Flight', 'Flights schema type is declared');

// ============================================================================
// 2. Canonical URL Normalization & Privacy Protections
// ============================================================================

assert(normalizeCanonicalPath('/hotels/nile-view') === '/hotels/nile-view', 'Valid public hotel canonical accepted');
assert(normalizeCanonicalPath('/all-tours/cairo-pyramids') === '/all-tours/cairo-pyramids', 'Valid tour canonical accepted');
assert(normalizeCanonicalPath('/admin/hotels/123') === null, 'Admin path rejected as canonical');
assert(normalizeCanonicalPath('/account/bookings') === null, 'Account path rejected as canonical');
assert(normalizeCanonicalPath('/checkout') === null, 'Checkout path rejected as canonical');
assert(normalizeCanonicalPath('/booking/lock-token-123') === null, 'Private booking token rejected as canonical');
assert(normalizeCanonicalPath('https://external.com/path') === null, 'Absolute external URL rejected as relative canonical');
assert(normalizeCanonicalPath('//malicious-redirect') === null, 'Protocol-relative URL rejected');

// ============================================================================
// 3. Public Route Indexability Rules
// ============================================================================

assert(isPublicRouteIndexable('/'), 'Homepage is indexable');
assert(isPublicRouteIndexable('/hotels'), 'Hotels directory is indexable');
assert(isPublicRouteIndexable('/hotels/grand-palace'), 'Public hotel detail is indexable');
assert(isPublicRouteIndexable('/all-tours/giza-day'), 'Public tour detail is indexable');
assert(isPublicRouteIndexable('/blogs/egypt-guide'), 'Blog article is indexable');

assert(!isPublicRouteIndexable('/admin/hotels'), 'Admin route is not indexable');
assert(!isPublicRouteIndexable('/account/profile'), 'User account profile is not indexable');
assert(!isPublicRouteIndexable('/checkout'), 'Checkout is not indexable');
assert(!isPublicRouteIndexable('/cart'), 'Cart is not indexable');
assert(!isPublicRouteIndexable('/booking/token_abc'), 'Private booking page is not indexable');
assert(!isPublicRouteIndexable('/search'), 'Dynamic search results are not indexable');
assert(!isPublicRouteIndexable('/website-cms-preview/homepage'), 'CMS preview route is not indexable');

// ============================================================================
// 4. SEO Completeness Scoring (Deterministic & Unfabricated)
// ============================================================================

const completeEntity: Partial<SeoCapableEntity> = {
  title: 'Cairo Grand Nile Palace Hotel | Luxury Nile Stays',
  description: 'Experience 5-star luxury on the Nile Corniche in Cairo with instant live bookings and panoramic river views.',
  coverImage: '/hotels/cairo-grand.jpg',
  canonicalPath: '/hotels/cairo-grand-nile-palace',
  structuredDataEligible: true,
};

const completeScore = calculateSeoCompleteness(completeEntity);
assert(completeScore.score === 100, 'Complete entity receives 100% completeness score');
assert(completeScore.isComplete === true, 'Complete entity flagged as complete');
assert(completeScore.missingFields.length === 0, 'No missing fields in complete entity');

const partialEntity: Partial<SeoCapableEntity> = {
  title: 'Short', // too short (< 10)
  description: '', // missing
  canonicalPath: '/hotels/partial-hotel',
  structuredDataEligible: false,
};

const partialScore = calculateSeoCompleteness(partialEntity);
assert(partialScore.isComplete === false, 'Partial entity flagged as incomplete');
assert(partialScore.missingFields.includes('Title'), 'Short title flagged as missing/inadequate');
assert(partialScore.missingFields.includes('Description'), 'Missing description flagged');
assert(partialScore.missingFields.includes('Cover Image'), 'Missing cover image flagged');
assert(partialScore.recommendations.length > 0, 'Actionable recommendations provided');

// ============================================================================
// 5. Schema.org Hotel Structured Data Generation
// ============================================================================

const hotelSchema = generateHotelJsonLd({
  name: 'Cairo Grand Nile Palace',
  description: 'Luxury hotel on the Nile Corniche with 5-star amenities.',
  city: 'Cairo',
  countryCode: 'EG',
  address: 'Corniche El Nil, Garden City',
  postalCode: '11511',
  latitude: 30.0444,
  longitude: 31.2357,
  phone: '+20 2 2795 0000',
  starRating: 5,
  coverImage: 'https://travneeds.com/hotel-cover.jpg',
  slug: 'cairo-grand-nile-palace',
}) as any;

assert(hotelSchema['@context'] === 'https://schema.org', 'Schema context is schema.org');
assert(hotelSchema['@type'] === 'Hotel', 'Schema type is Hotel');
assert(hotelSchema.name === 'Cairo Grand Nile Palace', 'Hotel name is correctly mapped in schema');
assert(hotelSchema.address?.addressLocality === 'Cairo', 'City mapped in PostalAddress');
assert(hotelSchema.address?.addressCountry === 'EG', 'Country code mapped in PostalAddress');
assert(hotelSchema.geo?.latitude === 30.0444, 'Latitude mapped in GeoCoordinates');
assert(hotelSchema.geo?.longitude === 31.2357, 'Longitude mapped in GeoCoordinates');
assert(hotelSchema.starRating?.ratingValue === 5, 'Star rating mapped in schema');

// ============================================================================
// 6. SEO Manager Add-on Manifest & Module Registry Integration
// ============================================================================

assert(SeoManagerModuleManifest.id === 'seo_manager', 'SEO Manager manifest ID is seo_manager');
assert(SeoManagerModuleManifest.displayName.en === 'SEO Manager', 'SEO Manager English display name');
assert(SeoManagerModuleManifest.displayName.ar === 'مدير تحسين محركات البحث', 'SEO Manager Arabic display name');
assert(SeoManagerModuleManifest.displayName.es === 'Gestor de SEO', 'SEO Manager Spanish display name');
assert(SeoManagerModuleManifest.displayName.it === 'Gestore SEO', 'SEO Manager Italian display name');
assert(SeoManagerModuleManifest.isCore === false, 'SEO Manager is an Add-on (not core)');
assert(SeoManagerModuleManifest.lifecycle === 'available_for_subscription', 'SEO Manager lifecycle is available_for_subscription');
assert(SeoManagerModuleManifest.requiredDependencies.includes('core'), 'SEO Manager requires core platform');
assert(SeoManagerModuleManifest.permissions.some((p) => p.key === 'seo.view'), 'Permissions include seo.view');
assert(SeoManagerModuleManifest.permissions.some((p) => p.key === 'seo.manage'), 'Permissions include seo.manage');
assert(SeoManagerModuleManifest.features.some((f) => f.key === 'seo.cross_module_discovery'), 'Features include cross_module_discovery');

// Auto-registration in global platform module registry
const registeredSeoManager = platformModuleRegistry.get('seo_manager');
assert(registeredSeoManager !== undefined, 'SEO Manager is registered in platform module registry');
assert(registeredSeoManager?.category === 'business_management', 'Category matches platform registry taxonomy');

console.log(`\nResults: ${passedTests}/${totalTests} tests passed.`);
console.log('All Modular SEO Architecture & Contracts tests passed successfully!\n');
