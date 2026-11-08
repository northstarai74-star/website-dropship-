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
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push(m.text()); });
  await page.goto(base);
  const cards = () => page.locator('.product-card:not([hidden])').count();
  const waitCards = (n) => page.waitForFunction((k) => document.querySelectorAll('.product-card:not([hidden])').length === k, n);

  // home
  assert.equal(await cards(), 8); // 4 bestsellers + 4 new
  assert.match(await page.title(), /Needverse/);

  // shop: 12 products, filter, sort, search
  await page.goto(`${base}#/shop`);
  assert.equal(await cards(), 12);
  await page.click('.chip[data-cat="auto"]');
  assert.equal(await cards(), 6);
  await page.selectOption('#sort', 'price-asc');
  assert.equal(await page.locator('.product-card .price').first().textContent(), '$37');
  assert.match(page.url(), /#\/shop\/auto\?sort=price-asc/);
  await page.goto(`${base}#/shop?q=lamp`);
  assert.equal(await cards(), 1);
  await page.click('[data-clear]');
  assert.equal(await cards(), 12);

  // wishlist: save from the grid, see it in the header and on its page, survive a reload
  await page.goto(`${base}#/shop`);
  await page.click('.product-card[data-id="lamp"] [data-wish]');
  assert.equal(await page.locator('.wish-count').textContent(), '1');
  await page.reload();
  assert.equal(await page.locator('.wish-count').textContent(), '1');
  await page.goto(`${base}#/wishlist`);
  assert.equal(await cards(), 1);
  await page.click('[data-wish="lamp"]');
  assert.match(await page.textContent('.wish-empty'), /Nothing saved yet/);
  assert.equal(await page.locator('.wish-count').isHidden(), true);

  // live search suggestions + enter
  await page.click('.search-toggle');
  await page.fill('#search-input', 'massage');
  assert.equal(await page.locator('.search-results li').count(), 2);
  await page.keyboard.press('Enter');
  assert.match(page.url(), /#\/shop\?q=massage/);
  await waitCards(2);

  // product page: variant, qty, add to bag
  await page.goto(`${base}#/product/relaxer`);
  assert.match(await page.textContent('h1'), /little relaxer/);
  assert.match(await page.title(), /The little relaxer/);
  assert.match(await page.getAttribute('meta[name="description"]', 'content'), /massage gun/i);
  const ld = JSON.parse(await page.locator('#ld-json').textContent());
  assert.equal(ld['@type'], 'Product');
  assert.equal(ld.offers.price, '48.00');
  assert.equal(ld.aggregateRating, undefined); // sample ratings stay out of structured data
  await page.click('.swatch[data-color="graphite"]');
  assert.equal(await page.textContent('#color-label'), 'Graphite');
  await page.click('[data-q="1"]');
  assert.match(await page.textContent('#pdp-add'), /\$96/);
  await page.click('#pdp-add');
  assert.equal(await page.locator('.bag-panel.open').count(), 1);
  assert.equal(await page.locator('.bag-count').textContent(), '2');

  // bag: stepper, free-shipping progress, promo
  assert.match(await page.textContent('.ship-progress'), /unlocked free shipping/);
  await page.click('[data-dec="relaxer|graphite"]');
  assert.equal(await page.locator('.bag-row .qty output').textContent(), '1');
  assert.match(await page.textContent('.ship-progress'), /\$27/);
  await page.click('[data-inc="relaxer|graphite"]');
  await page.click('[data-inc="relaxer|graphite"]');
  assert.equal(await page.locator('.bag-row .qty output').textContent(), '3');
  assert.equal(await page.evaluate(() => document.activeElement.dataset.inc), 'relaxer|graphite');
  assert.match(await page.textContent('.ship-progress'), /unlocked free shipping/);
  await page.fill('#promo-code', 'nope');
  await page.press('#promo-code', 'Enter');
  assert.match(await page.textContent('.promo-msg'), /isn.t valid/);
  await page.fill('#promo-code', 'needverse10');
  await page.press('#promo-code', 'Enter');
  assert.match(await page.textContent('.promo-applied'), /NEEDVERSE10/);

  // persistence
  await page.keyboard.press('Escape');
  await page.reload();
  assert.equal(await page.locator('.bag-count').textContent(), '3');

  // checkout -> demo order
  await page.goto(`${base}#/checkout`);
  assert.match(await page.textContent('.summary-totals'), /Free/);
  await page.check('input[value="express"]');
  assert.match(await page.textContent('.summary-totals'), /\$14\.95/);
  await page.fill('#f-email', 'test@example.com');
  await page.fill('#f-given-name', 'Ada');
  await page.fill('#f-family-name', 'Lovelace');
  await page.fill('#f-address-line1', '1 Example Street');
  await page.fill('#f-address-level2', 'London');
  await page.fill('#f-address-level1', 'London');
  await page.fill('#f-postal-code', 'N1 1AA');
  assert.equal(await page.locator('input[type="password"], input[autocomplete^="cc-"]').count(), 0);
  await page.click('button[type="submit"]');
  await page.waitForSelector('.order');
  assert.match(await page.textContent('main'), /Thank you, Ada/);
  assert.equal(await page.locator('.bag-count').textContent(), '0');

  // info pages + 404
  for (const slug of ['shipping', 'returns', 'faq', 'contact', 'about', 'privacy', 'terms']) {
    await page.goto(`${base}#/page/${slug}`);
    assert.ok((await page.locator('main h1').textContent()).length > 3, slug);
  }
  await page.goto(`${base}#/product/nope`);
  assert.match(await page.textContent('main'), /Nothing here/);

  // mobile: menu closes on outside tap, no horizontal overflow on key pages
  const mobile = await browser.newPage({ viewport: { width: 375, height: 800 } });
  await mobile.goto(base);
  await mobile.click('.menu-toggle');
  await mobile.mouse.click(180, 770);
  assert.equal(await mobile.locator('.main-nav.open').count(), 0);
  for (const hash of ['#/', '#/shop', '#/product/lamp', '#/page/faq']) {
    await mobile.goto(`${base}${hash}`);
    assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow on ${hash}`);
  }

  assert.deepEqual(errors, []);
  console.log('smoke test passed');
} finally {
  await browser.close();
  server.close();
}
