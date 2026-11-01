// Target-only additive transfer explicitly requested by the owner. Dry run by default.
const { PrismaClient } = require('@prisma/client');
const { connections, digest } = require('./prepare-client-database.cjs');
const fs = require('node:fs');
async function main() {
  const urls = connections(process.env.DATABASE_URL);
  const source = new PrismaClient({ datasources: { db: { url: urls.source } } });
  const target = new PrismaClient({ datasources: { db: { url: urls.target } } });
  const envHash = digest(fs.readFileSync('.env', 'utf8'));
  try {
    for (const [client, expected] of [[source, 'travneeds'], [target, 'travneeds_production']]) {
      const [row] = await client.$queryRawUnsafe('SELECT DATABASE() AS name');
      if (row.name !== expected) throw new Error('Database identity mismatch');
    }
    const read = async client => ({ destinations: await client.destination.findMany({ orderBy: { slug: 'asc' } }), translations: await client.catalogueTranslation.findMany({ where: { entityType: 'destination' }, orderBy: { slug: 'asc' } }) });
    const data = await read(source);
    data.translations = data.translations.filter(row => data.destinations.some(d => d.slug === row.slug));
    // Do not create dangling upload references or silently change storage.
    if (/\/media\//.test(JSON.stringify(data))) throw new Error('Uploaded destination media requires a reviewed media-reference transfer first');
    const existing = await read(target);
    if (existing.destinations.length || existing.translations.length) throw new Error('Target destination data already exists; no overwrite permitted');
    console.log(JSON.stringify({ source: 'travneeds', target: 'travneeds_production', destinations: data.destinations.length, translations: data.translations.length, apply: process.argv.includes('--apply') }));
    if (!process.argv.includes('--apply')) return;
    await target.$transaction(async tx => {
      if (await tx.destination.count() || await tx.catalogueTranslation.count({ where: { entityType: 'destination' } })) throw new Error('Target changed; stopping');
      for (const row of data.destinations) await tx.destination.create({ data: row });
      for (const row of data.translations) await tx.catalogueTranslation.create({ data: row });
      if (digest(await read(tx)) !== digest(data)) throw new Error('Copied content mismatch');
    });
    const after = await read(source);
    after.translations = after.translations.filter(row => data.destinations.some(d => d.slug === row.slug));
    if (digest(after) !== digest(data) || digest(fs.readFileSync('.env', 'utf8')) !== envHash) throw new Error('Source/environment verification failed');
    console.log('Verified: destination IDs/content/translations preserved; source and .env unchanged. No other tables written.');
  } finally { await Promise.all([source.$disconnect(), target.$disconnect()]); }
}
main().catch(error => { console.error('STOP:', error.code || error.message); process.exitCode = 1; });
