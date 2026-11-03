/**
 * TravNeeds Modular Platform — Cross-Module SEO Contracts
 *
 * Defines the unified contracts, module descriptors, and single-source-of-truth
 * rules connecting content modules (Tours, Hotels, Blogs, Destinations, CMS, etc.)
 * with the Core SEO Foundation and the SEO Manager Add-on.
 */

import { type EnabledLocale, ALL_LOCALES, type Locale } from './locale-config';
import { resolveSiteUrl } from './seo';
import { stripHtmlToPlainText } from './rich-text';

export type SeoSchemaType =
  | 'TouristTrip'
  | 'Hotel'
  | 'Article'
  | 'Place'
  | 'Event'
  | 'WebPage'
  | 'CollectionPage'
  | 'TravelAgency'
  | 'Product'
  | 'Flight'
  | 'Trip'
  | 'GovernmentService'
  | 'Action';

/**
 * Universal interface that every public SEO-capable entity must expose.
 * Guarantees that SEO Manager and Core SEO Foundation consume uniform data.
 */
export interface SeoCapableEntity {
  /** Stable module ID owning this content (e.g. 'tours', 'hotels', 'blogs') */
  readonly moduleId: string;

  /** Technical entity ID inside module */
  readonly entityId: string;

  /** Content kind discriminator (e.g. 'tour', 'hotel', 'blog') */
  readonly kind: string;

  /** Unique URL-friendly slug */
  readonly slug: string;

  /** Internal or canonical display name */
  readonly name: string;

  /** Canonical relative path on the public website (e.g. '/hotels/cairo-grand') */
  readonly canonicalPath: string;

  /** Absolute canonical URL */
  readonly canonicalUrl: string;

  /** Whether the parent business entity is published */
  readonly isPublished: boolean;

  /** Whether this entity should be indexed by search engines */
  readonly isIndexable: boolean;

  /** Primary SEO title */
  readonly title: string;

  /** Primary SEO description */
  readonly description: string;

  /** Primary social/open-graph cover image URL */
  readonly coverImage?: string;

  /** Last updated ISO timestamp */
  readonly updatedAt?: string;

  /** Multilingual localized title and description overrides */
  readonly localized?: Partial<
    Record<
      Locale,
      {
        title?: string;
        description?: string;
        ogTitle?: string;
        ogDescription?: string;
      }
    >
  >;

  /** Whether structured data / JSON-LD should be rendered for this entity */
  readonly structuredDataEligible: boolean;

  /** Schema.org semantic type for JSON-LD generation */
  readonly schemaType: SeoSchemaType;
}

/**
 * Metadata descriptor for an SEO-capable module in the platform.
 */
export interface SeoModuleDescriptor {
  readonly moduleId: string;
  readonly name: string;
  readonly status: 'implemented' | 'planned';
  readonly supportedKinds: readonly string[];
  readonly defaultSchemaType: SeoSchemaType;
  readonly publicPrefix: string | null;
  readonly adminEditorPrefix: string;
  readonly description: {
    en: string;
    ar: string;
  };
}

/**
 * Unified Catalogue of SEO-capable content modules.
 * Implemented modules produce live indexable URLs.
 * Planned modules declare future SEO integration contracts without creating fake routes.
 */
export const SEO_MODULE_REGISTRY: Record<string, SeoModuleDescriptor> = {
  tours: {
    moduleId: 'tours',
    name: 'Tours & Packages',
    status: 'implemented',
    supportedKinds: ['tour'],
    defaultSchemaType: 'TouristTrip',
    publicPrefix: '/all-tours',
    adminEditorPrefix: '/admin/trips/builder',
    description: {
      en: 'Multi-day packages, one-day tours, and shore excursions.',
      ar: 'البرامج السياحية متعددة الأيام والرحلات اليومية والجولات الشاطئية.',
    },
  },
  hotels: {
    moduleId: 'hotels',
    name: 'Hotels & Lodging',
    status: 'implemented',
    supportedKinds: ['hotel'],
    defaultSchemaType: 'Hotel',
    publicPrefix: '/hotels',
    adminEditorPrefix: '/admin/hotels',
    description: {
      en: 'Hotel properties, resorts, and Nile lodgings.',
      ar: 'المنشآت الفندقية، المنتجعات، والإقامات النيلية.',
    },
  },
  destinations: {
    moduleId: 'destinations',
    name: 'Destinations Guide',
    status: 'implemented',
    supportedKinds: ['destination'],
    defaultSchemaType: 'Place',
    publicPrefix: '/destinations',
    adminEditorPrefix: '/admin/destinations/new',
    description: {
      en: 'Travel destinations, city landing pages, and regional highlights.',
      ar: 'المدن والوجهات السياحية وصفحات المعالم الإقليمية.',
    },
  },
  blogs: {
    moduleId: 'blogs',
    name: 'Travel Articles & Blog',
    status: 'implemented',
    supportedKinds: ['blog'],
    defaultSchemaType: 'Article',
    publicPrefix: '/blogs',
    adminEditorPrefix: '/admin/blogs/new',
    description: {
      en: 'Editorial travel guides, stories, and cultural insights.',
      ar: 'المقالات التحريرية، القصص، وأدلة السفر الثقافية.',
    },
  },
  events: {
    moduleId: 'events',
    name: 'Special Events & Occasions',
    status: 'implemented',
    supportedKinds: ['event'],
    defaultSchemaType: 'Event',
    publicPrefix: '/events',
    adminEditorPrefix: '/admin/events/new',
    description: {
      en: 'Seasonal festival programs and special holiday events.',
      ar: 'برامج المهرجانات الموسمية والمناسبات السياحية الخاصة.',
    },
  },
  offers: {
    moduleId: 'offers',
    name: 'Special Offers & Deals',
    status: 'implemented',
    supportedKinds: ['offer'],
    defaultSchemaType: 'Product',
    publicPrefix: '/special-offers',
    adminEditorPrefix: '/admin/offers/new',
    description: {
      en: 'Promotional landing pages and seasonal deals.',
      ar: 'عروض السفر الترويجية والخصومات الموسمية.',
    },
  },
  categories: {
    moduleId: 'categories',
    name: 'Tour Categories & Themes',
    status: 'implemented',
    supportedKinds: ['category'],
    defaultSchemaType: 'CollectionPage',
    publicPrefix: '/all-tours/multi-days-tours',
    adminEditorPrefix: '/admin/multi-day-categories',
    description: {
      en: 'Themed tour catalogues and collection landing pages.',
      ar: 'كتالوجات الرحلات المصنفة حسب الفئات والاهتمامات.',
    },
  },
  cms_pages: {
    moduleId: 'cms_pages',
    name: 'Static & Informational CMS Pages',
    status: 'implemented',
    supportedKinds: ['cms', 'template'],
    defaultSchemaType: 'WebPage',
    publicPrefix: '',
    adminEditorPrefix: '/admin/website-cms/pages',
    description: {
      en: 'About, FAQ, Contact, Accessible Travel, and Egypt Guide.',
      ar: 'صفحات نبذة عنا، الأسئلة الشائعة، اتصل بنا، والسياحة الميسرة.',
    },
  },
  // Future planned modules (Contract declared without fake routes)
  flights: {
    moduleId: 'flights',
    name: 'Flights Booking',
    status: 'planned',
    supportedKinds: ['flight'],
    defaultSchemaType: 'Flight',
    publicPrefix: '/flights',
    adminEditorPrefix: '/admin/flights',
    description: {
      en: 'Domestic and international flight routes and schedules.',
      ar: 'مسارات وجداول رحلات الطيران الداخلية والدولية.',
    },
  },
  transfers: {
    moduleId: 'transfers',
    name: 'Transfers & Chauffeur Fleet',
    status: 'planned',
    supportedKinds: ['transfer'],
    defaultSchemaType: 'Trip',
    publicPrefix: '/transfers',
    adminEditorPrefix: '/admin/transfers',
    description: {
      en: 'Airport transfers and private chauffeur transfer routes.',
      ar: 'خدمات التوصيل من وإلى المطارات والنقل بسيارات خاصة.',
    },
  },
  visas: {
    moduleId: 'visas',
    name: 'Visa Services',
    status: 'planned',
    supportedKinds: ['visa'],
    defaultSchemaType: 'GovernmentService',
    publicPrefix: '/visas',
    adminEditorPrefix: '/admin/visas',
    description: {
      en: 'Tourist visa information, entry requirements, and assistance.',
      ar: 'معلومات التأشيرات السياحية وشروط الدخول وخدمات التقديم.',
    },
  },
  hajj_umrah: {
    moduleId: 'hajj_umrah',
    name: 'Hajj & Umrah Pilgrimage',
    status: 'planned',
    supportedKinds: ['pilgrimage'],
    defaultSchemaType: 'TouristTrip',
    publicPrefix: '/hajj-umrah',
    adminEditorPrefix: '/admin/hajj-umrah',
    description: {
      en: 'Pilgrimage packages and holy sanctuaries guidance.',
      ar: 'برامج الحج والعمرة وإرشادات الزيارة الدينية.',
    },
  },
  activities: {
    moduleId: 'activities',
    name: 'Activities & Excursions',
    status: 'planned',
    supportedKinds: ['activity'],
    defaultSchemaType: 'Action',
    publicPrefix: '/activities',
    adminEditorPrefix: '/admin/activities',
    description: {
      en: 'Local experiences, museum tickets, and desert safaris.',
      ar: 'الأنشطة المحلية وتذاكر المتاحف ورحلات السفاري.',
    },
  },
};

/**
 * Checks if a given module ID has registered SEO capability.
 */
export function isModuleSeoCapable(moduleId: string): boolean {
  return Object.hasOwn(SEO_MODULE_REGISTRY, moduleId);
}

/**
 * Returns the SEO descriptor for a module, if registered.
 */
export function getSeoModuleDescriptor(moduleId: string): SeoModuleDescriptor | null {
  return SEO_MODULE_REGISTRY[moduleId] ?? null;
}

/**
 * Normalizes and validates a canonical path.
 * Must be a leading-slash relative site path, free of query strings, fragments, or private routes.
 */
export function normalizeCanonicalPath(path: string): string | null {
  if (!path || typeof path !== 'string') return null;
  const clean = path.trim();
  if (!/^\/(?!\/)[a-z0-9/-]*$/.test(clean) || clean.includes('//')) return null;

  // Protect private and sensitive operational routes from canonicalization
  const privatePattern =
    /^\/(admin|account|api|checkout|cart|login|register|forgot-password|reset-password|search|booking|website-cms-preview|verify-voucher)(\/|$)/;
  if (privatePattern.test(clean)) return null;

  return clean;
}

/**
 * Evaluates whether a public path is indexable based on security and operational rules.
 * Never indexes private bookings, account dashboards, or sensitive user workflows.
 */
export function isPublicRouteIndexable(path: string): boolean {
  if (!path || typeof path !== 'string') return false;
  const normalized = path.trim().toLowerCase();

  const privatePrefixes = [
    '/admin',
    '/account',
    '/api',
    '/checkout',
    '/cart',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/booking',
    '/search',
    '/website-cms-preview',
    '/verify-voucher',
    '/rent-car/request',
  ];

  return !privatePrefixes.some((prefix) => normalized === prefix || normalized.startsWith(prefix + '/'));
}

/**
 * SEO Completeness Audit result for any content entity.
 */
export interface SeoCompletenessScore {
  readonly score: number; // 0 to 100
  readonly isComplete: boolean;
  readonly missingFields: string[];
  readonly recommendations: string[];
}

/**
 * Evaluates SEO completeness truthfully based on concrete metadata presence.
 * Does not simulate arbitrary scores.
 */
export function calculateSeoCompleteness(entity: Partial<SeoCapableEntity>): SeoCompletenessScore {
  const missing: string[] = [];
  const recommendations: string[] = [];
  let points = 0;
  const totalPoints = 100;

  // Title: 25 points
  if (entity.title && entity.title.trim().length >= 10) {
    points += 25;
    if (entity.title.trim().length > 60) {
      recommendations.push('Title exceeds 60 characters and may be truncated in search results.');
    }
  } else {
    missing.push('Title');
    recommendations.push('Add an informative SEO title between 10 and 60 characters.');
  }

  // Description: 25 points
  if (entity.description && entity.description.trim().length >= 50) {
    points += 25;
    if (entity.description.trim().length > 160) {
      recommendations.push('Description exceeds 160 characters and may be truncated by search engines.');
    }
  } else {
    missing.push('Description');
    recommendations.push('Add a descriptive meta summary between 50 and 160 characters.');
  }

  // Cover image: 20 points
  if (entity.coverImage && entity.coverImage.trim().length > 0) {
    points += 20;
  } else {
    missing.push('Cover Image');
    recommendations.push('Set a high-resolution cover image for social sharing cards.');
  }

  // Canonical path: 15 points
  if (entity.canonicalPath && normalizeCanonicalPath(entity.canonicalPath)) {
    points += 15;
  } else {
    missing.push('Canonical URL');
    recommendations.push('Specify a clean public canonical path.');
  }

  // Structured data: 15 points
  if (entity.structuredDataEligible) {
    points += 15;
  } else {
    recommendations.push('Enable Schema.org structured data to enhance rich snippet eligibility.');
  }

  return {
    score: points,
    isComplete: missing.length === 0,
    missingFields: missing,
    recommendations,
  };
}

/**
 * Generate Hotel JSON-LD Schema.org metadata for public hotel presentation.
 */
export function generateHotelJsonLd(hotel: {
  name: string;
  description?: string;
  city?: string;
  countryCode?: string;
  address?: string;
  postalCode?: string | null;
  latitude?: number | string | { toString(): string } | null;
  longitude?: number | string | { toString(): string } | null;
  phone?: string | null;
  starRating?: number | null;
  coverImage?: string | null;
  slug: string;
}): object {
  const SITE_URL = resolveSiteUrl();
  const hotelUrl = `${SITE_URL}/hotels/${hotel.slug}`;
  const description = hotel.description
    ? stripHtmlToPlainText(hotel.description).slice(0, 300)
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    '@id': hotelUrl,
    name: hotel.name,
    ...(description ? { description } : {}),
    url: hotelUrl,
    ...(hotel.coverImage ? { image: [hotel.coverImage] } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: hotel.address || undefined,
      addressLocality: hotel.city || 'Cairo',
      addressCountry: hotel.countryCode || 'EG',
      ...(hotel.postalCode ? { postalCode: hotel.postalCode } : {}),
    },
    ...(hotel.latitude && hotel.longitude
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: Number(hotel.latitude),
            longitude: Number(hotel.longitude),
          },
        }
      : {}),
    ...(hotel.phone ? { telephone: hotel.phone } : {}),
    ...(hotel.starRating
      ? {
          starRating: {
            '@type': 'Rating',
            ratingValue: hotel.starRating,
          },
        }
      : {}),
  };
}
