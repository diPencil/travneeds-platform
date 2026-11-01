// Local, explicitly allowlisted client-database preparation. No source mutations,
// backup/export files, environment edits, resets, seeds, deletes or file copies.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const TARGET = 'travneeds_production';
const SOURCE = 'travneeds';
const ADMIN = 'admin@travneeds.com';
function connections(raw) {
  const source = new URL(raw);
  if (source.protocol !== 'mysql:' || !['127.0.0.1', 'localhost', '[::1]'].includes(source.hostname) || decodeURIComponent(source.pathname.slice(1)) !== SOURCE) throw new Error('Only local travneeds may be the source.');
  const target = new URL(source); target.pathname = '/' + TARGET;
  return { source: source.href, target: target.href };
}
function stable(value) { return JSON.stringify(value, (_key, v) => typeof v === 'bigint' ? v.toString() : v); }
function digest(value) { return crypto.createHash('sha256').update(stable(value)).digest('hex'); }
function settingAllowed(key) {
  // No record-specific SEO or campaign content is imported. This local source
  // currently has no CMS documents; fail rather than silently omit new ones.
  return /^(app\.|contact\.|company\.|mail\.|auth\.|maps\.|social\.|whatsapp\.|reviews\.integration\.)/.test(key) || /^site\.(name|logo|favicon|about(En|Es|It|Ar)|seoTitle|seoDescription(En|Es|It)|seoImage|googleSiteVerification|promoBarBackfillDone)$/.test(key);
}
function inspectRetainedLinks(value, location = 'content', found = []) {
  if (typeof value === 'string') {
    if (/\/(egypt-tours|destinations|events|special-offers)\/[a-z0-9]/i.test(value) || /\/(make-your-trip|rent-car\/request)\?[^\s"<>]*(?:tour|vehicle|destination)=/i.test(value)) found.push(location);
  } else if (Array.isArray(value)) value.forEach((entry, index) => inspectRetainedLinks(entry, `${location}[${index}]`, found));
  else if (value && typeof value === 'object') for (const [key, entry] of Object.entries(value)) {
    if (/^(relatedTourSlugs|tourSlugs|destinationSlugs|eventSlugs|offerSlugs)$/i.test(key) && Array.isArray(entry) && entry.length) found.push(`${location}.${key}`);
    inspectRetainedLinks(entry, `${location}.${key}`, found);
  }
  return found;
}
async function tables(client) {
  return (await client.$queryRawUnsafe('SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE=\'BASE TABLE\' ORDER BY TABLE_NAME')).map(row => row.name);
}
async function fingerprint(client) {
  const result = {};
  for (const table of await tables(client)) {
    if (!/^[a-z0-9_]+$/i.test(table)) throw new Error('Unexpected table name.');
    const rows = await client.$queryRawUnsafe(`SELECT * FROM \`${table}\``);
    const canonical = rows.map(row => stable(Object.fromEntries(Object.entries(row).sort(([a], [b]) => a.localeCompare(b))))).sort();
    const ddl = await client.$queryRawUnsafe(`SHOW CREATE TABLE \`${table}\``);
    result[table] = { count: rows.length, sha256: digest(canonical), schemaSha256: digest(ddl) };
  }
  return result;
}
function prisma(args, targetUrl) {
  const result = spawnSync(process.execPath, [path.join(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js'), ...args], { cwd: process.cwd(), env: { ...process.env, DATABASE_URL: targetUrl }, encoding: 'utf8', windowsHide: true });
  if (result.error) throw new Error('Prisma process could not start.');
  const output = `${result.stdout || ''}\n${result.stderr || ''}`.replace(/mysql:\/\/[^\s"']+/g, '[redacted database URL]');
  return { status: result.status, output };
}
function migrations() {
  return fs.readdirSync('prisma/migrations', { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
}
function reviewSql() {
  for (const name of migrations()) {
    const sql = fs.readFileSync(path.join('prisma/migrations', name, 'migration.sql'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '');
    if (/\b(USE\s|CREATE\s+DATABASE|DROP\s+DATABASE|TRUNCATE\s|OUTFILE|INFILE|PREPARE\s|EXECUTE\s|GRANT\s|CREATE\s+USER)/i.test(sql) || /`[^`]+`\s*\.\s*`[^`]+`/.test(sql)) throw new Error(`Migration ${name} requires manual safety review.`);
  }
}
async function collect(source) {
  const user = await source.user.findUnique({ where: { emailNormalized: ADMIN } });
  if (!user || user.status !== 'ACTIVE' || !user.passwordHash) throw new Error('Selected active admin with existing password is required.');
  const roles = await source.role.findMany({ where: { key: { in: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CUSTOMER'] } } });
  const assignments = await source.userRole.findMany({ where: { userId: user.id } });
  if (!assignments.some(row => row.roleId === roles.find(role => role.key === 'SUPER_ADMIN')?.id)) throw new Error('Selected user is not a Super Admin.');
  const settings = await source.siteSetting.findMany({ orderBy: { key: 'asc' } });
  const unknown = settings.filter(row => !settingAllowed(row.key));
  if (unknown.length) throw new Error(`Unreviewed settings must be classified before copying: ${unknown.map(row => row.key).join(', ')}`);
  const blogs = await source.blog.findMany({ orderBy: { slug: 'asc' } });
  for (const blog of blogs) if (inspectRetainedLinks(JSON.parse(blog.content)).length) throw new Error(`Blog ${blog.slug} references excluded business content; review links first.`);
  const translations = await source.catalogueTranslation.findMany({ where: { entityType: 'blog', slug: { in: blogs.map(blog => blog.slug) } } });
  for (const row of translations) if (inspectRetainedLinks(JSON.parse(row.payload)).length) throw new Error(`Blog translation ${row.slug} references excluded content.`);
  const permissions = await source.permission.findMany();
  const grants = await source.rolePermission.findMany({ where: { roleId: { in: roles.map(role => role.id) } } });
  const rates = await source.fxRate.findMany();
  const payload = stable({ user: { avatar: user.avatar }, settings, blogs, translations });
  const urls = [...new Set(payload.match(/\/media\/\d{4}\/\d{2}\/[a-f0-9]{32}\.[a-z0-9]+/g) || [])];
  const media = await source.mediaAsset.findMany({ where: { url: { in: urls } } });
  if (media.length !== urls.length) throw new Error('A retained upload has no media registry record.');
  const storage = path.resolve(process.env.MEDIA_STORAGE_DIR?.trim() || path.join(process.cwd(), 'storage', 'media'));
  for (const row of media) {
    const file = path.resolve(storage, row.storageKey);
    if (!file.startsWith(storage + path.sep) || !fs.statSync(file).isFile()) throw new Error('A retained media file is unavailable or outside storage.');
  }
  return { user, roles, assignments, settings, blogs, translations, permissions, grants, rates, media };
}
async function transfer(target, data) {
  await target.$transaction(async tx => {
    await tx.role.createMany({ data: data.roles });
    const permissionIds = new Map();
    for (const row of data.permissions) {
      const saved = await tx.permission.upsert({ where: { key: row.key }, create: row, update: { module: row.module, action: row.action, label: row.label } });
      permissionIds.set(row.id, saved.id);
    }
    await tx.user.create({ data: { ...data.user, lastLoginAt: null } });
    await tx.userRole.createMany({ data: data.assignments.map(row => ({ ...row, assignedBy: null })) });
    await tx.rolePermission.createMany({ data: data.grants.map(row => ({ ...row, permissionId: permissionIds.get(row.permissionId), grantedBy: null })) });
    if (data.settings.length) await tx.siteSetting.createMany({ data: data.settings });
    if (data.rates.length) await tx.fxRate.createMany({ data: data.rates });
    if (data.blogs.length) await tx.blog.createMany({ data: data.blogs });
    if (data.translations.length) await tx.catalogueTranslation.createMany({ data: data.translations });
    if (data.media.length) await tx.mediaAsset.createMany({ data: data.media.map(row => ({ ...row, uploaderId: row.uploaderId === data.user.id ? row.uploaderId : null })) });
  }, { timeout: 30000 });
}
async function verifyTarget(target, data) {
  const allowed = new Set(['_prisma_migrations', 'roles', 'permissions', 'role_permissions', 'user_roles', 'users', 'site_settings', 'fx_rates', 'blogs', 'catalogue_translations', 'media_assets']);
  const counts = {};
  for (const table of await tables(target)) {
    const [row] = await target.$queryRawUnsafe(`SELECT COUNT(*) AS n FROM \`${table}\``);
    counts[table] = Number(row.n);
    if (!allowed.has(table) && counts[table]) throw new Error(`Excluded table ${table} is not empty.`);
  }
  const targetUser = await target.user.findUnique({ where: { emailNormalized: ADMIN } });
  if (counts.users !== 1 || !targetUser || targetUser.passwordHash !== data.user.passwordHash || targetUser.status !== 'ACTIVE') throw new Error('Admin preservation failed.');
  const blogs = await target.blog.findMany({ orderBy: { slug: 'asc' } });
  const settings = await target.siteSetting.findMany({ orderBy: { key: 'asc' } });
  if (digest(blogs) !== digest(data.blogs) || digest(settings) !== digest(data.settings)) throw new Error('Retained content is not identical.');
  if (counts.catalogue_translations !== data.translations.length || counts.fx_rates !== data.rates.length || counts.media_assets !== data.media.length) throw new Error('Reference counts do not match.');
  const assigned = await target.userRole.findMany({ where: { userId: targetUser.id }, include: { role: true } });
  if (!assigned.some(row => row.role.key === 'SUPER_ADMIN')) throw new Error('Admin role missing.');
  return counts;
}
async function main() {
  const { PrismaClient } = require('@prisma/client');
  const urls = connections(process.env.DATABASE_URL);
  const source = new PrismaClient({ datasources: { db: { url: urls.source } } });
  const target = new PrismaClient({ datasources: { db: { url: urls.target } } });
  const envHash = digest(fs.readFileSync('.env').toString());
  try {
    const actualSource = await source.$queryRawUnsafe('SELECT DATABASE() AS name');
    const actualTarget = await target.$queryRawUnsafe('SELECT DATABASE() AS name');
    const resume = process.argv.includes('--finish-reviewed-schema');
    const apply = process.argv.includes('--apply') || resume;
    if (actualSource[0].name !== SOURCE || actualTarget[0].name !== TARGET) throw new Error('Require the exact approved local databases.');
    if (!resume && (await tables(target)).length) throw new Error('Require an entirely empty approved target on first application.');
    if (resume) {
      const done = await target.$queryRawUnsafe('SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations');
      if (stable(done.filter(row => row.finished_at && !row.rolled_back_at).map(row => row.migration_name).sort()) !== stable(migrations())) throw new Error('Resume requires this exact completed migration baseline.');
      for (const table of await tables(target)) {
        if (!/^[a-z0-9_]+$/i.test(table)) throw new Error('Unexpected table name.');
        if (['_prisma_migrations', 'permissions'].includes(table)) continue;
        const [row] = await target.$queryRawUnsafe(`SELECT COUNT(*) AS n FROM \`${table}\``);
        if (Number(row.n)) throw new Error('Resume refuses a target containing application data.');
      }
    }
    reviewSql();
    const history = await source.$queryRawUnsafe('SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations');
    const applied = history.filter(row => row.finished_at && !row.rolled_back_at).map(row => row.migration_name).sort();
    if (stable(applied) !== stable(migrations())) throw new Error('Source migration baseline is not the current repository baseline.');
    const baseline = await fingerprint(source);
    const data = await collect(source);
    const plan = { source: SOURCE, target: TARGET, admin: ADMIN, migrations: applied.length, retained: { users: 1, roles: data.roles.length, permissions: data.permissions.length, roleGrants: data.grants.length, settings: data.settings.length, blogs: data.blogs.length, blogTranslations: data.translations.length, rates: data.rates.length, referencedMedia: data.media.length }, sourceCounts: Object.fromEntries(Object.entries(baseline).map(([key, value]) => [key, value.count])) };
    console.log(stable({ mode: resume ? 'finish-reviewed-schema' : apply ? 'apply' : 'dry-run', ...plan }));
    if (!apply) return;
    if (resume) {
      const fix = 'ALTER TABLE `users` ADD COLUMN `avatar` VARCHAR(500) NULL;';
      const inspected = fs.readFileSync('CLIENT_DATABASE_SCHEMA_REVIEW.sql', 'utf8').replace(/--[^\n]*/g, '').trim();
      if (inspected !== fix) throw new Error('Reviewed SQL does not match the one approved empty-table correction.');
      const existing = await target.$queryRawUnsafe("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='avatar'");
      if (!existing.length) await target.$executeRawUnsafe(fix);
    }
    const deployed = prisma(['migrate', 'deploy', '--schema', 'prisma/schema.prisma'], urls.target);
    console.log(deployed.output);
    if (deployed.status !== 0) throw new Error('Target migration deploy failed; no source records were modified.');
    const drift = prisma(['migrate', 'diff', '--from-schema-datasource', 'prisma/schema.prisma', '--to-schema-datamodel', 'prisma/schema.prisma', '--script', '--exit-code'], urls.target);
    if (drift.status !== 0 && drift.status !== 2) throw new Error('Target schema comparison failed before content copy.');
    if (drift.status === 2) {
      // Never auto-apply an unreviewed corrective SQL diff.
      fs.writeFileSync('CLIENT_DATABASE_SCHEMA_REVIEW.sql', (drift.output.split('warn The configuration')[0]).trim() + '\n');
      console.log('Target schema needs review; structure-only SQL saved to CLIENT_DATABASE_SCHEMA_REVIEW.sql. No content copied.');
      process.exitCode = 2; return;
    }
    await transfer(target, data);
    const counts = await verifyTarget(target, data);
    const after = await fingerprint(source);
    const changed = Object.keys(baseline).filter(key => stable(baseline[key]) !== stable(after[key]));
    if (changed.length || Object.keys(after).length !== Object.keys(baseline).length) throw new Error(`Source changed during transfer: ${changed.join(', ')}. This tool performs source SELECTs only; investigate concurrent application writes.`);
    if (digest(fs.readFileSync('.env').toString()) !== envHash) throw new Error('Environment file changed during operation.');
    const result = { ...plan, targetCounts: counts, sourceUnchanged: true, environmentUnchanged: true, retainedBlogsIdentical: true, retainedSettingsIdentical: true, adminPasswordPreserved: true, sourceFingerprints: baseline };
    fs.writeFileSync('CLIENT_DATABASE_TRANSFER_RESULT.json', JSON.stringify(result, null, 2) + '\n');
    console.log(stable({ done: true, sourceUnchanged: true, environmentUnchanged: true, targetCounts: counts }));
  } finally { await source.$disconnect(); await target.$disconnect(); }
}
module.exports = { connections, settingAllowed, inspectRetainedLinks, digest };
if (require.main === module) main().catch(error => { console.error('STOP:', error.code || error.message.replace(/mysql:\/\/[^\s]+/g, '[redacted]')); process.exitCode = 1; });
