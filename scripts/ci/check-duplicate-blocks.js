#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-console */
/**
 * Fails if this site has a local block (blocks/<name>/<name>.js) whose
 * name also exists in fedlibs' catalog, unless it's listed in
 * blocks/local-overrides.json with a non-empty name + reason.
 *
 * Usage: FEDLIBS_ORIGIN=https://main--fedlibs--your-org.aem.live node scripts/ci/check-duplicate-blocks.js
 */
const fs = require('fs');
const path = require('path');

const { FEDLIBS_ORIGIN } = process.env;
const BLOCKS_DIR = path.join(__dirname, '..', '..', 'blocks');
const OVERRIDES_PATH = path.join(BLOCKS_DIR, 'local-overrides.json');

async function main() {
  if (!FEDLIBS_ORIGIN) {
    console.error('FEDLIBS_ORIGIN env var is required, e.g. https://main--fedlibs--your-org.aem.live');
    process.exit(1);
  }

  const res = await fetch(`${FEDLIBS_ORIGIN}/blocks-catalog.json`);
  if (!res.ok) {
    console.error(`Could not fetch fedlibs catalog from ${FEDLIBS_ORIGIN} (${res.status})`);
    process.exit(1);
  }
  const { blocks: catalogBlocks } = await res.json();
  const catalogNames = new Set(catalogBlocks.map((b) => b.name));

  const localBlockNames = fs.readdirSync(BLOCKS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => fs.existsSync(path.join(BLOCKS_DIR, name, `${name}.js`)));

  let overrides = [];
  if (fs.existsSync(OVERRIDES_PATH)) {
    overrides = JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf8'));
  }
  const justifiedNames = new Set(
    overrides.filter((o) => o.name && o.reason && o.owner).map((o) => o.name),
  );

  const unjustifiedCollisions = localBlockNames.filter(
    (name) => catalogNames.has(name) && !justifiedNames.has(name),
  );

  if (unjustifiedCollisions.length > 0) {
    console.error('\n❌ Local block(s) duplicate the fedlibs catalog without justification:\n');
    unjustifiedCollisions.forEach((name) => console.error(`   - blocks/${name}/`));
    console.error(`
   These block names already exist in fedlibs (${FEDLIBS_ORIGIN}/blocks-catalog.json).
   Either:
   1) Delete the local copy and let it resolve from fedlibs automatically, or
   2) If it's genuinely site-specific, add an entry to blocks/local-overrides.json
      with a "name", "reason", and "owner" explaining why it needs to stay local.
`);
    process.exit(1);
  }

  console.log(`✅ No unjustified block duplication (${localBlockNames.length} local blocks checked against ${catalogNames.size} catalog entries).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
