# TRAVNEEDS — MODULAR SAAS FOUNDATION AUDIT
**Document Target:** `TRAVNEEDS_MODULAR_ARCHITECTURE_AUDIT.md`  
**Investigation Mode:** Strict READ-ONLY Architectural Analysis  
**Repository:** TravNeeds (Independent Travel Technology Platform)

---

## 1. Executive Summary & Existing Architecture Inventory

The TravNeeds platform is currently a high-integrity, single-tenant Next.js App Router application backed by a normalized MySQL database via Prisma ORM. It has evolved past simple mockups into a system with production-grade data models and transactional boundaries, but its domain logic and administrative operations are tightly coupled to a single, monolithic operator concept.

### 1.1 Next.js Application Structure & Routing Boundaries
- **Storefront & Public Engine (`app/`):**
  - Routes: `/` (Home), `/trips` & `/all-tours/*` (Catalogue & Category Landing), `/destinations/*`, `/blogs/*`, `/events/*`, `/special-offers/*`, `/rent-car/*`, `/make-your-trip`, `/booking/*`, `/cart`, `/checkout`.
  - Architecture: Server-rendered canonical layouts coupled with reactive client components for interactive booking cards, real-time availability filters, and multilingual display.
- **Administrative Portal (`app/admin/`):**
  - 24 administrative domains: `dashboard`, `trips`, `bookings`, `payments`, `destinations`, `blogs`, `events`, `offers`, `cars`, `multi-day-categories`, `customers`, `users`, `inbox`, `reviews`, `website-cms`, `gallery`, `emails`, `notifications`, `trip-requests`, `car-requests`, `event-requests`, `settings`, `profile`, `rent-cars`.
  - All admin paths are authenticated and gate access through HTTP-only session cookies and role/permission middleware.
- **API Boundaries (`app/api/`):**
  - Administrative endpoints: `/api/admin/*` (Strict RBAC enforcement via `requireStaffUser` and `requirePermission`).
  - Public endpoints: `/api/auth/*`, `/api/bookings/*`, `/api/reviews/*`, `/api/enquiries/*`, `/api/tours/*`.

### 1.2 Authentication, Session Architecture & RBAC
- **Authentication (`lib/server/auth.ts`, `prisma/schema.prisma`):**
  - Native credentials-based session store: `User` and `Session` models.
  - Passwords hashed via scrypt/argon2 with cryptographic salt.
  - Sessions track `tokenHash`, `expiresAt`, `ipAddress`, and `userAgent`.
- **RBAC Foundation (`prisma/schema.prisma:10-105`, `lib/server/users.ts`):**
  - Models: `User`, `Role`, `UserRole`, `Permission`, `RolePermission`.
  - System Roles: `SUPER_ADMIN` (immutable, code-level bypass of all permission checks), `ADMIN`, `STAFF`, and `CUSTOMER` (storefront-only, zero admin grants).
  - Canonical Permission Matrix: Granular `<module>.<action>` format (e.g., `tours.edit`, `bookings.view`, `payments.edit`, `users.manage`, `reviews.moderate`).
  - Hierarchical lattice: Only `SUPER_ADMIN` may assign roles or mutate user permissions; users cannot grant permissions beyond their own authority.

### 1.3 Booking, Payments, Invoicing & Financial Integrity
- **Booking Engine (`prisma/schema.prisma:484-620`):**
  - `Booking`: Tracks lifecycle status (`PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`) and honest payment status (`PENDING`, `PARTIAL`, `PAID`, `REFUNDED`).
  - Immutable Snapshots: `BookingItem` snapshots the exact commercial terms (tour slug, dates, traveler count, selected options, base price, tier breakdown) at checkout time.
  - Security Tokens: `BookingAccessToken` ensures secure guest access with rate-limited attempts (`BookingAccessAttempt`).
- **Payment Architecture (`prisma/schema.prisma:627-740`):**
  - Provider-agnostic ledger: `Payment` and `PaymentEvent` models.
  - Integer cents arithmetic: All monetary amounts are computed in integer cents and stored with strict `DECIMAL(10,2)` precision to eliminate floating-point drift.
  - Gateway Agnostic: Complete offline/manual recording infrastructure (`payments.edit` permission). Ready for gateway integration without rewriting data contracts.
- **Documents & Invoicing (`prisma/schema.prisma:747-814`):**
  - `BookingDocument`: Formal accounting entity supporting `BOOKING_REQUEST`, `BOOKING_CONFIRMATION`, and `BOOKING_VOUCHER`.
  - Monotonic Sequences: `DocumentSequence` guarantees sequential numbering (e.g., `INV-2026-0001`) with atomic gap-prevention logic.

### 1.4 Implemented Foundations vs. Incomplete/Prototypes

| Architectural Subsystem | Current Implementation Status | Evaluation & Evidence |
| :--- | :--- | :--- |
| **Authentication & RBAC** | **Production Grade** | Robust, database-backed, session cookies, password hashing, explicit permission lattice. |
| **Tours Catalogue & Builder** | **Production Grade** | 11-step builder, database-persisted entities, published/draft status isolation, pricing tier validation. |
| **Booking & Cart Engine** | **Production Grade** | Relational integrity, snapshot line items, transaction safety, guest access tokens. |
| **Payment Ledger & Audit** | **Production Grade (Core Only)** | Immutable ledger, refund tracking, audit records (`PaymentEvent`). Payment gateway adapters are not yet integrated. |
| **Documents & Vouchers** | **Production Grade** | PDF generation engine, verification QR code hashes (`verify-voucher`), document numbering sequence. |
| **Customer Portal & CRM** | **Production Grade** | Real bookings history, profile management, customer impersonation preview for staff. |
| **Multi-Tenancy** | **Non-Existent (0%)** | Single-tenant assumption across all tables. No `Organization` or `Tenant` concept exists. |
| **Subscription & Entitlements**| **Non-Existent (0%)** | No subscription plans, recurring billing, or module-level entitlement gating. |
| **Arabic Locale (RTL)** | **Blocked by Configuration** | Code engine supports RTL (`isLocaleRTL`), but repository rules and `ENABLED_LOCALES` disable Arabic. |

---

## 2. Multi-Tenant Readiness Assessment

### 2.1 Complete Absence of Tenant Scoping
The existing schema and query layers contain **zero tenant discrimination**:
1. **No Organization Entity:** The `prisma/schema.prisma` file defines 38 models; none represent an `Organization`, `Company`, `Agency`, or `Tenant`.
2. **Global Unique Constraints:** 
   - `User.email` and `User.username` are globally unique.
   - `Tour.slug` is globally unique.
   - `Booking.reference` and `Payment.reference` are globally unique.
   - If two agencies in a SaaS setup both offer a tour named `cairo-day-tour`, the current schema will throw a database collision error.
3. **Unscoped ORM Queries:** Administrative API routes execute raw queries like `db.tour.findMany()` or `db.booking.findMany()` without filtering by organization context.
4. **Staff Association:** Staff members and Super Admins exist in a single global pool. A `UserRole` record links a user to a global `Role`, not a tenant-scoped role.

### 2.2 Cross-Tenant Security & Isolation Risks
If multiple organizations were added today without architectural changes:
- **Data Leakage:** Any authenticated staff user with `bookings.view` would inspect bookings across all organizations.
- **Collisions in Document Numbering:** `DocumentSequence` generates a single global sequence for invoices and vouchers.
- **Shared Static Media:** Files uploaded to `/public/uploads` or Cloud Storage share a flat directory namespace without tenant path isolation.

---

## 3. Modular Monolith Target Architecture

To evolve TravNeeds into a multi-module Travel Technology SaaS platform while preserving stability, the system should adopt a **Modular Monolith** structure within the Next.js / Prisma stack.

```
                           +-------------------------------------------------------+
                           |               TravNeeds SaaS Platform                 |
                           +-------------------------------------------------------+
                                                      |
                 +------------------------------------+------------------------------------+
                 |                                                                      |
    +------------------------+                                             +------------------------+
    |   CORE PLATFORM        |                                             |   OPTIONAL ADD-ONS     |
    |   (Shared Foundation)  |                                             |   (Subscription-Gated) |
    +------------------------+                                             +------------------------+
    | * Multi-Tenancy (Org)  |                                             | [TOURS] Tours & Pkgs   |
    | * Identity & Auth      |                                             | [HOTELS] Hotel Res     |
    | * Org RBAC & Roles     |                                             | [FLIGHTS] Flight Res   |
    | * Subscriptions & Ent. |                                             | [VISA] Visa Services   |
    | * Document Sequencer   |                                             | [HAJJ] Hajj & Umrah    |
    | * Payments Core        |                                             | [TRANSFERS] Fleet/Cars |
    | * Locale & RTL Engine  |                                             +------------------------+
    +------------------------+
```

### 3.1 Module Registry & Metadata Standard
Every module (Core or Add-on) must be registered in a centralized, typed platform registry:

```typescript
export type ModuleId = 
  | 'core'
  | 'tours'
  | 'hotels'
  | 'flights'
  | 'visa'
  | 'hajj_umrah'
  | 'transfers';

export interface ModuleManifest {
  id: ModuleId;
  name: string;
  description: string;
  version: string;
  isCore: boolean;
  requiredModules: ModuleId[];
  permissions: {
    key: string;
    action: string;
    label: string;
  }[];
  routes: {
    adminPrefix: string;
    publicPrefix?: string;
  };
  navigation: {
    section: 'operations' | 'catalogue' | 'settings';
    label: Record<string, string>;
    href: string;
    icon: string;
  }[];
}
```

### 3.2 Add-on Lifecycle & Enablement
An Add-on transitions through explicit states per organization:
1. `UNSUBSCRIBED`: Add-on is not included in the plan; routes return `403 Module Not Subscribed`, navigation items are hidden.
2. `ACTIVE`: Organization has an active subscription; users with appropriate RBAC permissions can access and configure the module.
3. `GRACE_PERIOD`: Payment failed; read-only operations permitted, writes warning banner displayed.
4. `SUSPENDED` / `EXPIRED`: Read-only archive access or fully disabled depending on organization policy.

---

## 4. Multi-Tenant Data & Subscription Schema

To achieve complete tenant isolation and independent subscriptions, the schema must introduce **Organizations**, **Memberships**, and **Subscriptions**.

### 4.1 Schema Additions (Proposed Prisma Migration)

```prisma
// ----------------------------------------------------
// MULTI-TENANCY FOUNDATION
// ----------------------------------------------------

model Organization {
  id            String              @id @default(cuid())
  slug          String              @unique @db.VarChar(64) // Subdomain or URL prefix
  name          String              @db.VarChar(120)
  legalName     String?             @db.VarChar(180)
  status        OrganizationStatus  @default(ACTIVE)
  currency      String              @default("USD") @db.VarChar(3)
  defaultLocale String              @default("en") @db.VarChar(5)
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt

  memberships   OrganizationMember[]
  subscriptions OrganizationSubscription[]
  auditLogs     StaffActionAudit[]
  sequences     DocumentSequence[]

  // Domain Relations
  tours         Tour[]
  bookings      Booking[]
  payments      Payment[]
  destinations  Destination[]
  cars          Car[]

  @@map("organizations")
}

enum OrganizationStatus {
  ACTIVE
  SUSPENDED
  DEACTIVATED
}

model OrganizationMember {
  id             String         @id @default(cuid())
  organizationId String
  userId         String
  roleId         String
  status         MemberStatus   @default(ACTIVE)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  organization   Organization   @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  role           Role           @relation(fields: [roleId], references: [id])

  @@unique([organizationId, userId])
  @@index([userId])
  @@map("organization_members")
}

enum MemberStatus {
  INVITED
  ACTIVE
  SUSPENDED
}

// ----------------------------------------------------
// SUBSCRIPTIONS & ENTITLEMENTS
// ----------------------------------------------------

model Plan {
  id            String         @id @default(cuid())
  key           String         @unique @db.VarChar(64) // e.g. "starter", "pro", "enterprise"
  name          String         @db.VarChar(100)
  description   String?        @db.VarChar(255)
  basePrice     Int            // in cents
  currency      String         @default("USD") @db.VarChar(3)
  billingPeriod BillingPeriod  @default(MONTHLY)
  isActive      Boolean        @default(true)

  subscriptions OrganizationSubscription[]
  entitlements  PlanEntitlement[]

  @@map("plans")
}

enum BillingPeriod {
  MONTHLY
  ANNUAL
}

model PlanEntitlement {
  id          String   @id @default(cuid())
  planId      String
  moduleId    String   @db.VarChar(64) // e.g. "tours", "transfers"
  plan        Plan     @relation(fields: [planId], references: [id], onDelete: Cascade)

  @@unique([planId, moduleId])
  @@map("plan_entitlements")
}

model OrganizationSubscription {
  id             String             @id @default(cuid())
  organizationId String
  planId         String?
  status         SubscriptionStatus @default(TRIAL)
  startDate      DateTime           @default(now())
  currentPeriodEnd DateTime
  gracePeriodEnd DateTime?
  canceledAt     DateTime?
  trialEndsAt    DateTime?

  organization   Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  plan           Plan?              @relation(fields: [planId], references: [id])
  addOns         SubscriptionAddOn[]
  history        SubscriptionHistory[]

  @@index([organizationId, status])
  @@map("organization_subscriptions")
}

enum SubscriptionStatus {
  TRIAL
  ACTIVE
  GRACE_PERIOD
  PAST_DUE
  CANCELED
  EXPIRED
}

model SubscriptionAddOn {
  id             String                   @id @default(cuid())
  subscriptionId String
  moduleId       String                   @db.VarChar(64) // e.g. "hotels", "visa", "hajj_umrah"
  status         SubscriptionStatus       @default(ACTIVE)
  priceCents     Int                      // in cents
  activatedAt    DateTime                 @default(now())
  expiresAt      DateTime?

  subscription   OrganizationSubscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  @@unique([subscriptionId, moduleId])
  @@map("subscription_addons")
}

model SubscriptionHistory {
  id             String                   @id @default(cuid())
  subscriptionId String
  action         String                   @db.VarChar(64) // "UPGRADE", "ADDON_ACTIVATED", "CANCELED"
  details        String?                  @db.Text
  performedBy    String?                  @db.VarChar(64)
  createdAt      DateTime                 @default(now())

  subscription   OrganizationSubscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  @@map("subscription_history")
}
```

---

## 5. Security & Permission Enforcement Architecture

Enforcement of module operations requires a **Three-Tier Gatekeeper pattern**:

```
[ Incoming Request ]
         |
         v
+-------------------------------------------------------------+
| TIER 1: Organization Context & Authentication               |
| - Identifies active Organization (Subdomain, Header, User)  |
| - Verifies User is an active Member of the Organization     |
+-------------------------------------------------------------+
         |
         v
+-------------------------------------------------------------+
| TIER 2: Subscription & Module Entitlement Gate             |
| - Checks: Does Organization have an ACTIVE subscription?    |
| - Checks: Is Target Module enabled (Core, Plan, or AddOn)?  |
+-------------------------------------------------------------+
         |
         v
+-------------------------------------------------------------+
| TIER 3: Role-Based Access Control (RBAC)                    |
| - Checks: Does Member's Role hold `<module>.<action>` perm? |
| - Checks: Row-level tenant match (`WHERE organizationId=X`) |
+-------------------------------------------------------------+
         |
         v
[ Execute Operation / Database Query ]
```

### 5.1 Safe Reuse of Existing RBAC Logic
The existing permission lattice (`lib/server/auth.ts`, `lib/server/users.ts`) is cleanly written and can be reused directly:
- `requirePermission(actor, permissionKey)` remains the exact contract for Tier 3.
- `SUPER_ADMIN` retains platform-wide governance (cross-tenant management, billing overrides, support), but is segregated from Organization Tenant Admins (`ORG_ADMIN`).

---

## 6. Localization & RTL (Arabic) Integration Plan

### 6.1 Existing Restrictions & Technical Debt
1. **Repository Rules in `AGENTS.md`:**  
   Line 194 of `AGENTS.md` explicitly commands:  
   `- Support English (EN), Spanish (ES), and Italian (IT). Arabic is disabled; do not add or enable Arabic/RTL behavior.`  
   *Note: This rule must be officially amended by the project owner before Arabic can be re-enabled.*
2. **Configuration in `lib/locale-config.ts`:**  
   `ENABLED_LOCALES` excludes `'ar'`. Changing `ENABLED_LOCALES = ['en', 'ar', 'es', 'it']` is technically trivial, but requires completing RTL styling verification.
3. **Database Legacy Columns:**  
   Models like `Tour.titleAr` exist as legacy single-language columns. All new modules (Hotels, Flights, Visa) must use structured localized JSON overlays (similar to `Tour.detail.translations` or `catalogue_translations`) rather than hardcoding columns like `nameAr`, `nameEs`, etc.

### 6.2 RTL Design System Gaps
- In `app/globals.css`, layout styles frequently use physical properties (`margin-left`, `padding-right`, `left`, `right`) instead of logical properties (`margin-inline-start`, `padding-inline-end`, `inset-inline-start`, `inset-inline-end`).
- High-priority components with complete RTL support already built: `components/locale.tsx` (switches `<html dir="rtl">`), `components/country-select.tsx`, and `components/date-input.tsx`.
- Components requiring RTL audit before Arabic rollout: Admin sidebar layout, Data tables with pinned action columns, and Multi-step builders.

---

## 7. Migration & Zero-Downtime Data Preservation Strategy

All existing database records (Tours, Bookings, Payments, Media, Invoices) represent live commercial history and must not be altered, dropped, or lost.

### 7.1 Single-Tenant to Multi-Tenant Transition Strategy
1. **The Default Tenant ("System Pioneer"):**
   - In Migration 1, create a primary default organization:
     - `id: "org_default_travneeds"`
     - `slug: "travneeds-main"`
     - `name: "TravNeeds Pioneer"`
2. **Safe Backfilling:**
   - Add nullable column `organizationId String?` to existing operational tables: `tours`, `bookings`, `payments`, `destinations`, `cars`, `document_sequences`, `staff_action_audits`.
   - Execute data migration script: `UPDATE tours SET organizationId = 'org_default_travneeds' WHERE organizationId IS NULL;`
   - Repeat for all existing records.
   - Once 100% backfilled, alter `organizationId` to `NOT NULL` and add foreign key indices.
3. **User Migration:**
   - Existing staff users receive an `OrganizationMember` record linking them to `org_default_travneeds` with their existing `roleId`.
   - Existing customers (`CUSTOMER` role) remain global users who can book across storefronts or belong to organization-specific customer directories via booking references.

---

## 8. Prioritized Implementation Roadmap

```
+---------------------------------------------------------------------------------+
| PHASE 1: Organization & Multi-Tenant Core Foundation (P0 - Prerequisite)      |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
| PHASE 2: Subscriptions & Entitlements Engine (P0 - Prerequisite)                |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
| PHASE 3: Module Registry & Tours Encapsulation (P1 - Foundation Migration)      |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
| PHASE 4: Full Arabic & RTL Activation across Core & Tours (P1)                  |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
| PHASE 5+: First New Add-on Implementation (Hotels / Transfers / Visa) (P2)      |
+---------------------------------------------------------------------------------+
```

### Phase 1: Organization & Multi-Tenant Foundation (Non-Breaking)
- **Goal:** Introduce `Organization` and `OrganizationMember` models without breaking current single-tenant queries.
- **Files Affected:** `prisma/schema.prisma`, `lib/server/org-context.ts` (new), `lib/server/auth.ts`, `middleware.ts`.
- **Database Changes:** Add `organizations` and `organization_members` tables. Add nullable `organizationId` to existing tables.
- **Tests & Criteria:** Backfill script validates 100% of existing tours and bookings map to the default organization. Current admin tests pass with 0 regressions.

### Phase 2: Subscription & Entitlement Layer
- **Goal:** Build the subscription state machine, plans, add-on pricing models, and entitlement gatekeepers.
- **Files Affected:** `prisma/schema.prisma`, `lib/server/entitlements.ts` (new), `lib/modules/registry.ts` (new).
- **Database Changes:** Add `plans`, `plan_entitlements`, `organization_subscriptions`, `subscription_addons`, `subscription_history`.
- **Tests & Criteria:** Verifying that an organization with an expired subscription is blocked from non-core operations while preserving data integrity.

### Phase 3: Module Registry & Tours Add-on Encapsulation
- **Goal:** Encapsulate the existing Tours catalogue and builder into the standard `tours` Add-on module.
- **Files Affected:** `components/admin/trip-builder.tsx`, `app/admin/trips/*`, `lib/server/tours.ts`.
- **Tests & Criteria:** Toggling `tours` entitlement dynamically controls Trip Builder navigation and API endpoints.

### Phase 4: Arabic & RTL Activation
- **Goal:** Officially re-enable Arabic, complete CSS logical property migrations, and remove legacy Star Pyramids restrictions.
- **Files Affected:** `AGENTS.md`, `lib/locale-config.ts`, `app/globals.css`, `components/locale.tsx`.
- **Tests & Criteria:** Verified full bi-directional rendering in English, Spanish, Italian, and Arabic across all public and admin routes.

### Phase 5+: Successive Add-on Rollouts
- **Goal:** Implement new travel technology verticals:
  1. Transfers & Fleet (`transfers`)
  2. Hotel Reservations (`hotels`)
  3. Visa Processing (`visa`)
  4. Flight Booking (`flights`)
  5. Hajj & Umrah (`hajj_umrah`)

---

## 9. Architectural Decisions Requiring Formal Alignment

Before coding Phase 1, the product team must align on the following three architectural decisions:

1. **Subdomain vs. Path Tenant Resolution:**
   - *Option A (Subdomain):* `agency1.travneeds.com/admin` vs `agency2.travneeds.com/admin`. (Cleaner tenant separation, requires wildcard DNS and cookie management).
   - *Option B (Header/Path):* `app.travneeds.com/admin` with an active Organization switcher in the header. (Simpler deployment, standard cookies).
2. **Customer Identity Scope:**
   - Are customers global (one TravNeeds customer account can book across multiple travel agencies) or strictly scoped per tenant? (Global accounts with scoped booking histories is the recommended SaaS pattern).
3. **Official Arabic Rule Amendment:**
   - Approval to update `AGENTS.md` and repository guidelines to remove the legacy prohibition on Arabic.

---
*Audit completed under strict read-only protocols. No files, code, or databases were modified.*

