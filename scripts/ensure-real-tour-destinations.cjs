// Owner-approved local-only destination operation. Never imports missing tours.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '../..');
const folder = path.join(root, 'DESTINATIONS_REAL_TOURS_VERIFICATION');
const target = 'star_pyramids_production';
const allowed = ['fayoum', 'ismailia', 'ain-sokhna'];
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const plain = value => JSON.parse(JSON.stringify(value));
const normalizedName = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
function targetUrl(source) {
  const url = new URL(source);
  assert.equal(url.protocol, 'mysql:'); assert.equal(url.hostname, '127.0.0.1');
  assert.equal(url.port || '3306', '3306'); assert.equal(url.pathname, '/star_pyramids');
  url.pathname = '/' + target;
  return url.toString(); // Isolated client only: NEVER writes .env or switches the application.
}
function destinationPlan(rows, translations, proposals) {
  assert.deepEqual(proposals.map(row => row.slug), allowed);
  const synonyms = { fayoum:['fayoum','elfayoum','fayum','elfayum'], ismailia:['ismailia','ismailiya'], 'ain-sokhna':['ainsokhna','elainsokhna'] };
  return proposals.map(proposal => {
    assert.equal(proposal.isPublished, false); assert.equal(proposal.showInDestinations, false);
    assert.equal(proposal.showInOneDayTours, true); assert.equal(proposal.image, '');
    assert.deepEqual(proposal.detail.tourSlugs, []); assert.ok(!proposal.tourChanges?.length);
    const matches = rows.filter(row => row.slug === proposal.slug || synonyms[proposal.slug].includes(normalizedName(row.slug)) || synonyms[proposal.slug].includes(normalizedName(row.title)));
    assert.ok(matches.length <= 1, 'Duplicate/alternate-name destination requires review: ' + proposal.slug);
    const translation = translations.find(row => row.slug === proposal.slug);
    if (!matches.length) {
      assert.ok(!translation, 'Orphan destination translations require review: ' + proposal.slug);
      return { slug:proposal.slug, action:'create' };
    }
    const existing = matches[0];
    assert.equal(existing.slug, proposal.slug, 'Existing alternate slug requires review; do not create duplicate.');
    for (const key of ['title','nameAr','copy','copyAr','image','displayOrder','showInDestinations','showInOneDayTours','isPublished']) assert.deepEqual(existing[key], proposal[key], 'Existing destination differs: ' + proposal.slug + ':' + key);
    assert.deepEqual(JSON.parse(existing.detail), proposal.detail, 'Existing destination detail differs.');
    assert.ok(translation, 'Existing destination translations missing; no overwrite authorized.');
    assert.deepEqual(JSON.parse(translation.payload), proposal.translations, 'Existing translations differ.');
    return { slug:proposal.slug, action:'already-present', id:existing.id };
  });
}
function baselineComparable(row) {
  const copy = plain(row);
  for (const key of ['createdAt','updatedAt']) if (copy[key]) copy[key] = new Date(String(copy[key]).replace(' ','T').replace(/Z$/, '')+'Z').toISOString();
  for (const key of ['showInOneDayTours','showInDestinations','isPublished']) if (key in copy) copy[key] = Boolean(copy[key]);
  if ('price' in copy) copy.price = Number(copy.price);
  return copy;
}
async function main() {
  const apply = process.argv.includes('--apply');
  assert.ok(process.argv.includes('--target=star_pyramids_production'), 'Exact owner-approved local target is required.');
  assert.ok(process.argv.slice(2).every(arg => ['--apply','--plan','--target=star_pyramids_production'].includes(arg)), 'Unknown operation argument.');
  assert.ok(!(apply && process.argv.includes('--plan')), 'Choose plan or apply, not both.');
  const envFile = path.join(root,'web-source/.env');
  const envBefore = fs.readFileSync(envFile);
  const source = envBefore.toString('utf8').match(/^\s*DATABASE_URL\s*=\s*(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g,'');
  const url = targetUrl(source);
  const appRequire = createRequire(path.join(root,'web-source/package.json'));
  const { register } = appRequire('tsx/cjs/api'); register();
  const { validateDestinationWrite } = appRequire('./lib/destination-write.ts');
  const { validateCatalogueTranslations } = appRequire('./lib/catalogue-translations.ts');
  const { PrismaClient } = appRequire('@prisma/client');
  const proposals = JSON.parse(fs.readFileSync(path.join(root,'REAL_TOURS_IMPLEMENTATION_REVIEW/missing-destinations.json'),'utf8'));
  for (const proposal of proposals) { validateDestinationWrite(proposal,true); validateCatalogueTranslations('destination',proposal.translations); }
  const batchBytes = fs.readFileSync(path.join(root,'REAL_TOURS_IMPORT_PACKAGE_V3_DESTINATIONS/all-26-tours.json'));
  const batch = JSON.parse(batchBytes); assert.equal(batch.length,26); assert.ok(batch.every(row => row.status === 'draft'));
  const baseline = JSON.parse(fs.readFileSync(path.join(folder,'before-target.json'),'utf8'));
  const db = new PrismaClient({ datasourceUrl:url });
  try {
    const result = await db.$transaction(async tx => {
      const [identity] = await tx.$queryRaw`SELECT DATABASE() AS dbName, @@port AS port, @@innodb_force_recovery AS recovery`;
      assert.equal(identity.dbName,target); assert.equal(Number(identity.port),3306); assert.equal(Number(identity.recovery),0);
      // Cooperate with existing destination rename/delete locking; no source DB is used here.
      await tx.$queryRaw`SELECT slug FROM destinations ORDER BY slug FOR UPDATE`;
      const existing = await tx.destination.findMany({orderBy:{slug:'asc'}});
      const translations = await tx.catalogueTranslation.findMany({where:{entityType:'destination'}});
      const tours = await tx.tour.findMany({orderBy:{slug:'asc'}});
      assert.equal(tours.length,baseline.tours.length,'Tour collection changed since approved preflight; stop for review.');
      for (const row of baseline.tours) assert.deepEqual(baselineComparable(tours.find(item => item.id===row.id)),baselineComparable(row),'Existing tour changed since preflight.');
      for (const row of baseline.destinations) assert.deepEqual(baselineComparable(existing.find(item=>item.id===row.id)),baselineComparable(row),'Existing destination changed since preflight.');
      for (const row of baseline.translations) assert.deepEqual(translations.find(item=>item.entityType===row.entityType&&item.slug===row.slug),row,'Existing translation changed since preflight.');
      const plan = destinationPlan(existing,translations,proposals);
      const allowedSlugs = new Set([...existing.map(row=>row.slug),...proposals.map(row=>row.slug)]);
      assert.ok(batch.every(row=>allowedSlugs.has(row.destinationSlug)),'A required destination is absent.');
      for(const proposed of batch) {
        const aliasOwner=tours.find(row=>row.slug!==proposed.slug&&JSON.parse(row.aliases).includes(proposed.slug));
        assert.ok(!aliasOwner,'A batch slug is an alias of another existing tour.');
      }
      const actions=[];
      for (const item of plan) {
        if (item.action!=='create' || !apply) { actions.push(item); continue; }
        const proposal=proposals.find(row=>row.slug===item.slug);
        const {translations:content,...fields}=proposal;
        const created=await tx.destination.create({data:{...fields,detail:JSON.stringify(fields.detail)}});
        // Create-only: never upsert or replace existing translation payloads.
        await tx.catalogueTranslation.create({data:{entityType:'destination',slug:created.slug,payload:JSON.stringify(content)}});
        actions.push({slug:created.slug,id:created.id,action:'created-unpublished'});
      }
      const tourActions=[];
      for (const proposed of batch) {
        const stored=tours.find(row=>row.slug===proposed.slug);
        if (!stored) {tourActions.push({slug:proposed.slug,action:'not-imported',tourId:null});continue;}
        if (stored.destinationSlug===proposed.destinationSlug) {tourActions.push({slug:stored.slug,tourId:stored.id,action:'verified-existing-link-no-write'});continue;}
        assert.equal(stored.status,'draft','Never change a published tour destination.');
        assert.notEqual(stored.slug,'full-day-pyramids','Tour 01 differs; stop rather than overwrite it.');
        if (apply) {
          const changed=await tx.tour.updateMany({where:{id:stored.id,status:'draft',destinationSlug:stored.destinationSlug,updatedAt:stored.updatedAt},data:{destinationSlug:proposed.destinationSlug}});
          assert.equal(changed.count,1,'Draft relationship changed concurrently.');
        }
        tourActions.push({slug:stored.slug,tourId:stored.id,action:apply?'draft-destination-linked':'would-link-draft'});
      }
      if (apply) {
        const readback=await tx.destination.findMany();
        const languageRows=await tx.catalogueTranslation.findMany({where:{entityType:'destination'}});
        assert.equal(readback.length,existing.length+plan.filter(row=>row.action==='create').length);
        assert.ok(destinationPlan(readback,languageRows,proposals).every(row=>row.action==='already-present'));
        assert.ok(batch.every(row=>readback.some(d=>d.slug===row.destinationSlug)));
        const actualTours=await tx.tour.findMany();assert.equal(actualTours.length,tours.length,'Never create or delete tours.');
        for (const old of tours) {
          const action=tourActions.find(item=>item.tourId===old.id);
          const actual=actualTours.find(row=>row.id===old.id);
          if (action?.action==='draft-destination-linked') {
            const expected={...old,destinationSlug:batch.find(row=>row.slug===old.slug).destinationSlug,updatedAt:actual.updatedAt};
            assert.deepEqual(plain(actual),plain(expected));
          } else assert.deepEqual(plain(actual),plain(old),'Existing tour content must remain unchanged.');
        }
        for (const old of existing) assert.deepEqual(plain(readback.find(row=>row.id===old.id)),plain(old),'Existing destination must remain unchanged.');
      }
      return {target:'127.0.0.1:3306/'+target,mode:apply?'apply':'plan-only',destinationActions:actions,tourActions,packageSha256:hash(batchBytes),proposalSha256:hash(JSON.stringify(proposals)),sourceConfigurationSha256:hash(envBefore)};
    },{maxWait:10000,timeout:30000});
    assert.ok(fs.readFileSync(envFile).equals(envBefore),'Application connection configuration changed.');
    const output=path.join(folder,apply?'destination-operation.json':'destination-plan.json');
    fs.writeFileSync(output,JSON.stringify(plain(result),null,2)+'\n');
    console.log(JSON.stringify(result,null,2));
  } finally {await db.$disconnect();}
}
module.exports={targetUrl,destinationPlan,baselineComparable};
if(require.main===module) main().catch(error=>{console.error('Destination operation stopped:',error instanceof assert.AssertionError ? error.message : 'Database/client operation failed; no credentials logged. Inspect local state read-only before any retry.');process.exitCode=1;});
