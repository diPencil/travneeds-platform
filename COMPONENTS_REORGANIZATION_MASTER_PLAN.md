# TravNeeds Components Reorganization Master Plan

**Date**: November 3, 2026  
**Baseline Git Commit**: `dc2c111` (`refactor(components): reorganize components into modular domain directories (batches 1-5)`)  
**Status**: In Progress  

---

## 1. Executive Summary

This Master Plan establishes the definitive domain-driven architectural roadmap to organize all remaining flat components across `components/` and `components/admin/` into high-cohesion, low-coupling directories without altering any application behaviour, styling, or contracts.

### Batches 1–5 Retrospective (Completed & Pushed in Commit `dc2c111`)
- **Cars Domain**: `components/cars/` & `components/admin/cars/` (5 files)
- **SEO Domain**: `components/admin/seo/` (4 files)
- **Tours Domain**: `components/tours/` (4 files)
- **CMS Domain**: `components/admin/cms/` (7 files)
- **Destinations & Blogs**: `components/admin/destinations/` & `components/admin/blogs/` (4 files)
- **Verification**: 268/268 tests passing, 289 routes generating, 0 TypeScript errors.

---

## 2. Complete Remaining Component Inventory & Classification

### A. Root `components/` Directory (6 Intentionally Retained Core Orchestrators & Localization Providers)

| Current File | Domain | Responsibility | Importing Files | Target Location | Risk |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`review-marquee.tsx`** | Reviews | Horizontal animated review marquee | `provider-reviews.tsx`, `website-reviews.tsx` | `components/reviews/` | Low |
| **`website-reviews.tsx`** | Reviews | Curated site review section | `provider-reviews.tsx` | `components/reviews/` | Low |
| **`provider-reviews.tsx`** | Reviews | Consolidated provider reviews | `homepage.tsx` | `components/reviews/` | Low |
| **`reviews.tsx`** & **`reviews-phase6.css`** | Reviews | Tour review drawer & reviews list | `day-tour-detail.tsx`, `tour-detail.tsx` | `components/reviews/` | Low |
| **`account-portal.tsx`** | Account | Core customer dashboard & guest portal | 16 app routes (`/account/**`, `/booking/[token]`) | `components/account/` | Med |
| **`account-custom-trip.tsx`** | Account | Customer custom trip request list | `account-portal.tsx` | `components/account/` | Low |
| **`account-event-requests.tsx`** | Account | Customer event requests list | `account-portal.tsx` | `components/account/` | Low |
| **`authenticated-user.tsx`** | Account | React Context for logged-in user | `account/layout.tsx`, `account-portal.tsx` | `components/account/` | Low |
| **`impersonation-banner.tsx`** | Account | Staff user impersonation notice | `extended-pages.tsx` | `components/account/` (Completed in Batch 18) | Low |
| **`booking-payment.tsx`** | Booking | Offline bank / Card payment panel | `account-portal.tsx`, `checkout-page.tsx`, `booking-print-document.tsx` | `components/booking/` | Med |
| **`booking-print-document.tsx`** | Booking | Print preview for vouchers & invoices | `account-portal.tsx` | `components/booking/` | Low |
| **`cart-page.tsx`** | Booking | Shopping cart view & checkout CTA | `/cart/page.tsx` | `components/booking/` | Low |
| **`checkout-page.tsx`** | Booking | Checkout stepper & payment selection | `/checkout/page.tsx` | `components/booking/` | Med |
| **`mobile-booking-shortcut.tsx`** | Booking | Sticky mobile bottom booking bar | `day-tour-detail.tsx`, `tour-detail.tsx` | `components/booking/` | Low |
| **`trips-page.tsx`** | Tours | Public catalog & filtering | `/trips/page.tsx` | `components/` (Intentionally Retained in root) | High |
| **`brand-context.tsx`** | Layout | Dynamic white-label branding | `site.tsx`, `layout.tsx` | `components/layout/` (Completed in Batch 17) | Med |
| **`brand-favicon.tsx`** | Layout | Dynamic favicon tags | `layout.tsx` | `components/layout/` (Completed in Batch 17) | Low |
| **`brand-icons.tsx`** | Layout | Brand logo SVG icons | `settings/page.tsx`, `auth-pages.tsx` | `components/layout/` (Completed in Batch 17) | Low |
| **`brand-mark.tsx`** | Layout | Brand identity header mark | `admin-shell.tsx`, `account-portal.tsx` | `components/layout/` (Completed in Batch 17) | Low |
| **`header-search.tsx`** | Layout | Header autocomplete instant search | `site.tsx` | `components/layout/` (Completed in Batch 17) | Med |
| **`navigation-context.tsx`** | Layout | Navigation state & drawer toggle | `site.tsx`, `layout.tsx` | `components/layout/` (Completed in Batch 17) | Low |
| **`navigation-menu.tsx`** & **`.css`** | Layout | Public primary header navigation | `site.tsx` | `components/layout/` (Completed in Batch 18) | Med |
| **`notification-panel.tsx`** & **`.module.css`** | Layout | Marketing notification drawer | `admin-shell.tsx`, `account-portal.tsx` | `components/layout/` (Completed in Batch 17) | Low |
| **`site.tsx`** | Layout | Master public shell (Header/Footer) | 20+ pages | `components/` (Intentionally Retained in root) | High |
| **`homepage.tsx`** | CMS | Home page composition | `/page.tsx` | `components/` (Intentionally Retained in root) | High |
| **`homepage-hero.tsx`** | CMS | Interactive hero banner with search | `homepage.tsx` | `components/cms/` (Completed in Batch 19) | Med |
| **`homepage-hero-preview.tsx`** | CMS | Live hero preview renderer | `homepage-hero.tsx` | `components/cms/` (Completed in Batch 19) | Low |
| **`cms-additional-pages.tsx`** | CMS | Dynamic CMS page dispatcher | `extended-pages.tsx` | `components/cms/` (Completed in Batch 15) | Med |
| **`cms-icons.tsx`** | CMS | SVG iconography for CMS sections | `page-visual-editor.tsx`, `extended-pages.tsx` | `components/cms/` (Completed in Batch 12) | Low |
| **`cms-image.tsx`** | CMS | Adaptive image renderer | CMS pages | `components/cms/` (Completed in Batch 12) | Low |
| **`cms-public-link.tsx`** | CMS | Smart CMS internal/external link | CMS pages | `components/cms/` (Completed in Batch 12) | Low |
| **`empty-fleet-hero.tsx`** | CMS | Empty state fallback hero | `extended-pages.tsx` | `components/cms/` (Completed in Batch 15) | Low |
| **`faq-hero-context.tsx`** | CMS | FAQ hero configuration context | `extended-pages.tsx` | `components/cms/` (Completed in Batch 15) | Low |
| **`information-page.tsx`** & **`.css`** | CMS | Standard legal/informational layout | `extended-pages.tsx` | `components/cms/` (Completed in Batch 13) | Low |
| **`offer-campaigns.tsx`** & **`campaigns.css`** | CMS | Special offer campaigns grid | `extended-pages.tsx` | `components/cms/` (Completed in Batch 15) | Low |
| **`page-sections-context.tsx`** & **`.css`** | CMS | Page sections dynamic renderer | `homepage.tsx` | `components/cms/` (Completed in Batch 18) | Low |
| **`presentation-content-context.tsx`** | CMS | Presentation translations | `extended-pages.tsx`, `layout.tsx` | `components/cms/` (Completed in Batch 18) | Low |
| **`promo-bar-icons.tsx`** | CMS | Top banner promo icons | `site.tsx` | `components/cms/` (Completed in Batch 15) | Low |
| **`promotion-card.tsx`** | CMS | Promotional visual card | `homepage.tsx` | `components/cms/` (Completed in Batch 12) | Low |
| **`public-appearance.tsx`** | CMS | Custom theme injection | `site.tsx`, `layout.tsx` | `components/cms/` (Completed in Batch 16) | Low |
| **`server-showcase-hero.tsx`** | CMS | SSR showcase hero banner | CMS routes | `components/cms/` (Completed in Batch 16) | Low |
| **`server-template-preview.tsx`** | CMS | SSR CMS template preview | CMS preview routes | `components/cms/` (Completed in Batch 16) | Low |
| **`showcase-hero-context.tsx`** | CMS | Showcase hero context | CMS routes | `components/cms/` (Completed in Batch 16) | Low |
| **`showcase-hero-preview.tsx`** | CMS | Client showcase preview | CMS preview | `components/cms/` (Completed in Batch 16) | Low |
| **`extended-pages.tsx`** | CMS | Static content page aggregator | Route wrappers | `components/` (Intentionally Retained in root) | High |
| **`about-page.tsx`** | CMS | About Us presentation page | `/about/page.tsx` | `components/cms/` (Completed in Batch 13) | Low |
| **`ask-question.tsx`** | Shared | Ask a Question modal & trigger | `day-tour-detail.tsx`, `tour-detail.tsx` | `components/shared/` (Completed in Batch 10) | Low |
| **`country-flag.tsx`** | Shared | Country flag SVG component | Country select | `components/ui/` (Completed in Batch 11A) | Low |
| **`country-select.tsx`** | Shared | Country dropdown with dialing codes | Auth & booking forms | `components/shared/` (Completed in Batch 11A) | Low |
| **`date-input.tsx`** | Shared | Accessible date input | Tour detail, car forms | `components/shared/` (Completed in Batch 11B) | Low |
| **`enquiry-history-tracking.tsx`** | Shared | Visitor enquiry tracker | Forms | `components/shared/` (Completed in Batch 14) | Low |
| **`event-request-form.tsx`** | Shared | Event request modal form | Event pages | `components/shared/` (Completed in Batch 14) | Low |
| **`gallery-lightbox.tsx`** & **`.css`** | Shared | Fullscreen image lightbox | Image galleries | `components/shared/` (Completed in Batch 10) | Low |
| **`horizontal-slider.tsx`** | Shared | Accessible horizontal scroll slider | Tour & video carousels | `components/shared/` (Completed in Batch 10) | Low |
| **`international-phone-input.tsx`** | Shared | Phone input with validation | Auth, checkout | `components/shared/` (Completed in Batch 11A) | Low |
| **`language-selector.tsx`** | Shared | Locale selector dropdown | Header | `components/` (Intentionally Retained in root) | High |
| **`live-chat.tsx`** | Shared | Live chat widget trigger | Shell | `components/shared/` (Completed in Batch 10) | Low |
| **`locale.tsx`** | Shared | Locale context & formatters | Everywhere | `components/` (Intentionally Retained in root) | High |
| **`public-search-page.tsx`** | Shared | Global search results page | `/search/page.tsx` | `components/shared/` (Completed in Batch 19) | Low |
| **`rich-text-renderer.tsx`** | Shared | Sanitized rich text viewer | Content pages | `components/shared/` (Completed in Batch 13) | Low |
| **`shared-help-cta.tsx`** & **`.css`** | Shared | Bottom CTA banner | Extended pages | `components/shared/` (Completed in Batch 14) | Low |
| **`shared-select.tsx`** | Shared | Base UI custom select | Forms | `components/shared/` (Completed in Batch 11C) | Low |
| **`social-icons.tsx`** | Shared | Social media SVGs | Footer | `components/shared/` (Completed in Batch 14) | Low |
| **`staff-preview-bootstrap.tsx`** | Admin | Preview mode bootstrap | Account layout | `components/admin/` (Completed in Batch 19) | Low |
| **`sustainability-badge.tsx`** | Shared | Sustainability pledge pill | Footer | `components/shared/` (Completed in Batch 14) | Low |
| **`whatsapp-chat.tsx`** | Shared | Floating WhatsApp button | Shell | `components/shared/` (Completed in Batch 10) | Low |
| **`auth-pages.tsx`** | Auth | Login & registration views | `/login`, `/register` | `components/auth/` (Completed in Batch 9) | Med |

---

### B. Root `components/admin/` Directory (32 Files Remaining)

| Current File | Domain | Responsibility | Importing Files | Target Location | Risk |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`admin-shell.tsx`** | Core | Master admin navigation & layout | All admin pages | `components/admin/core/` | High (Retain) |
| **`admin-ui.tsx`** | Core | Admin UI cards, tables, stats | All admin pages | `components/admin/core/` | High (Retain) |
| **`admin-confirm-dialog.tsx`** | Core | Delete & confirm modal dialog | Admin views | `components/admin/core/` | Med |
| **`admin-pagination.tsx`** | Core | Table pagination controls | Admin tables | `components/admin/core/` | Med |
| **`admin-table-sort.tsx`** | Core | Table column sorting hook | Admin tables | `components/admin/core/` | Med |
| **`admin-toaster.tsx`** | Core | Admin toast notification system | Admin views | `components/admin/core/` | Med |
| **`admin-locale.tsx`** | Core | Admin locale switcher | Admin pages | `components/admin/core/` | Med |
| **`admin-currency.tsx`** | Core | Admin currency switcher | Admin pages | `components/admin/core/` | Med |
| **`admin-back.tsx`** | Core | Header back button | Admin pages | `components/admin/core/` | Low |
| **`module-ui.tsx`** | Core | Add-ons catalogue cards | Add-ons page | `components/admin/core/` | Low |
| **`content-language-tabs.tsx`** | Shared UI | Language tabs for content | Editors | `components/admin/ui/` | Med |
| **`image-field.tsx`** | Shared UI | Image upload & preview field | All builders | `components/admin/ui/` | Med |
| **`rich-text-editor.tsx`** | Shared UI | Tiptap 3 rich text editor | All builders | `components/admin/ui/` | Med |
| **`creation-timeline.tsx`** & **`.css`** | Shared UI | Step timeline progress indicator | New builders | `components/admin/ui/` | Low |
| **`gallery-form.tsx`** & **`gallery-text.tsx`**| Shared UI | Media gallery inputs | Builders | `components/admin/ui/` | Low |
| **`tour-cta-picker.tsx`** | Shared UI | Link tour CTA selector | Editorial | `components/admin/ui/` | Low |
| **`cms-reference-picker.tsx`** | Shared UI | Entity link picker | Page visual editor | `components/admin/ui/` | Low |
| **`trip-builder.tsx`** | Tours | Trip wizard builder | `/admin/trips/builder` | `components/admin/tours/` | High (Retain) |
| **`trip-builder-preview.tsx`** & **`.css`** | Tours | Trip live preview modal | Trip builder | `components/admin/tours/` | High (Retain) |
| **`campaign-fields.tsx`** | CMS | Special offer campaign fields | Offers builder | `components/admin/cms/` | Low |
| **`promo-bar-fields.tsx`** | CMS | Top announcement bar fields | Appearance | `components/admin/cms/` | Low |
| **`website-appearance.tsx`** & **`.css`** | CMS | Theme and brand customizer | Appearance | `components/admin/cms/` | Low |
| **`editorial-sections-editor.tsx`** | CMS | Editorial sections repeater | Hero editor | `components/admin/cms/` | Low |
| **`cms-nav.css`** | CMS | CMS sub-navigation tabs style | CMS layout | `components/admin/cms/` | Low |
| **`notifications-page.tsx`** | Operations | Notifications center dashboard | `/admin/notifications` | `components/admin/operations/` | Low |
| **`revenue-trend.tsx`** | Operations | Monthly revenue chart widget | Admin dashboard | `components/admin/operations/` | Low |
| **`review-integrations.tsx`** | Operations | Google/TripAdvisor reviews sync | Reviews admin | `components/admin/operations/` | Low |
| **`website-enquiries.tsx`** | Operations | Inbound customer enquiry table | `/admin/inbox` | `components/admin/operations/` | Low |

---

## 3. Ordered Migration Batches

```mermaid
flowchart TD
    B6["Batch 6: Public Reviews Widgets (Low Risk, Self-Contained)"] --> B7["Batch 7: Customer Account & Booking Documents (Low-Med Risk)"]
    B7 --> B8["Batch 8: Cart, Checkout & Booking Presentation (Med Risk)"]
    B8 --> B9["Batch 9: Public CMS & Shared UI Widgets (Low-Med Risk)"]
    B9 --> B10["Batch 10: Admin Shared Fields & CMS Enhancements (Low-Med Risk)"]
    B10 --> B11["Batch 11: Admin Operations & Core Encapsulation (High Risk)"]
```

### Batches 6–11B Retrospective (Completed in Commit `15ca2c2`)
- **Batch 6**: Public Reviews Widgets (`components/reviews/`)
- **Batch 7**: Customer Account Portal (`components/account/`)
- **Batch 8**: Booking, Cart & Checkout (`components/booking/`)
- **Batch 9**: Public Auth Pages (`components/auth/`)
- **Batch 10**: Shared UI Presentation Widgets (`components/shared/` - `ask-question.tsx`, `gallery-lightbox.tsx`, `horizontal-slider.tsx`, `live-chat.tsx`, `whatsapp-chat.tsx`)
- **Batch 11A**: Shared International Inputs (`components/shared/` - `country-select.tsx`, `international-phone-input.tsx`, `components/ui/country-flag.tsx`)
- **Batch 11B**: Shared Date Input (`components/shared/date-input.tsx`)

### Batch 11C: Shared Custom Select (Completed)
- **Target**: `components/shared/`
- **File**: `components/shared-select.tsx` $\rightarrow$ `components/shared/shared-select.tsx`
- **Consumers**: 49 consuming files updated across admin, forms, and public pages.
- **Verification**: 278/278 tests passed, 291 routes statically generated, 0 TypeScript errors.

### Batch 12: Public CMS Utilities (Completed)
- **Target**: `components/cms/`
- **Files**:
  - `components/cms-icons.tsx` $\rightarrow$ `components/cms/cms-icons.tsx`
  - `components/cms-image.tsx` $\rightarrow$ `components/cms/cms-image.tsx`
  - `components/cms-public-link.tsx` $\rightarrow$ `components/cms/cms-public-link.tsx`
  - `components/promotion-card.tsx` $\rightarrow$ `components/cms/promotion-card.tsx`
- **Consumers**: 6 consuming files updated.
- **Verification**: 278/278 tests passed, 291 routes statically generated, 0 TypeScript errors.

### Batch 13: Public CMS Content Pages & Shared Rich Text (Completed)
- **Target**: `components/cms/` & `components/shared/`
- **Files**:
  - `components/about-page.tsx` $\rightarrow$ `components/cms/about-page.tsx`
  - `components/information-page.tsx` $\rightarrow$ `components/cms/information-page.tsx`
  - `components/information-page.css` $\rightarrow$ `components/cms/information-page.css`
  - `components/rich-text-renderer.tsx` $\rightarrow$ `components/shared/rich-text-renderer.tsx`
- **Consumers**: 8 consuming files updated (`extended-pages.tsx`, `hero-catalogue.ts`, `accessible-travel`, `egypt-travel-guide`, `website-cms-preview`, hotel preview, trip preview, hotel & tour detail pages).
- **Verification**: 278/278 tests passed, 291 routes statically generated, 0 TypeScript errors.

### Batch 14: Shared Engagement & Public Brand Utilities (Completed)
- **Target**: `components/shared/`
- **Files**:
  - `components/shared-help-cta.tsx` $\rightarrow$ `components/shared/shared-help-cta.tsx`
  - `components/shared-help-cta.css` $\rightarrow$ `components/shared/shared-help-cta.css`
  - `components/event-request-form.tsx` $\rightarrow$ `components/shared/event-request-form.tsx`
  - `components/enquiry-history-tracking.tsx` $\rightarrow$ `components/shared/enquiry-history-tracking.tsx`
  - `components/social-icons.tsx` $\rightarrow$ `components/shared/social-icons.tsx`
  - `components/sustainability-badge.tsx` $\rightarrow$ `components/shared/sustainability-badge.tsx`
- **Skipped / Protected**:
  - `language-selector.tsx`: Retained in root/shared per protected list instructions.
- **Consumers**: 4 consuming files updated (`components/site.tsx`, `components/extended-pages.tsx`, `app/layout.tsx`, `components/homepage.tsx`).
- **Verification**: 278/278 tests passed, 291 routes statically generated, 0 TypeScript errors.

### Batch 15: Public CMS Feature Sections & Hero Helpers (Completed)
- **Target**: `components/cms/`
- **Files**:
  - `components/cms-additional-pages.tsx` $\rightarrow$ `components/cms/cms-additional-pages.tsx`
  - `components/empty-fleet-hero.tsx` $\rightarrow$ `components/cms/empty-fleet-hero.tsx`
  - `components/faq-hero-context.tsx` $\rightarrow$ `components/cms/faq-hero-context.tsx`
  - `components/promo-bar-icons.tsx` $\rightarrow$ `components/cms/promo-bar-icons.tsx`
  - `components/offer-campaigns.tsx` $\rightarrow$ `components/cms/offer-campaigns.tsx`
  - `components/campaigns.css` $\rightarrow$ `components/cms/campaigns.css`
- **Consumers**: 10 consuming files updated across App Router routes (`/privacy`, `/terms`, `/faq`, `/destinations`, `/accessible-travel`, `/egypt-travel-guide`, CMS preview routes), `extended-pages.tsx`, `homepage.tsx`, `trips-page.tsx`, `promo-bar-fields.tsx`, `globals.css`, and `hero-catalogue.ts`.
- **Verification**: 278/278 tests passed, 291 routes statically generated, 0 TypeScript errors.

### Batch 16: Public CMS Showcase & Preview Components (Completed)
- **Target**: `components/cms/`
- **Files**:
  - `components/server-showcase-hero.tsx` $\rightarrow$ `components/cms/server-showcase-hero.tsx`
  - `components/server-template-preview.tsx` $\rightarrow$ `components/cms/server-template-preview.tsx`
  - `components/showcase-hero-context.tsx` $\rightarrow$ `components/cms/showcase-hero-context.tsx`
  - `components/showcase-hero-preview.tsx` $\rightarrow$ `components/cms/showcase-hero-preview.tsx`
  - `components/public-appearance.tsx` $\rightarrow$ `components/cms/public-appearance.tsx`
- **Protected / Excluded**: `public-search-page.tsx` and `staff-preview-bootstrap.tsx` were kept untouched per batch guardrails.
- **Consumers**: 21 consuming files + 2 internal files updated across App Router routes (`/about`, `/all-tours/**`, `/blogs`, `/contact`, `/events`, `/rent-car`, `/special-offers`, `/trips`, `/website-cms-preview/**`, `layout.tsx`), `extended-pages.tsx`, `site.tsx`, `trips-page.tsx`, `destination-builder-preview.tsx`, `language-selector.tsx`, `reviews.tsx`, and `gallery-lightbox.tsx`.
- **Verification**: 278/278 tests passed, 291 routes statically generated, 0 TypeScript errors.

### Batch 17: Layout Brand Identity & Navigation Helpers (Completed)
- **Target**: `components/layout/`
- **Files**:
  - `components/brand-context.tsx` $\rightarrow$ `components/layout/brand-context.tsx`
  - `components/brand-favicon.tsx` $\rightarrow$ `components/layout/brand-favicon.tsx`
  - `components/brand-icons.tsx` $\rightarrow$ `components/layout/brand-icons.tsx`
  - `components/brand-mark.tsx` $\rightarrow$ `components/layout/brand-mark.tsx`
  - `components/header-search.tsx` $\rightarrow$ `components/layout/header-search.tsx`
  - `components/navigation-context.tsx` $\rightarrow$ `components/layout/navigation-context.tsx`
  - `components/notification-panel.tsx` $\rightarrow$ `components/layout/notification-panel.tsx`
  - `components/notification-panel.module.css` $\rightarrow$ `components/layout/notification-panel.module.css`
- **Consumers**: 11 consuming files updated (`app/layout.tsx`, `lib/admin-store.ts`, `app/admin/settings/page.tsx`, `components/auth/auth-pages.tsx`, `components/account/account-portal.tsx`, `components/admin/admin-shell.tsx`, `components/booking/booking-print-document.tsx`, `components/reviews/reviews.tsx`, `components/shared/live-chat.tsx`, `components/shared/whatsapp-chat.tsx`, `components/site.tsx`), plus internal relative-import normalization in `components/layout/header-search.tsx`.
- **Verification**: 278/278 tests passed, 291 routes statically generated, 0 TypeScript errors.

### Batch 18: Navigation Menu, Impersonation Banner & CMS Content Contexts (Completed)
- **Target**: `components/layout/`, `components/account/`, & `components/cms/`
- **Files**:
  - `components/navigation-menu.tsx` $\rightarrow$ `components/layout/navigation-menu.tsx`
  - `components/navigation-menu.css` $\rightarrow$ `components/layout/navigation-menu.css`
  - `components/impersonation-banner.tsx` $\rightarrow$ `components/account/impersonation-banner.tsx`
  - `components/page-sections-context.tsx` $\rightarrow$ `components/cms/page-sections-context.tsx`
  - `components/page-sections.css` $\rightarrow$ `components/cms/page-sections.css`
  - `components/presentation-content-context.tsx` $\rightarrow$ `components/cms/presentation-content-context.tsx`
- **Consumers**: 7 consuming files updated (`components/site.tsx`, `components/admin/cms/navigation-manager.tsx`, `components/extended-pages.tsx`, `components/homepage.tsx`, `app/layout.tsx`, `app/website-cms-preview/pages/[pageKey]/page.tsx`, `components/cms/about-page.tsx`, `components/cms/offer-campaigns.tsx`, `components/shared/shared-help-cta.tsx`), plus internal relative-import normalizations in `components/account/impersonation-banner.tsx`, `components/cms/page-sections-context.tsx`, and `components/cms/presentation-content-context.tsx`.
- **Verification**: 278/278 tests passed, 291 routes statically generated, 0 TypeScript errors.

### Batch 19: Final Root Utilities & Homepage Heroes (Completed)
- **Target**: `components/shared/`, `components/admin/`, & `components/cms/`
- **Files**:
  - `components/public-search-page.tsx` $\rightarrow$ `components/shared/public-search-page.tsx`
  - `components/staff-preview-bootstrap.tsx` $\rightarrow$ `components/admin/staff-preview-bootstrap.tsx`
  - `components/homepage-hero.tsx` $\rightarrow$ `components/cms/homepage-hero.tsx`
  - `components/homepage-hero-preview.tsx` $\rightarrow$ `components/cms/homepage-hero-preview.tsx`
- **Consumers**: 5 consuming files updated (`components/extended-pages.tsx`, `app/account/layout.tsx`, `app/page.tsx`, `components/homepage.tsx`, `app/website-cms-preview/homepage/page.tsx`), plus internal relative-import normalizations in `components/shared/public-search-page.tsx`, `components/cms/homepage-hero.tsx`, and `components/cms/homepage-hero-preview.tsx`.
- **Verification**: 278/278 tests passed, 291 routes statically generated, 0 TypeScript errors.

---

## 3. Root `components/` Inventory Final State

All public components from the root `components/` directory (originally 75 files) have been safely and modularly organized across domain directories:

| Component Category | Count | Final Location |
|---|---|---|
| **Cars Domain** | 5 | `components/cars/` & `components/admin/cars/` |
| **SEO Domain** | 4 | `components/admin/seo/` |
| **Tours Domain** | 4 | `components/tours/` |
| **Reviews Domain** | 4 | `components/reviews/` |
| **Booking Domain** | 5 | `components/booking/` |
| **Account Domain** | 5 | `components/account/` |
| **Auth Domain** | 1 | `components/auth/` |
| **UI Primitives** | 1 | `components/ui/` |
| **Shared Engagement & Form Controls** | 12 | `components/shared/` |
| **Public CMS Feature Sections & Heroes** | 16 | `components/cms/` |
| **Layout, Brand Identity & Navigation** | 10 | `components/layout/` |
| **Admin Operations** | 1 | `components/admin/staff-preview-bootstrap.tsx` |
| **Intentionally Retained Root Orchestrators** | **6** | `components/` (see below) |

### Intentionally Retained Root Orchestrators & Providers
1. `components/site.tsx` — Master public shell (Header, Footer, Floating CTAs)
2. `components/homepage.tsx` — Public homepage view composition
3. `components/extended-pages.tsx` — Public content pages aggregator
4. `components/trips-page.tsx` — Tours catalogue & filter state orchestrator
5. `components/locale.tsx` — Core localization context provider & formatters
6. `components/language-selector.tsx` — Root header language switcher dropdown

---

## 4. Phase 3: Admin Components Reorganization

With the root `components/` directory fully organized, the admin reorganization proceeds domain-by-domain across `components/admin/`:

### A. Batch 20: Admin Shared UI & Form Controls (COMPLETED)
- **Completed Relocations (7 files)**:
  - `components/admin/content-language-tabs.tsx` $\rightarrow$ `components/admin/ui/content-language-tabs.tsx`
  - `components/admin/image-field.tsx` $\rightarrow$ `components/admin/ui/image-field.tsx`
  - `components/admin/rich-text-editor.tsx` $\rightarrow$ `components/admin/ui/rich-text-editor.tsx`
  - `components/admin/creation-timeline.tsx` $\rightarrow$ `components/admin/ui/creation-timeline.tsx`
  - `components/admin/creation-timeline.css` $\rightarrow$ `components/admin/ui/creation-timeline.css`
  - `components/admin/tour-cta-picker.tsx` $\rightarrow$ `components/admin/ui/tour-cta-picker.tsx`
  - `components/admin/cms-reference-picker.tsx` $\rightarrow$ `components/admin/cms/cms-reference-picker.tsx`
- **Skipped Candidates & Reasons (2 files)**:
  - `components/admin/gallery-form.tsx` & `gallery-text.tsx`: Classified as domain-specific to the Journey Gallery feature module (`/admin/gallery`) rather than generic shared form controls. Retained in root `components/admin/` pending a dedicated Gallery domain migration into `components/admin/gallery/`.
- **Remaining Direct-Root Admin Inventory**: 26 files.

### B. Batch 21: Admin CMS Customizer & Appearance (COMPLETED)
- **Completed Relocations (6 files)**:
  - `components/admin/campaign-fields.tsx` $\rightarrow$ `components/admin/cms/campaign-fields.tsx`
  - `components/admin/promo-bar-fields.tsx` $\rightarrow$ `components/admin/cms/promo-bar-fields.tsx`
  - `components/admin/website-appearance.tsx` $\rightarrow$ `components/admin/cms/website-appearance.tsx`
  - `components/admin/website-appearance.css` $\rightarrow$ `components/admin/cms/website-appearance.css`
  - `components/admin/editorial-sections-editor.tsx` $\rightarrow$ `components/admin/cms/editorial-sections-editor.tsx`
  - `components/admin/cms-nav.css` $\rightarrow$ `components/admin/cms/cms-nav.css`
- **Skipped Candidates & Reasons**: None (all candidate files belonged to CMS customizer & appearance and were relocated cleanly).
- **Remaining Direct-Root Admin Inventory**: 20 files.

### C. Batch 22: Admin Operations & Dashboard Dashlets (COMPLETED)
- **Completed Relocations (4 files)**:
  - `components/admin/notifications-page.tsx` $\rightarrow$ `components/admin/operations/notifications-page.tsx`
  - `components/admin/revenue-trend.tsx` $\rightarrow$ `components/admin/operations/revenue-trend.tsx`
  - `components/admin/review-integrations.tsx` $\rightarrow$ `components/admin/operations/review-integrations.tsx`
  - `components/admin/website-enquiries.tsx` $\rightarrow$ `components/admin/operations/website-enquiries.tsx`
- **Skipped Candidates & Reasons**: None (all 4 candidates belonged to Operations & Dashboard and were relocated cleanly).
- **Remaining Direct-Root Admin Inventory**: 16 files.

### D. Batch 23: Admin Gallery Feature Module (COMPLETED)
- **Completed Relocations (2 files)**:
  - `components/admin/gallery-form.tsx` $\rightarrow$ `components/admin/gallery/gallery-form.tsx`
  - `components/admin/gallery-text.tsx` $\rightarrow$ `components/admin/gallery/gallery-text.tsx`
- **Skipped Candidates & Reasons**: None (both files dedicated to the Journey Gallery feature module `/admin/gallery`).
- **Remaining Direct-Root Admin Inventory**: 14 files.

### E. Protected Core Admin Orchestrators & Primitives (Retained in `components/admin/`)
The remaining 14 files in `components/admin/` represent the protected core architecture and foundational admin UI primitives:
1. `admin-shell.tsx` — Protected Core: Master shell layout, navigation sidebar, and header
2. `admin-ui.tsx` — Protected Core: Central design system cards, tables, stat boxes, and action toolbars
3. `trip-builder.tsx` — Protected Core: Complex multi-step trip wizard orchestrator
4. `trip-builder-preview.tsx` — Trip builder live interactive preview container
5. `trip-builder-preview.css` — Trip builder preview scoped styling
6. `admin-back.tsx` — Standard admin back button navigation helper
7. `admin-confirm-dialog.tsx` — Admin confirmation modal primitive
8. `admin-currency.tsx` — Admin currency formatting and conversion helper
9. `admin-locale.tsx` — Admin locale context and text localization helpers
10. `admin-pagination.tsx` — Admin table pagination controls and state hook
11. `admin-table-sort.tsx` — Admin sortable column header component and sort hook
12. `admin-toaster.tsx` — Admin toast notification system and feedback container
13. `module-ui.tsx` — Admin module container layout helper
14. `staff-preview-bootstrap.tsx` — Staff preview bootstrap initialization helper

### F. Final Admin Organization Audit Scope
With all feature modules (Blogs, Destinations, Events, Offers, Tours, Hotels, CMS, UI, Operations, and Gallery) systematically decomposed into domain directories:
- Verify that no extraneous feature code remains in root `components/admin/`.
- Ensure zero circular dependencies between domain folders and root admin primitives.
- Finalize and document the completed Admin component architecture.

---

## 5. Execution Rules
1. Never move high-risk orchestrators (`admin-shell.tsx`, `admin-ui.tsx`, `site.tsx`, `trip-builder.tsx`, `locale.tsx`) in early batches.
2. Execute exactly one verified batch at a time.
3. Validate every move with `typecheck`, `test`, and Next.js production build (`npx next build --webpack`).

