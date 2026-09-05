import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import configure from '../vite.config.ts';

test('portal build ignores implicit dotenv demo links and uses the same explicit URLs as release verification', () => {
  const cwd = process.cwd(), site = process.env.PORTAL_SITE_URL, demo = process.env.PORTAL_DEMO_URL;
  const dir = mkdtempSync(join(tmpdir(), 'portal-config-'));
  try {
    writeFileSync(join(dir, '.env.portal'), 'PORTAL_DEMO_URL=https://unreviewed.demo.dev/\n');
    process.chdir(dir);
    process.env.PORTAL_SITE_URL = 'https://portal-preview.invalid';
    delete process.env.PORTAL_DEMO_URL;
    const config = configure({ command: 'build', mode: 'portal', isPreview: false });
    assert.equal(config.define.__PORTAL_DEMO_URL__, '""');
    process.env.PORTAL_DEMO_URL = 'https://invited.demo.dev/demo/';
    assert.equal(configure({ command: 'build', mode: 'portal', isPreview: false }).define.__PORTAL_DEMO_URL__, '"https://invited.demo.dev/demo/"');
    process.env.PORTAL_DEMO_URL = 'https://demo.local/';
    assert.throws(() => configure({ command: 'build', mode: 'portal' }), /public hostname/);
  } finally {
    process.chdir(cwd);
    if (site === undefined) delete process.env.PORTAL_SITE_URL; else process.env.PORTAL_SITE_URL = site;
    if (demo === undefined) delete process.env.PORTAL_DEMO_URL; else process.env.PORTAL_DEMO_URL = demo;
    rmSync(dir, { recursive: true, force: true });
  }
});
