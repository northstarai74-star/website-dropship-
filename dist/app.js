(() => {
  'use strict';

  /* ---------- Data ---------- */
  const PRODUCTS = {
    relaxer: { name: 'The little relaxer', price: 48 },
    slate: { name: 'The clean slate', price: 64 },
    landing: { name: 'The soft landing', price: 72 },
    rinse: { name: 'The rinse cycle', price: 89 }
  };
  const CATEGORY_LABELS = {
    home: 'home around the house comforts',
    auto: 'auto car care out on the road'
  };
  const CATEGORY_NAMES = { home: 'Home', auto: 'Car care' };
  const STORAGE_KEY = 'needverse-bag-v1';
  const MAX_QTY = 99;
  const HEADINGS = {
    '': ['Meet your new ', 'favourites.'],
    home: ['Little comforts for ', 'home.'],
    auto: ['Good things for ', 'the road.']
  };
  const DEMO_NOTES = {
    '': 'A first look at the collection. Products and prices shown are placeholders.',
    home: 'Showing illustrative home placeholders · prices are examples.',
    auto: 'Showing illustrative auto placeholders · prices are examples.'
  };
  const money = (n) => '$' + n.toLocaleString('en-US');

  /* ---------- Elements ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
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
  const scrim = $('.scrim');
  const cards = $$('.product-card');
  const chips = $$('.chip');
  const noResults = $('.no-results');
  const noResultsText = $('.no-results-text');
  const demoNote = $('.demo-note');
  const resultText = $('.result-text');
  const clearBtn = $('[data-clear]');
  const featuredHeading = $('.featured .section-heading h2');

  const el = (tag, props = {}, ...kids) => {
    const node = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else node.setAttribute(k, v);
    });
    kids.forEach((kid) => node.append(kid));
    return node;
  };

  /* ---------- Toast ---------- */
  let toastTimer;
  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  };

  /* ---------- Products: sync from data, build search text ---------- */
  cards.forEach((card) => {
    const product = PRODUCTS[card.dataset.id];
    card.querySelector('h3').textContent = product.name;
    card.querySelector('.price').textContent = money(product.price);
    card.querySelector('[data-add]').setAttribute('aria-label', `Add ${product.name} to bag`);
    card._haystack = [
      product.name,
      card.querySelector('.product-info p').textContent,
      CATEGORY_LABELS[card.dataset.category] || card.dataset.category
    ].join(' ').toLowerCase();
  });

  /* ---------- Filtering: one state, one renderer ---------- */
  const state = { q: '', cat: '' };

  // Restore a shared/bookmarked view from ?cat=home&q=vacuum
  const params = new URLSearchParams(location.search);
  if (Object.hasOwn(CATEGORY_LABELS, params.get('cat'))) state.cat = params.get('cat');
  state.q = (params.get('q') || '').slice(0, 80);
  searchInput.value = state.q;

  let urlTimer;
  const syncUrl = () => {
    clearTimeout(urlTimer);
    urlTimer = setTimeout(() => {
      try {
        const next = new URLSearchParams();
        if (state.cat) next.set('cat', state.cat);
        if (state.q.trim()) next.set('q', state.q.trim());
        const qs = next.toString();
        history.replaceState(null, '', location.pathname + (qs ? `?${qs}` : '') + location.hash);
      } catch { /* history may be restricted (sandboxed frames) */ }
    }, 250);
  };

  const applyFilters = () => {
    const q = state.q.trim().toLowerCase();
    let shown = 0;
    cards.forEach((card) => {
      const ok = (!state.cat || card.dataset.category === state.cat) && (!q || card._haystack.includes(q));
      card.hidden = !ok;
      if (ok) shown++;
    });

    const [lead, accent] = HEADINGS[state.cat];
    featuredHeading.textContent = lead;
    featuredHeading.append(el('em', { text: accent }));

    demoNote.textContent = DEMO_NOTES[state.cat];

    // Live-region summary so filtering is announced, plus a way out of a search
    const count = `${shown} ${shown === 1 ? 'product' : 'products'}`;
    const scope = state.cat ? ` in ${CATEGORY_NAMES[state.cat]}` : '';
    resultText.textContent = q ? `${count}${scope} for “${state.q.trim()}”` : `${count}${scope}`;
    clearBtn.hidden = !q;

    noResults.hidden = shown > 0;
    if (!shown) noResultsText.textContent = q ? `Nothing matches “${state.q.trim()}” just yet.` : 'Nothing here just yet.';

    chips.forEach((chip) => {
      const active = chip.dataset.filter === (state.cat || 'all');
      chip.setAttribute('aria-pressed', String(active));
    });
    syncUrl();
  };

  // Category chips keep an active search; every other entry point starts fresh.
  const setFilter = (cat, { keepSearch = false } = {}) => {
    state.cat = cat === 'all' ? '' : cat;
    if (!keepSearch) {
      state.q = '';
      searchInput.value = '';
    }
    applyFilters();
  };

  clearBtn.addEventListener('click', () => {
    state.q = '';
    searchInput.value = '';
    applyFilters();
  });

  searchInput.addEventListener('input', (event) => {
    state.q = event.target.value;
    applyFilters();
  });

  /* ---------- Mobile nav ---------- */
  const setNav = (open) => {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  };
  menuBtn.addEventListener('click', () => setNav(!nav.classList.contains('open')));

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

  /* ---------- Bag (persisted in localStorage) ---------- */
  const items = new Map(); // id -> qty
  const totalCount = () => [...items.values()].reduce((sum, qty) => sum + qty, 0);

  const loadBag = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      Object.entries(saved).forEach(([id, qty]) => {
        if (Object.hasOwn(PRODUCTS, id) && Number.isInteger(qty) && qty > 0) items.set(id, Math.min(qty, MAX_QTY));
      });
    } catch { /* corrupted or unavailable storage: start with an empty bag */ }
  };
  const saveBag = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(items))); } catch { /* storage unavailable */ }
  };

  const updateCount = () => {
    const count = totalCount();
    bagCount.textContent = count;
    panelCount.textContent = `(${count})`;
    bagBtn.setAttribute('aria-label', `Shopping bag, ${count} ${count === 1 ? 'item' : 'items'}`);
  };

  const renderBag = () => {
    bagBody.replaceChildren();
    if (!items.size) {
      const heading = el('h3');
      heading.append('A little empty', el('br'), 'in here.');
      bagBody.append(
        heading,
        el('p', { text: 'Your good finds will live here.' }),
        el('a', { class: 'button button-dark', href: '#featured', text: 'Browse the edit' })
      );
      return;
    }
    let subtotal = 0;
    const list = el('div', { class: 'bag-items' });
    items.forEach((qty, id) => {
      const product = PRODUCTS[id];
      subtotal += product.price * qty;
      const stepper = el(
        'span', { class: 'qty', role: 'group', 'aria-label': `Quantity of ${product.name}` },
        el('button', { type: 'button', 'data-dec': id, 'aria-label': `Decrease quantity of ${product.name}`, text: '−' }),
        el('output', { text: String(qty) }),
        el('button', { type: 'button', 'data-inc': id, 'aria-label': `Increase quantity of ${product.name}`, text: '+', ...(qty >= MAX_QTY ? { disabled: '' } : {}) })
      );
      const name = el('span', { class: 'bag-name' }, product.name, el('small', { text: `${money(product.price)} each · example item` }), stepper);
      const remove = el('button', { type: 'button', 'data-remove': id, 'aria-label': `Remove ${product.name}`, text: 'Remove' });
      const side = el('span', { class: 'bag-side' }, el('span', { text: money(product.price * qty) }), remove);
      list.append(el('div', { class: 'bag-row' }, name, side));
    });
    bagBody.append(
      list,
      el('div', { class: 'bag-subtotal' }, el('span', { text: 'Example subtotal' }), el('b', { text: money(subtotal) })),
      el('p', { class: 'bag-demo-caption', text: 'Preview only. Prices are examples; checkout is not connected.' })
    );
  };

  const commitBag = () => {
    saveBag();
    updateCount();
    if (openPanel === bag) renderBag();
  };

  bagBody.addEventListener('click', (event) => {
    if (event.target.closest('a[href^="#"]')) {
      closePanels({ restore: false });
      return;
    }
    const button = event.target.closest('[data-remove],[data-inc],[data-dec]');
    if (!button || button.disabled) return;
    const id = button.dataset.remove || button.dataset.inc || button.dataset.dec;
    if (!Object.hasOwn(PRODUCTS, id)) return;
    const index = $$('.bag-row', bagBody).indexOf(button.closest('.bag-row'));
    const qty = items.get(id) || 0;

    if (button.dataset.inc) items.set(id, Math.min(qty + 1, MAX_QTY));
    else if (button.dataset.dec && qty > 1) items.set(id, qty - 1);
    else items.delete(id);
    commitBag();

    // Keep focus where the user was working
    if (items.has(id)) {
      $(`[${button.dataset.inc ? 'data-inc' : 'data-dec'}="${id}"]`, bagBody)?.focus();
    } else {
      const remaining = $$('.bag-row [data-remove]', bagBody);
      (remaining[Math.min(index, remaining.length - 1)] || bagClose).focus();
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

  $$('[data-add]').forEach((button) => button.addEventListener('click', () => {
    const id = button.closest('.product-card').dataset.id;
    items.set(id, Math.min((items.get(id) || 0) + 1, MAX_QTY));
    commitBag();
    flashAdded(button);
    showToast(`${PRODUCTS[id].name} added · concept preview`);
  }));

  bagBtn.addEventListener('click', () => {
    renderBag();
    openPanelFor(bag, bagBtn, () => bagClose);
  });
  searchBtn.addEventListener('click', () => openPanelFor(search, searchBtn, () => searchInput));
  $('.search-close').addEventListener('click', () => closePanels());
  bagClose.addEventListener('click', () => closePanels());
  scrim.addEventListener('click', () => closePanels());

  /* ---------- Keyboard ---------- */
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])';

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closePanels();
      setNav(false);
      return;
    }
    if (event.key === 'Enter' && document.activeElement === searchInput) {
      closePanels({ restore: false });
      $('#featured').scrollIntoView({ behavior: 'smooth' });
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

  /* ---------- Links that filter (nav, cards, shop all, wordmark, footer) ---------- */
  document.addEventListener('click', (event) => {
    // A tap outside the open mobile menu closes it
    if (nav.classList.contains('open') && !event.target.closest('.main-nav, .menu-toggle')) setNav(false);
    const trigger = event.target.closest('[data-filter]');
    if (trigger) {
      setFilter(trigger.dataset.filter, { keepSearch: trigger.classList.contains('chip') });
      setNav(false);
      return;
    }
    if (event.target.closest('.main-nav a')) setNav(false);
  });

  /* ---------- Newsletter ---------- */
  $('#newsletter-form').addEventListener('submit', (event) => {
    event.preventDefault();
    event.currentTarget.reset();
    showToast('Thanks for stopping by · sign-up is a preview');
  });

  loadBag();
  updateCount();
  applyFilters();
})();
