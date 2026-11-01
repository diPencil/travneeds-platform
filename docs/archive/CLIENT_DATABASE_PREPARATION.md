# Local client database preparation  -  2026-10-28

Completed target: `127.0.0.1:3306/star_pyramids_production`.
Source: `127.0.0.1:3306/star_pyramids` (SELECT-only throughout).
The user explicitly selected the local source and sole administrator `admin@starpyramids.com`, and requested no backup. No database dump or backup was created. The result JSON contains counts and non-reversible verification hashes, not exported source rows.

## Retained

- One active administrator, preserving its existing ID, password hash, profile and SUPER_ADMIN assignment. Historical last-login metadata was reset in the new target only; sessions/tokens were not copied.
- Four foundational roles, 53 permission definitions and 154 role grants. Other users/customers and historical grant-actor references were not transferred.
- All 21 existing local SiteSetting records, unchanged.
- All six blogs, including full original content JSON/images references, unchanged.
- One currency-rate record.
- No referenced uploaded media was required: the chosen admin has no uploaded avatar, and the retained blogs use project assets. Existing files were not changed or removed.

The source has no CMS publication/appearance/navigation documents or saved site.logo/site.favicon keys. It also has no separate blog CatalogueTranslation rows. None were fabricated. Existing EN/ES/IT interface and built-in page translation code/assets remain unchanged. Seven offer translation records were deliberately excluded with the offers. The local source choice does not import settings that exist only in Hostinger's separate database.

## Excluded

Every business/operational table was checked to be empty in the target: tours, destinations, categories, cars, routes/prices, events, offers, requests/activities/attempts, customers, bookings/items/documents, payments/events, counters, reviews, journey gallery, support/inbox, emails, notifications, authentication sessions/tokens/attempts and audit history.

## Schema

All 43 repository migrations were applied to the previously empty target. A read-only comparison then identified one pre-existing migration-history gap: the current schema/source have nullable users.avatar VARCHAR(500), but the historical migrations do not create it. The first run stopped before content copy. The exact inspected correction in CLIENT_DATABASE_SCHEMA_REVIEW.sql was applied only to the empty target users table. No source/global schema migration was applied or changed.

Final target migration status: up to date, 43 applied migrations. Final Prisma schema comparison: no difference detected. Future provisioning from migrations alone still needs this documented historical gap addressed; this task did not modify migration history on the existing source.

## Safety and verification

- Source table row counts, data hashes and SHOW CREATE TABLE hashes matched before/after the successful transfer for every source table, including migration history.
- Target selected blogs and settings matched source contents exactly.
- Target administrator password hash and SUPER_ADMIN membership matched the selected source account.
- Source and target were independently checked with SELECT DATABASE(); scripts hard-restrict both names and local host.
- Application `.env` fingerprint was unchanged; application/production connections were not switched. The website still uses its existing database.
- No backup, reset, broad seed, source write, media deletion, production operation, commit or push.
- `node --check scripts/prepare-client-database.cjs`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: 161 files / 2000 tests passed. Transfer policy tests are pure and do not execute database operations; database-writing integration tests remain excluded.
- `pnpm exec prisma validate`: passed.
- Target `prisma migrate status`: up to date.
- Target `prisma migrate diff ... --exit-code`: exit 0, no differences.
- `git diff --check`: passed.
- Independent read-only review found no blocking issue in the transfer/resume guards.
- No application/runtime source changed, so a new website production build/browser run was not needed or performed for this database-only operation.

## Utilities and artifacts

- scripts/prepare-client-database.cjs: guarded one-off initializer. First application requires a completely empty target; guarded schema-resume mode rejects any application data. It cannot overwrite the completed target.
- tests/client-database-transfer.test.ts: database identity, setting allowlist and retained-link policy tests.
- CLIENT_DATABASE_SCHEMA_REVIEW.sql: structure-only inspected nullable avatar ADD.
- CLIENT_DATABASE_TRANSFER_RESULT.json: counts and verification fingerprints only; no passwords or source row data.

Do not change DATABASE_URL or remove the existing database without a separate explicit request. This new database is prepared locally; it is not a claim that Hostinger has switched to it.

## Approved destination addition  -  2026-10-28

The owner subsequently requested retaining the local destinations as well. `scripts/copy-client-destinations.cjs` first verified both local database identities and an empty target destination collection, then inserted all 10 source destination records in one target-only transaction. IDs, content JSON, publication/placement flags, order, dates and image references were preserved exactly. There were zero separate destination translation rows in the source. The transaction verified complete destination content hashes, and subsequent checks confirmed source destinations/translations and `.env` unchanged. No other target table was written. No Hostinger database was modified or connection switched. The original preparation report above describes the initial state; the target now has 10 destinations.
