// Browser smoke test: `npm test` (needs Playwright with Chromium available).
import assert from 'node:assert/strict';
import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

const server = createServer((req, res) => {
  const path = join(root, new URL(req.url, 'http://x').pathname.replace(/^\/$/, '/index.html'));
  if (!path.startsWith(root) || !existsSync(path)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' });
  createReadStream(path).pipe(res);
}).listen(0);
const base = `http://localhost:${server.address().port}/index.html`;

const browser = await chromium.launch();
try {
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base);

  const visible = () => page.locator('.product-card:not([hidden])').count();
  assert.equal(await visible(), 4);

  // category + search combine; clearing search keeps the category
  await page.click('.chip[data-filter="home"]');
  await page.click('.search-toggle');
  await page.fill('#search-input', 'foot');
  assert.equal(await visible(), 1);
  assert.match(await page.locator('.result-text').textContent(), /1 product in Home for “foot”/);
  await page.click('.search-close');
  await page.click('.chip[data-filter="auto"]');
  assert.equal(await visible(), 0);
  await page.click('.result-clear');
  assert.equal(await visible(), 2);

  // bag: add, step, remove, persist
  await page.click('.chip[data-filter="all"]');
  const add = page.locator('.product-card[data-id="relaxer"] [data-add]');
  await add.click();
  await add.click();
  assert.equal(await page.locator('.bag-count').textContent(), '2');
  await page.click('.bag-button');
  await page.click('[data-inc="relaxer"]');
  assert.match(await page.locator('.bag-subtotal b').textContent(), /\$144/);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.inc), 'relaxer');
  for (let i = 0; i < 3; i++) await page.click('[data-dec="relaxer"]');
  assert.match(await page.locator('.bag-body').textContent(), /A little empty/);
  await page.click('.bag-close');
  await add.click();
  await page.reload();
  assert.equal(await page.locator('.bag-count').textContent(), '1');

  // shareable URL state
  await page.goto(`${base}?cat=auto&q=vac`);
  assert.equal(await visible(), 1);

  // mobile menu closes on outside tap, no horizontal overflow
  const mobile = await browser.newPage({ viewport: { width: 375, height: 800 } });
  await mobile.goto(base);
  await mobile.click('.menu-toggle');
  await mobile.mouse.click(180, 760);
  assert.equal(await mobile.locator('.main-nav.open').count(), 0);
  assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

  assert.deepEqual(errors, []);
  console.log('smoke test passed');
} finally {
  await browser.close();
  server.close();
}
