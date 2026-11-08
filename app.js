(() => {
  'use strict';

  const { SITE, PRODUCTS, REVIEWS, PAGES, art } = window.NV;
  const BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]));
  const PAL = art.PALETTES;
  const STORAGE_KEY = 'needverse-bag-v2';
  const ORDER_KEY = 'needverse-order';
  const MAX_QTY = 10;

  /* ---------- Helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const round2 = (n) => Math.round(n * 100) / 100;
  const money = (n) => '$' + (Number.isInteger(n) ? n : n.toFixed(2));
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const picture = (p, color = p.colors[0]) => art.render(p.art.kind, color, p.art.opts);

  const main = $('#main');
  const toast = $('.toast');
  const bagCount = $('.bag-count');
  const panelCount = $('.panel-count');
  const bagBtn = $('.bag-button');
  const searchBtn = $('.search-toggle');
  const menuBtn = $('.menu-toggle');
  const nav = $('.main-nav');
  const bag = $('.bag-panel');
  const bagBody = $('.bag-body');
  const bagClose = $('.bag-close');
  const search = $('.search-panel');
  const searchInput = $('#search-input');
  const searchResults = $('.search-results');
  const scrim = $('.scrim');

  const ICONS = {
    truck: '<path d="M2 6h11v9H2zM13 9h4l3 3v3h-7"/><circle cx="6.5" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/>',
    back: '<path d="M4 9h11a5 5 0 0 1 0 10H8"/><path d="m7 5-3 4 3 4"/>',
    shield: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="m9 12 2 2 4-4"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>'
  };
  const icon = (name) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

  /* ---------- Toast ---------- */
  let toastTimer;
  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  };

  /* ---------- Cart state (persisted) ---------- */
  const cart = { lines: new Map(), promo: false };

  const loadCart = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      Object.entries(saved.lines || {}).forEach(([key, qty]) => {
        const [id, color] = key.split('|');
        const p = BY_ID.get(id);
        if (p && p.colors.includes(color) && Number.isInteger(qty) && qty > 0) cart.lines.set(key, Math.min(qty, MAX_QTY));
      });
      cart.promo = saved.promo === true;
    } catch { /* unavailable or corrupted storage: start empty */ }
  };
  const saveCart = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines: Object.fromEntries(cart.lines), promo: cart.promo })); } catch { /* storage unavailable */ }
  };

  const lineItems = () => [...cart.lines].map(([key, qty]) => {
    const [id, color] = key.split('|');
    return { key, id, color, qty, p: BY_ID.get(id) };
  });
  const itemCount = () => [...cart.lines.values()].reduce((sum, qty) => sum + qty, 0);
  const subtotal = () => round2(lineItems().reduce((sum, l) => sum + l.p.price * l.qty, 0));
  const discount = () => (cart.promo ? round2(subtotal() * SITE.promo.percent / 100) : 0);
  const netSubtotal = () => round2(subtotal() - discount());
  const shippingCost = (method = 'standard') => {
    if (!cart.lines.size) return 0;
    if (method === 'express') return SITE.shipping.express;
    return netSubtotal() >= SITE.freeShippingOver ? 0 : SITE.shipping.standard;
  };
  const totals = (method) => {
    const ship = shippingCost(method);
    return { sub: subtotal(), disc: discount(), ship, total: round2(netSubtotal() + ship) };
  };

  const cartListeners = new Set();
  const commitCart = () => {
    saveCart();
    const count = itemCount();
    bagCount.textContent = count;
    panelCount.textContent = `(${count})`;
    bagBtn.setAttribute('aria-label', `Shopping bag, ${plural(count, 'item')}`);
    if (bag.classList.contains('open')) renderBag();
    cartListeners.forEach((fn) => fn());
  };

  const addToCart = (id, color, qty = 1) => {
    const key = `${id}|${color}`;
    cart.lines.set(key, Math.min((cart.lines.get(key) || 0) + qty, MAX_QTY));
    commitCart();
  };

  /* ---------- Panels (bag + search) ---------- */
  let openPanel = null;
  let opener = null;

  const closePanels = ({ restore = true } = {}) => {
    const was = openPanel;
    [bag, search].forEach((panel) => {
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
      panel.inert = true;
    });
    bagBtn.setAttribute('aria-expanded', 'false');
    searchBtn.setAttribute('aria-expanded', 'false');
    scrim.classList.remove('visible');
    document.documentElement.classList.remove('panel-open');
    openPanel = null;
    if (was && restore && opener && document.contains(opener)) opener.focus();
    if (was) opener = null;
  };

  const openPanelFor = (panel, button, focusTarget) => {
    const previous = openPanel ? opener : document.activeElement;
    closePanels({ restore: false });
    opener = previous instanceof HTMLElement && previous !== document.body ? previous : button;
    openPanel = panel;
    panel.inert = false;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    button.setAttribute('aria-expanded', 'true');
    scrim.classList.add('visible');
    document.documentElement.classList.add('panel-open');
    focusTarget().focus();
  };

  const openBag = () => {
    renderBag();
    openPanelFor(bag, bagBtn, () => bagClose);
  };

  /* ---------- Bag drawer ---------- */
  const bagRow = (l) => {
    const color = PAL[l.color].label;
    const name = esc(l.p.name);
    return `<li class="bag-row">
      <a class="bag-thumb" href="#/product/${l.id}" tabindex="-1" aria-hidden="true">${picture(l.p, l.color)}</a>
      <div class="bag-name"><a href="#/product/${l.id}">${name}</a><small>${color} · ${money(l.p.price)} each</small>
        <span class="qty" role="group" aria-label="Quantity of ${name}, ${color}">
          <button type="button" data-dec="${l.key}" aria-label="Decrease quantity of ${name}, ${color}">&minus;</button>
          <output>${l.qty}</output>
          <button type="button" data-inc="${l.key}" aria-label="Increase quantity of ${name}, ${color}"${l.qty >= MAX_QTY ? ' disabled' : ''}>+</button>
        </span></div>
      <div class="bag-side"><span>${money(l.p.price * l.qty)}</span><button type="button" data-remove="${l.key}" aria-label="Remove ${name}, ${color}">Remove</button></div>
    </li>`;
  };

  const renderBag = () => {
    const lines = lineItems();
    if (!lines.length) {
      bagBody.innerHTML = '<div class="bag-empty"><h3>A little empty<br />in here.</h3><p>Your good finds will live here.</p><a class="button button-dark" href="#/shop">Browse the shop</a></div>';
      return;
    }
    const net = netSubtotal();
    const remaining = round2(Math.max(0, SITE.freeShippingOver - net));
    const pct = Math.min(100, (net / SITE.freeShippingOver) * 100);
    const promo = cart.promo
      ? `<div class="promo-applied"><span>${SITE.promo.code} &middot; ${SITE.promo.percent}% off</span><button type="button" data-promo-remove>Remove</button></div>`
      : '<form class="promo-form" data-promo-form><label class="sr-only" for="promo-code">Promo code</label><input id="promo-code" name="code" placeholder="Promo code" autocomplete="off" /><button type="submit">Apply</button></form><p class="promo-msg" role="status"></p>';
    const disc = discount();
    bagBody.innerHTML = `
      <div class="ship-progress"><p>${remaining > 0 ? `Add <b>${money(remaining)}</b> more for free shipping` : 'You&rsquo;ve unlocked free shipping'}</p><div class="bar" role="progressbar" aria-label="Progress to free shipping" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><span style="width:${pct}%"></span></div></div>
      <ul class="bag-items">${lines.map(bagRow).join('')}</ul>
      <div class="bag-summary">
        ${promo}
        <div class="sum-row"><span>Subtotal</span><span>${money(subtotal())}</span></div>
        ${disc ? `<div class="sum-row"><span>Discount</span><span>&minus;${money(disc)}</span></div>` : ''}
        <p class="bag-note">Shipping and taxes are shown at checkout.</p>
        <a class="button button-dark button-block" href="#/checkout">Checkout &middot; ${money(net)}</a>
      </div>`;
  };

  const focusAfterBagChange = (key, kind, index) => {
    if (cart.lines.has(key)) {
      $(`[data-${kind}="${key}"]`, bagBody)?.focus();
      return;
    }
    const remaining = $$('.bag-row [data-remove]', bagBody);
    (remaining[Math.min(index, remaining.length - 1)] || bagClose).focus();
  };

  bagBody.addEventListener('click', (event) => {
    if (event.target.closest('a[href^="#"]')) {
      closePanels({ restore: false });
      return;
    }
    if (event.target.closest('[data-promo-remove]')) {
      cart.promo = false;
      commitCart();
      return;
    }
    const button = event.target.closest('[data-remove],[data-inc],[data-dec]');
    if (!button || button.disabled) return;
    const kind = button.hasAttribute('data-remove') ? 'remove' : button.hasAttribute('data-inc') ? 'inc' : 'dec';
    const key = button.dataset[kind];
    if (!cart.lines.has(key)) return;
    const index = $$('.bag-row', bagBody).indexOf(button.closest('.bag-row'));
    const qty = cart.lines.get(key);
    if (kind === 'inc') cart.lines.set(key, Math.min(qty + 1, MAX_QTY));
    else if (kind === 'dec' && qty > 1) cart.lines.set(key, qty - 1);
    else cart.lines.delete(key);
    commitCart();
    focusAfterBagChange(key, kind, index);
  });

  bagBody.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-promo-form]');
    if (!form) return;
    event.preventDefault();
    const code = new FormData(form).get('code').toString().trim().toUpperCase();
    if (code === SITE.promo.code) {
      cart.promo = true;
      commitCart();
      showToast(`Code applied · ${SITE.promo.percent}% off`);
    } else {
      $('.promo-msg', bagBody).textContent = code ? 'That code isn’t valid.' : 'Enter a promo code.';
      $('#promo-code', bagBody).focus();
    }
  });

  bagBtn.addEventListener('click', openBag);
  bagClose.addEventListener('click', () => closePanels());
  scrim.addEventListener('click', () => closePanels());

  /* ---------- Search panel with live suggestions ---------- */
  const matches = (q) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return PRODUCTS.filter((p) => `${p.name} ${p.short} ${SITE.categories[p.cat].label} ${p.desc}`.toLowerCase().includes(needle));
  };

  searchInput.addEventListener('input', () => {
    const q = searchInput.value;
    const found = matches(q).slice(0, 5);
    if (!q.trim()) {
      searchResults.innerHTML = '';
    } else if (!found.length) {
      searchResults.innerHTML = '<li class="none">No matches yet. Try &ldquo;car&rdquo; or &ldquo;lamp&rdquo;.</li>';
    } else {
      searchResults.innerHTML = found.map((p) => `<li><a href="#/product/${p.id}"><span class="sr-thumb">${picture(p)}</span><span class="sr-name">${esc(p.name)}<small>${esc(p.short)}</small></span><b>${money(p.price)}</b></a></li>`).join('');
    }
  });
  searchResults.addEventListener('click', (event) => {
    if (event.target.closest('a')) closePanels({ restore: false });
  });
  searchBtn.addEventListener('click', () => openPanelFor(search, searchBtn, () => searchInput));
  $('.search-close').addEventListener('click', () => closePanels());

  /* ---------- Mobile nav ---------- */
  const setNav = (open) => {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  };
  menuBtn.addEventListener('click', () => setNav(!nav.classList.contains('open')));

  /* ---------- Reusable view fragments ---------- */
  const ratingLine = (p) => `<p class="rating" aria-label="Rated ${p.rating} out of 5 from ${p.reviews} sample reviews"><span aria-hidden="true">&#9733; ${p.rating} <span class="count">(${p.reviews})</span></span></p>`;
  const priceHtml = (p) => `${p.compare ? `<s>${money(p.compare)}</s> ` : ''}${money(p.price)}`;

  const card = (p) => `<article class="product-card" data-id="${p.id}">
    <div class="product-image">${p.badge ? `<span class="badge">${p.badge}</span>` : ''}
      <a class="card-link" href="#/product/${p.id}" aria-label="View ${esc(p.name)}" tabindex="-1">${picture(p)}</a>
      <button class="quick-add" type="button" aria-label="Add ${esc(p.name)} to bag" data-add>&#65291;</button></div>
    <div class="product-info"><div><h3><a href="#/product/${p.id}">${esc(p.name)}</a></h3><p>${esc(p.short)}</p>${ratingLine(p)}</div><span class="price">${priceHtml(p)}</span></div>
  </article>`;

  const crumbs = (...items) => `<nav class="breadcrumb" aria-label="Breadcrumb">${items.map((it, i) => (it.href && i < items.length - 1 ? `<a href="${it.href}">${esc(it.label)}</a>` : `<span aria-current="page">${esc(it.label)}</span>`)).join('<span aria-hidden="true">/</span>')}</nav>`;

  const sampleBadge = '<span class="sample-tag">Sample content</span>';

  /* ---------- Views ---------- */
  const HERO_SVG = `<svg class="hero-vacuum" viewBox="0 0 520 440" role="img" aria-label="A cordless handheld vacuum in warm ivory">
    <defs>
      <linearGradient id="hv-body" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#f7f4ee"/><stop offset=".55" stop-color="#d9d2c5"/><stop offset="1" stop-color="#b3ab9d"/></linearGradient>
      <linearGradient id="hv-grip" x1="0" x2="1"><stop stop-color="#d7d0c4"/><stop offset="1" stop-color="#a09888"/></linearGradient>
      <linearGradient id="hv-nozzle" x1="0" x2="1"><stop stop-color="#3a3c37"/><stop offset=".6" stop-color="#191b18"/><stop offset="1" stop-color="#5d5f58"/></linearGradient>
      <filter id="hv-soft" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="14"/></filter>
    </defs>
    <ellipse cx="262" cy="372" rx="170" ry="20" fill="#3d382f" opacity=".3" filter="url(#hv-soft)"/>
    <ellipse cx="262" cy="368" rx="96" ry="8" fill="#2b2822" opacity=".35" filter="url(#hv-soft)"/>
    <g transform="rotate(-11 260 230)">
      <path d="M146 175 Q146 139 181 135 L341 135 Q371 135 375 165 L379 207 L144 207Z" fill="url(#hv-nozzle)"/>
      <path d="M152 169 Q157 150 181 150 L347 150 Q363 150 366 168 L368 182 L150 182Z" fill="#6b6d65"/>
      <path d="M147 207 L376 207 L370 233 L148 233Z" fill="#252723"/>
      <rect x="176" y="195" width="144" height="66" rx="28" fill="#686c63" opacity=".75"/>
      <path d="M174 215 C174 184 199 161 231 161 L302 161 C330 161 347 180 347 208 L347 259 C347 283 331 297 307 297 L213 297 C188 297 174 281 174 256Z" fill="url(#hv-body)"/>
      <path d="M183 209 C183 187 201 174 224 174 L300 174 C320 174 337 190 337 213 L337 255 C337 274 325 285 304 285 L216 285 C195 285 183 271 183 252Z" fill="url(#hv-body)"/>
      <path d="M226 286 L298 286 L310 355 Q312 374 292 376 L235 376 Q217 374 221 355Z" fill="url(#hv-grip)"/>
      <path d="M241 300 L283 300 L291 349 Q293 360 281 362 L245 362 Q234 361 236 350Z" fill="#b6afa3"/>
      <circle cx="260" cy="209" r="5" fill="#343630"/><circle cx="277" cy="209" r="5" fill="#343630"/>
      <path d="M218 252 Q259 268 303 251" fill="none" stroke="#c1bbaf" stroke-width="2" opacity=".8"/>
      <path d="M203 190 Q232 175 266 178" fill="none" stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round"/>
      <rect x="354" y="172" width="35" height="24" rx="10" fill="#2a2c28"/>
      <path d="M388 177 L429 180 L430 190 L388 192Z" fill="#1b1d1a"/>
      <path d="M427 178 L447 179 L446 192 L429 192Z" fill="#6c6d65"/>
    </g></svg>`;

  const homeView = () => {
    const bestsellers = [...PRODUCTS].sort((a, b) => b.reviews - a.reviews).slice(0, 4);
    const fresh = ['mist', 'desk', 'air', 'speaker'].map((id) => BY_ID.get(id));
    const count = (cat) => PRODUCTS.filter((p) => p.cat === cat).length;
    const quotes = [0, 2, 4].map((i) => ({ r: REVIEWS[i], p: PRODUCTS[[0, 3, 6][i / 2]] }));
    return {
      title: 'Needverse — Everyday, considered.',
      html: `
      <section class="hero" aria-labelledby="hero-heading">
        <div class="hero-copy">
          <p class="eyebrow">Thoughtfully picked for real life</p>
          <h1 id="hero-heading">A little ease<br />for <em>every day.</em></h1>
          <p class="hero-description">Useful little upgrades for the rooms, rides, and routines you live with.</p>
          <div class="hero-actions"><a class="button button-dark" href="#/shop">Shop the edit <span aria-hidden="true">&#8599;</span></a><a class="text-link" href="#/shop/auto">Car care <span aria-hidden="true">&#8599;</span></a></div>
        </div>
        <a class="hero-art" href="#/product/slate" aria-label="View The clean slate, cordless car vacuum">${HERO_SVG}</a>
      </section>

      <section class="trust" aria-label="Why shop with us"><div class="trust-grid">
        <div>${icon('truck')}<h2>Free shipping</h2><p>On orders over ${money(SITE.freeShippingOver)}</p></div>
        <div>${icon('back')}<h2>30-day returns</h2><p>Changed your mind? Send it back</p></div>
        <div>${icon('shield')}<h2>12-month warranty</h2><p>On every electrical item</p></div>
        <div>${icon('chat')}<h2>Real human support</h2><p>Replies within a business day</p></div>
      </div></section>

      <section class="section-wrap block">
        <div class="section-heading"><div><p class="eyebrow">Bestsellers</p><h2>Useful finds, <em>chosen with care.</em></h2></div><a class="text-link" href="#/shop">Shop everything <span aria-hidden="true">&#8599;</span></a></div>
        <div class="product-grid">${bestsellers.map(card).join('')}</div>
        <p class="demo-note">Products, prices and ratings shown are placeholders.</p>
      </section>

      <section class="category-section"><div class="section-wrap">
        <div class="section-heading category-heading"><div><p class="eyebrow">Shop by category</p><h2>Everyday, made <em>easier.</em></h2></div><p class="section-aside">Thoughtful little finds for the spaces and routines you call your own.</p></div>
        <div class="category-grid">
          ${['home', 'auto'].map((cat, i) => `<a class="category-card category-${cat}" href="#/shop/${cat}"><span class="category-label">0${i + 1} &mdash; ${plural(count(cat), 'product')}</span><div class="category-text"><h3>${SITE.categories[cat].title}<span aria-hidden="true">&#8599;</span></h3><p>${SITE.categories[cat].blurb}</p></div></a>`).join('')}
        </div>
      </div></section>

      <section class="section-wrap block">
        <div class="section-heading"><div><p class="eyebrow">New in</p><h2>Fresh <em>arrivals.</em></h2></div><a class="text-link" href="#/shop">See what&rsquo;s new <span aria-hidden="true">&#8599;</span></a></div>
        <div class="product-grid">${fresh.map(card).join('')}</div>
      </section>

      <section class="manifesto"><p class="eyebrow">About Needverse</p><h2>Everyday objects,<br /><em>a little more considered.</em></h2><p class="manifesto-copy">Useful things earn their place in our homes and our routines. Needverse brings home comforts, car care, and everyday essentials together in one thoughtful edit.</p><a href="#/page/about" class="text-link">Our story <span aria-hidden="true">&#8599;</span></a></section>

      <section class="section-wrap block reviews-home">
        <div class="section-heading"><div><p class="eyebrow">Kind words ${sampleBadge}</p><h2>Loved by <em>everyday people.</em></h2></div></div>
        <div class="review-grid">${quotes.map(({ r, p }) => `<figure class="review"><p class="stars" aria-label="5 out of 5">&#9733;&#9733;&#9733;&#9733;&#9733;</p><blockquote>&ldquo;${esc(r.body)}&rdquo;</blockquote><figcaption>${esc(r.name)} <span>on <a href="#/product/${p.id}">${esc(p.name)}</a></span></figcaption></figure>`).join('')}</div>
      </section>`
    };
  };

  const SORTS = {
    featured: ['Featured', null],
    bestselling: ['Best selling', (a, b) => b.reviews - a.reviews],
    'price-asc': ['Price: low to high', (a, b) => a.price - b.price],
    'price-desc': ['Price: high to low', (a, b) => b.price - a.price],
    rating: ['Top rated', (a, b) => b.rating - a.rating]
  };

  const shopView = (catParam, params) => {
    const state = {
      cat: catParam || (SITE.categories[params.get('cat')] ? params.get('cat') : 'all'),
      sort: SORTS[params.get('sort')] ? params.get('sort') : 'featured',
      q: (params.get('q') || '').slice(0, 80)
    };
    const chips = [['all', 'All'], ...Object.entries(SITE.categories).map(([k, v]) => [k, v.label])];
    return {
      title: 'Shop',
      html: `<section class="section-wrap shop">
        ${crumbs({ label: 'Home', href: '#/' }, { label: 'Shop' })}
        <div class="shop-head"><p class="eyebrow">The Needverse edit</p><h1 id="shop-title"></h1><p class="shop-blurb"></p></div>
        <div class="shop-toolbar">
          <div class="filter-bar" role="group" aria-label="Filter products">${chips.map(([k, label]) => `<button class="chip" type="button" data-cat="${k}" aria-pressed="false">${label}</button>`).join('')}</div>
          <label class="sort"><span>Sort by</span><select id="sort">${Object.entries(SORTS).map(([k, [label]]) => `<option value="${k}">${label}</option>`).join('')}</select></label>
        </div>
        <p class="result-status" role="status" aria-live="polite"><span class="result-text"></span><button class="text-link" type="button" data-clear hidden>Clear search</button></p>
        <div class="product-grid" id="product-grid"></div>
        <div class="no-results" hidden><p class="no-results-text">Nothing matches that just yet.</p><a class="text-link" href="#/shop">Show everything <span aria-hidden="true">&#8599;</span></a></div>
        <p class="demo-note">Products, prices and ratings shown are placeholders.</p>
      </section>`,
      after: () => {
        const grid = $('#product-grid');
        const paint = () => {
          const q = state.q.trim().toLowerCase();
          let list = PRODUCTS.filter((p) => (state.cat === 'all' || p.cat === state.cat) && (!q || matches(q).includes(p)));
          const sorter = SORTS[state.sort][1];
          if (sorter) list = [...list].sort(sorter);
          const catInfo = SITE.categories[state.cat];
          $('#shop-title').textContent = catInfo ? catInfo.title : 'Shop all';
          $('.shop-blurb').textContent = catInfo ? catInfo.blurb : 'Everything in the edit: home comforts and car care, chosen with care.';
          document.title = `${catInfo ? catInfo.label : 'Shop'} — Needverse`;
          grid.innerHTML = list.map(card).join('');
          $('.result-text').textContent = state.q.trim() ? `${plural(list.length, 'product')} for “${state.q.trim()}”` : plural(list.length, 'product');
          $('[data-clear]').hidden = !state.q.trim();
          $('.no-results').hidden = list.length > 0;
          $$('.chip').forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.cat === state.cat)));
          $('#sort').value = state.sort;
          const query = new URLSearchParams();
          if (state.sort !== 'featured') query.set('sort', state.sort);
          if (state.q.trim()) query.set('q', state.q.trim());
          const qs = query.toString();
          try { history.replaceState(null, '', `#/shop${state.cat === 'all' ? '' : `/${state.cat}`}${qs ? `?${qs}` : ''}`); } catch { /* restricted history */ }
        };
        $$('.chip').forEach((chip) => chip.addEventListener('click', () => { state.cat = chip.dataset.cat; paint(); }));
        $('#sort').addEventListener('change', (event) => { state.sort = event.target.value; paint(); });
        $('[data-clear]').addEventListener('click', () => { state.q = ''; paint(); });
        paint();
      }
    };
  };

  const productView = (id) => {
    const p = BY_ID.get(id);
    if (!p) return notFoundView();
    const state = { color: p.colors[0], qty: 1 };
    const cat = SITE.categories[p.cat];
    const idx = PRODUCTS.indexOf(p);
    const sample = [0, 1, 2].map((k) => ({ ...REVIEWS[(idx + k) % REVIEWS.length], stars: k === 1 ? 4 : 5 }));
    const related = PRODUCTS.filter((o) => o.cat === p.cat && o !== p).slice(0, 4);
    return {
      title: p.name,
      html: `<section class="section-wrap pdp">
        ${crumbs({ label: 'Home', href: '#/' }, { label: 'Shop', href: '#/shop' }, { label: cat.label, href: `#/shop/${p.cat}` }, { label: p.name })}
        <div class="pdp-grid">
          <div class="pdp-gallery"><div class="pdp-art" id="pdp-art">${picture(p)}</div>${p.badge ? `<span class="badge">${p.badge}</span>` : ''}</div>
          <div class="pdp-info">
            <p class="eyebrow">${cat.label}</p>
            <h1>${esc(p.name)}</h1>
            <p class="pdp-sub">${esc(p.short)}</p>
            ${ratingLine(p)}
            <p class="pdp-price">${priceHtml(p)}${p.compare ? ` <span class="save">Save ${money(p.compare - p.price)}</span>` : ''}</p>
            <p class="pdp-desc">${esc(p.desc)}</p>
            <fieldset class="swatches"><legend>Colour: <b id="color-label">${PAL[state.color].label}</b></legend>
              ${p.colors.map((c) => `<button class="swatch" type="button" data-color="${c}" aria-pressed="${c === state.color}" aria-label="${PAL[c].label}" style="--sw:${PAL[c].body}"><span></span></button>`).join('')}
            </fieldset>
            <div class="pdp-buy">
              <div class="qty qty-lg" role="group" aria-label="Quantity"><button type="button" data-q="-1" aria-label="Decrease quantity">&minus;</button><output id="pdp-qty">1</output><button type="button" data-q="1" aria-label="Increase quantity">+</button></div>
              <button class="button button-dark" id="pdp-add" type="button"></button>
            </div>
            <button class="button button-light button-block" id="pdp-buy" type="button">Buy it now</button>
            <ul class="pdp-perks"><li>${icon('truck')}Free standard shipping over ${money(SITE.freeShippingOver)}</li><li>${icon('back')}30-day returns</li><li>${icon('shield')}12-month warranty</li></ul>
            <div class="accordion">
              <details open><summary>Features</summary><ul>${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></details>
              <details><summary>Specifications</summary><table class="specs">${p.specs.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table><p class="fine">Illustrative specifications for the concept preview.</p></details>
              <details><summary>In the box</summary><ul>${p.box.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></details>
              <details><summary>Shipping &amp; returns</summary><p>Standard delivery in 5&ndash;12 business days, express in 2&ndash;5. Returns accepted within 30 days. <a href="#/page/shipping">Shipping details</a> &middot; <a href="#/page/returns">Returns</a></p></details>
            </div>
          </div>
        </div>
        <section class="reviews" aria-labelledby="reviews-h"><div class="reviews-head"><h2 id="reviews-h">Customer reviews</h2>${sampleBadge}</div>
          <div class="review-grid">${sample.map((r) => `<figure class="review"><p class="stars" aria-label="${r.stars} out of 5">${'&#9733;'.repeat(r.stars)}${'&#9734;'.repeat(5 - r.stars)}</p><h3>${esc(r.title)}</h3><blockquote>${esc(r.body)}</blockquote><figcaption>${esc(r.name)} &middot; Verified buyer (sample)</figcaption></figure>`).join('')}</div>
        </section>
        <section class="related"><div class="section-heading"><div><p class="eyebrow">You may also like</p><h2>More from ${cat.label.toLowerCase()}</h2></div><a class="text-link" href="#/shop/${p.cat}">View all <span aria-hidden="true">&#8599;</span></a></div>
          <div class="product-grid">${related.map(card).join('')}</div></section>
      </section>`,
      after: () => {
        const label = () => { $('#pdp-add').textContent = `Add to bag — ${money(p.price * state.qty)}`; $('#pdp-qty').textContent = state.qty; };
        $$('.swatch').forEach((sw) => sw.addEventListener('click', () => {
          state.color = sw.dataset.color;
          $('#pdp-art').innerHTML = picture(p, state.color);
          $('#color-label').textContent = PAL[state.color].label;
          $$('.swatch').forEach((o) => o.setAttribute('aria-pressed', String(o === sw)));
        }));
        $$('[data-q]').forEach((b) => b.addEventListener('click', () => {
          state.qty = Math.max(1, Math.min(MAX_QTY, state.qty + Number(b.dataset.q)));
          label();
        }));
        $('#pdp-add').addEventListener('click', () => { addToCart(p.id, state.color, state.qty); openBag(); });
        $('#pdp-buy').addEventListener('click', () => { addToCart(p.id, state.color, state.qty); location.hash = '#/checkout'; });
        label();
      }
    };
  };

  /* Checkout (front-end demo: collects delivery details only, takes no payment) */
  const field = (name, label, { type = 'text', required = true, autocomplete = name, span = false } = {}) =>
    `<div class="field${span ? ' half' : ''}"><label for="f-${name}">${label}${required ? '' : ' <span>(optional)</span>'}</label><input id="f-${name}" name="${name}" type="${type}" autocomplete="${autocomplete}"${required ? ' required' : ''} /></div>`;

  const summaryTotals = (method) => {
    const t = totals(method);
    return `<div class="sum-row"><span>Subtotal</span><span>${money(t.sub)}</span></div>
      ${t.disc ? `<div class="sum-row"><span>Discount (${SITE.promo.code})</span><span>&minus;${money(t.disc)}</span></div>` : ''}
      <div class="sum-row"><span>Shipping</span><span>${t.ship ? money(t.ship) : 'Free'}</span></div>
      <div class="sum-row total"><span>Total</span><b>${money(t.total)}</b></div>
      <p class="fine">Taxes are calculated once checkout is connected.</p>`;
  };

  const checkoutView = () => {
    if (!cart.lines.size) {
      return { title: 'Checkout', html: '<section class="section-wrap page"><h1>Your bag is empty</h1><p class="lead">Add something to your bag to check out.</p><a class="button button-dark" href="#/shop">Browse the shop</a></section>' };
    }
    const lines = lineItems();
    return {
      title: 'Checkout',
      html: `<section class="section-wrap checkout">
        ${crumbs({ label: 'Home', href: '#/' }, { label: 'Checkout' })}
        <h1>Checkout</h1>
        <div class="checkout-grid">
          <form id="checkout-form" class="checkout-form">
            <fieldset><legend>Contact</legend>${field('email', 'Email', { type: 'email' })}</fieldset>
            <fieldset><legend>Delivery</legend>
              <div class="field-row">${field('given-name', 'First name', { span: true })}${field('family-name', 'Last name', { span: true })}</div>
              ${field('address-line1', 'Address')}
              ${field('address-line2', 'Apartment, suite, etc.', { required: false })}
              <div class="field-row">${field('address-level2', 'City', { span: true })}${field('postal-code', 'Postcode', { span: true })}</div>
              <div class="field-row">${field('address-level1', 'State / region', { span: true })}
                <div class="field half"><label for="f-country">Country</label><select id="f-country" name="country" autocomplete="country-name" required><option>United States</option><option>Canada</option><option>United Kingdom</option><option>Ireland</option><option>Germany</option><option>France</option><option>Netherlands</option></select></div></div>
              ${field('tel', 'Phone', { type: 'tel', required: false })}
            </fieldset>
            <fieldset class="ship-options"><legend>Shipping method</legend>
              <label class="ship-option"><input type="radio" name="ship" value="standard" checked /><span><b>Standard</b><small>5&ndash;12 business days</small></span><span class="ship-price" data-ship-price="standard"></span></label>
              <label class="ship-option"><input type="radio" name="ship" value="express" /><span><b>Express</b><small>2&ndash;5 business days</small></span><span class="ship-price">${money(SITE.shipping.express)}</span></label>
            </fieldset>
            <fieldset><legend>Payment</legend><p class="notice">Payments aren&rsquo;t connected in this preview, so no card details are collected and nothing is charged. Placing a demo order only shows the confirmation page.</p></fieldset>
            <button class="button button-dark button-block" type="submit">Place demo order</button>
          </form>
          <aside class="summary" aria-label="Order summary"><h2>Order summary</h2>
            <ul class="summary-lines">${lines.map((l) => `<li><span class="bag-thumb">${picture(l.p, l.color)}<i>${l.qty}</i></span><span class="sl-name">${esc(l.p.name)}<small>${PAL[l.color].label}</small></span><span>${money(l.p.price * l.qty)}</span></li>`).join('')}</ul>
            <div class="summary-totals"></div>
          </aside>
        </div>
      </section>`,
      after: () => {
        const form = $('#checkout-form');
        const method = () => new FormData(form).get('ship');
        const paint = () => {
          $('.summary-totals').innerHTML = summaryTotals(method());
          $('[data-ship-price="standard"]').textContent = shippingCost('standard') ? money(shippingCost('standard')) : 'Free';
        };
        form.addEventListener('change', paint);
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          const data = Object.fromEntries(new FormData(form));
          const order = {
            no: `NV-${Math.floor(100000 + Math.random() * 900000)}`,
            email: data.email,
            name: `${data['given-name']} ${data['family-name']}`,
            address: [data['address-line1'], data['address-line2'], data['address-level2'], data['address-level1'], data['postal-code'], data.country].filter(Boolean).join(', '),
            method: data.ship,
            lines: lineItems().map((l) => ({ id: l.id, color: l.color, qty: l.qty })),
            totals: totals(data.ship)
          };
          try { sessionStorage.setItem(ORDER_KEY, JSON.stringify(order)); } catch { /* session storage unavailable */ }
          lastOrder = order;
          cartListeners.delete(paint); // keep the summary as-is while we navigate away
          cart.lines.clear();
          cart.promo = false;
          commitCart();
          location.hash = '#/order';
        });
        cartListeners.add(paint);
        paint();
      }
    };
  };

  let lastOrder = null;
  const orderView = () => {
    let order = lastOrder;
    try { order = order || JSON.parse(sessionStorage.getItem(ORDER_KEY) || 'null'); } catch { /* ignore */ }
    if (!order) return { title: 'Order', redirect: '#/shop' };
    const lines = order.lines.filter((l) => BY_ID.has(l.id));
    return {
      title: 'Order confirmed',
      html: `<section class="section-wrap page order">
        <p class="eyebrow">Demo order</p>
        <h1>Thank you, ${esc(order.name.split(' ')[0] || 'friend')}.</h1>
        <p class="lead">Your demo order <b>${esc(order.no)}</b> is confirmed. In the live store, a confirmation would be sent to ${esc(order.email)}.</p>
        <p class="notice">This was a concept preview: no payment was taken and nothing will ship.</p>
        <div class="order-grid">
          <div><h2>Delivering to</h2><p>${esc(order.name)}<br />${esc(order.address)}</p><p>${order.method === 'express' ? 'Express (2&ndash;5 business days)' : 'Standard (5&ndash;12 business days)'}</p></div>
          <div><h2>Items</h2><ul class="order-lines">${lines.map((l) => { const p = BY_ID.get(l.id); return `<li><span>${esc(p.name)} <small>${PAL[l.color].label} &times; ${l.qty}</small></span><span>${money(p.price * l.qty)}</span></li>`; }).join('')}</ul>
            <div class="sum-row total"><span>Total</span><b>${money(order.totals.total)}</b></div></div>
        </div>
        <a class="button button-dark" href="#/shop">Continue shopping</a>
      </section>`
    };
  };

  const contactHtml = `<p class="lead">Questions about an order, a product or a return? We reply within one business day.</p>
    <div class="contact-grid">
      <form id="contact-form" class="checkout-form">
        <div class="field"><label for="c-name">Name</label><input id="c-name" name="name" autocomplete="name" required /></div>
        <div class="field"><label for="c-email">Email</label><input id="c-email" name="email" type="email" autocomplete="email" required /></div>
        <div class="field"><label for="c-msg">How can we help?</label><textarea id="c-msg" name="message" rows="5" required></textarea></div>
        <button class="button button-dark" type="submit">Send message</button>
        <p class="fine">Contact form is for preview only. Messages aren&rsquo;t sent.</p>
      </form>
      <div class="contact-side"><h2>Email</h2><p><a class="text-link" href="mailto:hello@needverse.example">hello@needverse.example</a></p><h2>Hours</h2><p>Monday&ndash;Friday, 9am&ndash;5pm</p><h2>Looking for something else?</h2><p><a href="#/page/shipping">Shipping</a> &middot; <a href="#/page/returns">Returns</a> &middot; <a href="#/page/faq">FAQ</a></p></div>
    </div>`;

  const pageView = (slug) => {
    const page = PAGES[slug];
    if (!page) return notFoundView();
    return {
      title: page.title,
      html: `<section class="section-wrap page">${crumbs({ label: 'Home', href: '#/' }, { label: page.title })}<h1>${esc(page.title)}</h1><div class="prose">${slug === 'contact' ? contactHtml : page.html}</div></section>`,
      after: slug === 'contact' ? () => {
        $('#contact-form').addEventListener('submit', (event) => {
          event.preventDefault();
          event.currentTarget.reset();
          showToast('Thanks · the contact form is a preview');
        });
      } : null
    };
  };

  function notFoundView() {
    return { title: 'Page not found', html: '<section class="section-wrap page"><p class="eyebrow">404</p><h1>Nothing here <em>just yet.</em></h1><p class="lead">That page wandered off. The rest of the edit is right where you left it.</p><a class="button button-dark" href="#/">Back to Needverse</a></section>' };
  }

  /* ---------- Router ---------- */
  const ROUTES = [
    [/^\/?$/, 'home', () => homeView()],
    [/^\/shop(?:\/(home|auto))?$/, 'shop', (m, params) => shopView(m[1], params)],
    [/^\/product\/([a-z0-9-]+)$/, 'product', (m) => productView(m[1])],
    [/^\/checkout$/, 'checkout', () => checkoutView()],
    [/^\/order$/, 'order', () => orderView()],
    [/^\/page\/([a-z-]+)$/, 'page', (m) => pageView(m[1])]
  ];

  let firstRender = true;
  const render = () => {
    const raw = location.hash.startsWith('#/') ? location.hash.slice(1) : '/';
    const [path, query = ''] = raw.split('?');
    const params = new URLSearchParams(query);
    let name = 'notfound';
    let view = null;
    for (const [re, routeName, build] of ROUTES) {
      const m = path.match(re);
      if (m) { name = routeName; view = build(m, params); break; }
    }
    if (!view) view = notFoundView();
    if (view.redirect) { location.replace(view.redirect); return; }

    cartListeners.clear();
    closePanels({ restore: false });
    setNav(false);
    document.body.dataset.view = name;
    document.title = view.title.includes('Needverse') ? view.title : `${view.title} — Needverse`;
    main.innerHTML = view.html;
    if (view.after) view.after();
    $$('.main-nav a').forEach((a) => (a.getAttribute('href') === `#${path}` ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    if (!firstRender) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      main.focus({ preventScroll: true });
    }
    firstRender = false;
  };
  window.addEventListener('hashchange', render);

  /* ---------- Global interactions ---------- */
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])';

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closePanels();
      setNav(false);
      return;
    }
    if (event.key === 'Enter' && document.activeElement === searchInput && searchInput.value.trim()) {
      const q = searchInput.value.trim();
      closePanels({ restore: false });
      searchInput.value = '';
      searchResults.innerHTML = '';
      location.hash = `#/shop?q=${encodeURIComponent(q)}`;
      return;
    }
    if (event.key === 'Tab' && openPanel) {
      const focusable = $$(FOCUSABLE, openPanel).filter((node) => node.getClientRects().length);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (!openPanel.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  const flashAdded = (button) => {
    button.dataset.label ??= button.textContent;
    button.textContent = '✓';
    button.classList.add('added');
    clearTimeout(button._timer);
    button._timer = setTimeout(() => {
      button.textContent = button.dataset.label;
      button.classList.remove('added');
    }, 1400);
    bagCount.classList.remove('bump');
    void bagCount.offsetWidth; // restart the animation
    bagCount.classList.add('bump');
  };

  document.addEventListener('click', (event) => {
    if (nav.classList.contains('open') && !event.target.closest('.main-nav, .menu-toggle')) setNav(false);
    const add = event.target.closest('[data-add]');
    if (add) {
      const p = BY_ID.get(add.closest('[data-id]').dataset.id);
      addToCart(p.id, p.colors[0], 1);
      flashAdded(add);
      showToast(`${p.name} added · concept preview`);
    }
  });

  $('#newsletter-form').addEventListener('submit', (event) => {
    event.preventDefault();
    event.currentTarget.reset();
    showToast('Thanks for stopping by · sign-up is a preview');
  });

  /* ---------- Init ---------- */
  loadCart();
  commitCart();
  render();
})();
