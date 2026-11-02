# EXISTING MULTILINGUAL SYSTEM ARCHITECTURE AUDIT

> **Status:** READ-ONLY INVESTIGATION COMPLETE  
> **Target Document:** `TRANSLATION_SYSTEM_AUDIT.md`  
> **Audited Modules:** Trip Builder (11 steps), Destinations Builder, Blog Editor, Events Editor, Special Offers, Multi-Day Categories, Vehicles (Rent a Car), CMS Page & Hero Editors, SEO Manager & SEO Record Editor, Database Models, and Public Frontend Locale Pipelines.

---

## 1. Executive Summary & Existing Language Architecture

The TravNeeds application supports **three active locales**:
- **English (`en`)** — The authoritative system baseline and canonical language.
- **Spanish (`es`)** — Localized overlay.
- **Italian (`it`)** — Localized overlay.
- *(Note on Arabic `ar`: Declared in `ALL_LOCALES` within `lib/locale-config.ts` and legacy database column `Tour.titleAr`, but disabled in `ENABLED_LOCALES` and protected by repository project rules: Arabic is strictly disabled and must not be activated or altered).*

### Core Architecture Principles Discovered:
1. **English Baseline Authority:**  
   Every entity (`Tour`, `Destination`, `Blog`, `Event`, `Special Offer`, `Category`, `Vehicle`, `CMS Hero`) requires an English primary record. Spanish and Italian content exist as localized attribute overrides or translations mapped by entity key/slug.
2. **Pricing, Inventory, and Financial Isolation:**  
   All pricing structures (`priceFrom`, price tiers, seasonal rates, single supplements, infant/child rates), tour IDs, booking flows, slugs, and inventory numbers are strictly language-agnostic. The translation layers (`lib/tour-public-locale.ts`, `lib/catalogue-translations.ts`) only overlay cosmetic/display text strings (e.g., titles, descriptions, inclusions, itinerary titles, tier labels).
3. **No Automatic Machine/AI Translation Exists:**  
   There are currently **zero** automated translation integrations (no DeepL, Google Cloud Translation, or LLM-driven translation triggers) in the codebase. All existing translations across all editors are 100% manually typed by operators.
4. **No Shared Global Translation Tab Component:**  
   While `components/admin/content-language-tabs.tsx` provides a standard tab implementation (`ContentLanguageTabs`) used across Blogs, Events, Offers, Destinations, Categories, and Vehicles, other modules (such as **Trip Builder**, **CMS Heroes**, and **SEO Manager**) use independent, custom-implemented language switching tab mechanisms.

---

## 2. Editor-by-Editor Inventory

| Module / Editor | Source File(s) | Supported Languages | Tab Implementation | Translatable Fields & Structures | Data Loss Risk on Tab Switch? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Trip Builder** (11 Steps) | `components/admin/trip-builder.tsx`<br>`lib/tour-translations.ts` | EN, ES, IT | **Custom per-step tabs** (`stepLanguages: Record<number, Locale>`). Displayed on steps 0, 2, 3, 4, 5, 6, 7, 8, 9; hidden on step 1 (Pricing) and step 10 (Review). | - **Step 0:** Title, summary, duration, location, group size, travel style, departure port, note.<br>- **Step 2:** Add-on names, descriptions, and inclusion badges.<br>- **Step 3:** Highlights list, overview description.<br>- **Step 4:** Itinerary day title, subtitle, activities, meals description.<br>- **Step 5:** Inclusions & exclusions items.<br>- **Step 6:** What to bring, Know before you go, cancellation policy text.<br>- **Step 7:** Price tier labels and suffixes (e.g., "per person").<br>- **Step 8:** Gallery image alt captions.<br>- **Step 9:** Journey video titles and descriptions. | **Zero Risk.** All localized strings are read from and written to `form.detail.translations[locale]` in local component state. Inputs stay synced. |
| **Destinations Builder** | `components/admin/destination-sections-editor.tsx`<br>`lib/catalogue-translations.ts` | EN, ES, IT | **Shared Component** (`ContentLanguageTabs`) wrapping form fields with React Context. | Title, copy, eyebrow, heroAlt, facts (title, value), bestFor (title, description), experiences (name, blurb), rhythm (timing, title, blurb), practical (title, blurb). Non-EN tabs disable row addition/deletion to preserve row indexing. | **Zero Risk.** Stored in `translations` dictionary state: `{ es: { [field]: string }, it: { [field]: string } }`. Switching tabs changes active context locale without re-rendering or unmounting state. |
| **Blog Editor** | `app/admin/blogs/new/page.tsx`<br>`components/admin/blog-editorial-form.tsx`<br>`lib/catalogue-translations.ts` | EN, ES, IT | **Shared Component** (`ContentLanguageTabs`) | Title, category label, excerpt, heroAlt, readTime, heroDescription, quick facts, content sections (heading, paragraphs, takeaways, pull quotes), tips, checklist, CTA. Utilizes row alignment utilities (`moveTranslationRow`, `removeTranslationRow`). | **Zero Risk.** State is hoisted to parent page and maintained across tab clicks. |
| **Events Editor** | `app/admin/events/new/page.tsx`<br>`lib/catalogue-translations.ts` | EN, ES, IT | **Shared Component** (`ContentLanguageTabs`) | Title, category, copy/description, intro, location, venueName, address, city, organizerName, included items, excluded items, highlights, program agenda items, add-on descriptions. | **Zero Risk.** Managed in `translations` state. |
| **Special Offers** | `app/admin/offers/new/page.tsx`<br>`lib/catalogue-translations.ts` | EN, ES, IT | **Shared Component** (`ContentLanguageTabs`) | Title, badge, copy, duration text, highlights, campaign body, terms, ctaLabel, priceLabel. | **Zero Risk.** Managed in `translations` state. |
| **Multi-Day Categories** | `app/admin/multi-day-categories/new/page.tsx` | EN, ES, IT | **Shared Component** (`ContentLanguageTabs`) | Category Name, Copy / Description. | **Zero Risk.** Managed in `translations` state. |
| **Vehicles (Rent a Car)** | `components/admin/vehicle-form.tsx` | EN, ES, IT | **Shared Component** (`ContentLanguageTabs`) | Vehicle Display Title, Copy / Description. | **Zero Risk.** Managed in `translations` state. |
| **Website CMS Page Heroes** | `components/admin/homepage-hero-editor.tsx`<br>`components/admin/showcase-hero-editor.tsx`<br>`components/admin/editorial-hero-editor.tsx`<br>`components/admin/faq-hero-editor.tsx` | EN, ES, IT | **Custom Tab Buttons** (`<nav className="cms-hero-tabs">`) toggling local `locale` state. | Heading, description, eyebrow, action button label, image alt text stored in `text[locale]`. | **Zero Risk.** Stored in parent draft object `hero.text[locale]`. |
| **SEO Manager & Record Editor** | `components/admin/seo-manager.tsx`<br>`components/admin/seo-record-editor.tsx`<br>`lib/server/record-seo.ts` | EN, ES, IT | **Filter Dropdown & Field Level** (`lang` attribute selectors) | Meta Title, Meta Description, Keywords, OG Title, OG Description, Twitter Title, Twitter Description. Monitors `translationIssue` diagnostic flag. | **Zero Risk.** SEO records exist either per locale or as unified records with locale attributes. |

---

## 3. Existing Translation Functionality vs. Manual Operations

An exhaustive codebase audit reveals the following breakdown between automated tooling and manual operations:

1. **Automatic Translation Integrations:**
   - **None.** No external translation services (DeepL, Google Translate API, Azure Translator, Amazon Translate, or OpenAI/Gemini translation prompts) are integrated.
   - There are no background translation jobs, no scheduled translations, and no automatic hooks on save/publish.

2. **Translation UI Actions:**
   - No "Translate with AI", "Auto-translate Field", or "Copy from English" buttons currently exist in any of the editors.
   - Editors provide empty inputs for ES/IT. If an editor leaves an ES or IT field blank, public rendering falls back automatically to the English text.

3. **Existing Helper Utilities:**
   - `lib/locale-config.ts`: Provides `pickLocaleText(translations, locale, fallbackLocale)` for general key-value fallbacks.
   - `lib/tour-translations.ts`: Provides `readTourText(translations, locale, field, fallback)` and `writeTourText(translations, locale, field, value)`.
   - `lib/catalogue-translations.ts`: Provides `validateCatalogueTranslations(kind, payload)` which uses strict regex patterns to ensure malicious or unpermitted fields cannot be stored, and provides `moveTranslationRow` / `removeTranslationRow` to maintain row synchronization between English and translated arrays.
   - `lib/tour-public-locale.ts`: Provides `localizePublicTour(tour, locale)` which applies the translated overlays before delivering tour models to public pages.

---

## 4. Data Models and Persistence Behavior

There are three primary persistence strategies for multilingual data across the project:

### A. Tours (`Tour` Model in Prisma)
- **Table:** `tours`
- **Fields:**
  - `title`, `summary`, `description`: English canonical strings.
  - `detail`: JSON string containing `TourDetail`. Inside `TourDetail`, localized text is stored under:
    ```typescript
    translations?: {
      es?: Record<string, string>;
      it?: Record<string, string>;
    }
    ```
  - `dayDetail`: JSON string containing `DayTourDetail` with identical translation structure.
- **Save Operation:** Performed via `POST /api/admin/tours` or `PUT /api/admin/tours/[id]` sending the entire tour entity.

### B. Catalogue Entities (`CatalogueTranslation` Model in Prisma)
- **Table:** `catalogue_translations`
- **Fields:**
  - `entityType`: String (`destination`, `category`, `event`, `offer`, `blog`, `car`).
  - `slug`: String (the canonical entity slug).
  - `payload`: Serialized JSON object conforming to:
    ```typescript
    {
      es?: Record<string, string>;
      it?: Record<string, string>;
    }
    ```
- **Save Operation:** Atomic upsert via `saveWithCatalogueTranslations(tx, kind, slug, translations)` inside database transactions when the primary entity is created or updated.

### C. CMS Settings and Page Heroes (`SiteSetting` Model in Prisma)
- **Table:** `site_settings`
- **Fields:**
  - `key`: String identifier (e.g. `cms:hero:homepage`, `cms:hero:faq`, `seo:record:...`).
  - `value`: Serialized JSON object storing localized records in a map:
    ```typescript
    text: {
      en: { heading: string; description: string; ... },
      es: { heading: string; description: string; ... },
      it: { heading: string; description: string; ... }
    }
    ```

---

## 5. Compatibility & Regression Risk Analysis

| Subsystem / Concern | Regression Risk Level | Safe Boundary Rules & Protections |
| :--- | :---: | :--- |
| **Pricing & Financials** | **ZERO RISK (Guaranteed)** | Pricing tiers, single supplements, deposit calculations, and currencies are explicitly barred from the translation layer. The translation schema validator rejects any price/currency keys. |
| **Booking & Cart Engines** | **ZERO RISK (Guaranteed)** | Bookings reference immutable tour IDs, slug identifiers, and date structures. The booking engine never parses translated strings for logic. |
| **Public Slug & URL Routing**| **ZERO RISK (Guaranteed)** | Slugs remain canonical English strings (e.g., `/all-tours/giza-pyramids-tour?lang=es`). Localized slugs do not exist, preventing broken links and 404 regressions. |
| **Draft / Publish States** | **LOW RISK** | Translations are attributes of the draft entity. A future translation action must only update draft state in memory or draft records; it must never auto-publish an entity. |
| **Tab Switching Data Loss** | **ZERO RISK** | Existing editors keep translation state in parent React component state. Tab switching toggles visual displays without resetting form fields. |
| **Array & Row Synchronization**| **MEDIUM RISK** | In structured lists (such as day-by-day itineraries, highlights, or blog sections), English is the master array. If a user deletes an English item, the translation keys must be re-indexed. `lib/catalogue-translations.ts` already has `moveTranslationRow` and `removeTranslationRow` to mitigate this. |

---

## 6. Recommended Non-Breaking Integration Architecture

To implement a centralized **Translation Manager** without disrupting existing workflows or risking regressions:

### Architectural Tenets:
1. **Centralized Configuration, Decentralized Ownership:**
   - Place the **Translation Manager** within **Website CMS** (`/admin/cms/translations` or a dedicated panel in `/admin/cms`).
   - The Translation Manager controls:
     - Global translation toggle (Enable/Disable translation assistance).
     - Provider configuration (API key status, selected engine, prompt presets).
     - Per-module visibility toggles (e.g., enable for Blogs and Trips, disable for Vehicles).
     - Per-language target controls (e.g., enable ES, disable IT).
2. **Editor Autonomy:**
   - Content editors (Trip Builder, Blog Editor, etc.) remain the exclusive owners of their form state and persistence.
   - Translation triggers appear inside editors as non-intrusive action buttons:
     - `Translate Field` (e.g., next to a specific textarea).
     - `Auto-Fill Missing [ES/IT] from [EN]` (populates empty fields on the active tab).
   - Generated translations are inserted into the **active form state** for human operator review and manual approval before the user hits "Save" or "Publish".
3. **Draft Safety:**
   - Automated actions must **NEVER** automatically save or publish content to the database directly. All suggestions require explicit user confirmation.

---

## 7. Exact Files That Would Require Modification (Future Implementation)

When approved for development, the implementation will touch:
1. `prisma/schema.prisma` — Optional: Add `TranslationConfig` setting key in `site_settings` (No new database table required).
2. `lib/server/translation-service.ts` *(New file)* — Server-side endpoint/handler for translation requests with fallback and rate limiting.
3. `app/api/admin/translate/route.ts` *(New file)* — Protected admin API route to translate single strings or batches.
4. `components/admin/content-language-tabs.tsx` — Add optional `onAutoTranslate` action trigger when enabled by CMS config.
5. `components/admin/trip-builder.tsx` — Integrate field-level or step-level translation actions onto existing custom language tabs.
6. `components/admin/cms-translation-manager.tsx` *(New file)* — The centralized settings dashboard in Website CMS.

---

## 8. Required Regression Tests Before & After Implementation

1. **Tour Detail Integrity:** Verify that applying a translation to a tour does not alter `priceFrom`, `tierPricing`, `pricingModel`, or `includedAddOns`.
2. **Catalogue Validation:** Verify that `validateCatalogueTranslations` continues to reject unauthorized fields.
3. **Tab Persistence:** Verify that entering text in English, switching to Spanish, triggering an auto-translate, and switching back to English does not wipe or overwrite English text.
4. **Draft Isolation:** Verify that translating a draft tour or blog does not change its `status` from `draft` to `published`.
5. **Public Fallback:** Verify that a partially translated tour (e.g., title translated in ES, but itinerary left blank) renders the Spanish title and gracefully falls back to the English itinerary.

---

## 9. Architectural Questions to Answer Before Development

1. **Translation Provider Choice:** Which AI/translation service should be supported initially (e.g., OpenAI, Google Cloud Translation API, DeepL, or existing Gemini API infrastructure)?
2. **Batch vs. Single-Field Scope:** Should the initial release prioritize single-field translation (safer, immediate review) or step/page-wide translation?
3. **Overwrite Policy:** Should auto-translate strictly fill only empty fields by default, with a separate explicit checkbox to "Overwrite existing translations"?

---
*Report prepared following strict read-only audit protocol.*

