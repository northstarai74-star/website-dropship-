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

    demoNote.textContent = q && shown
      ? `Showing results for “${state.q.trim()}” · prices are examples.`
      : DEMO_NOTES[state.cat];

    noResults.hidden = shown > 0;
    if (!shown) noResultsText.textContent = q ? `Nothing matches “${state.q.trim()}” just yet.` : 'Nothing here just yet.';

    chips.forEach((chip) => {
      const active = chip.dataset.filter === (state.cat || 'all');
      chip.setAttribute('aria-pressed', String(active));
    });
  };

  const setFilter = (cat) => {
    state.cat = cat === 'all' ? '' : cat;
    state.q = '';
    searchInput.value = '';
    applyFilters();
  };

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
    focusTarget().focus();
  };

  /* ---------- Bag ---------- */
  const items = new Map(); // id -> qty
  const totalCount = () => [...items.values()].reduce((sum, qty) => sum + qty, 0);

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
      const name = el('span', { class: 'bag-name' }, product.name, el('small', { text: `Example item · Qty ${qty}` }));
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

  bagBody.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (link) {
      closePanels({ restore: false });
      return;
    }
    const button = event.target.closest('[data-remove]');
    if (!button) return;
    const buttons = $$('[data-remove]', bagBody);
    const index = buttons.indexOf(button);
    items.delete(button.dataset.remove);
    updateCount();
    renderBag();
    const remaining = $$('[data-remove]', bagBody);
    (remaining[Math.min(index, remaining.length - 1)] || bagClose).focus();
  });

  $$('[data-add]').forEach((button) => button.addEventListener('click', () => {
    const id = button.closest('.product-card').dataset.id;
    items.set(id, (items.get(id) || 0) + 1);
    updateCount();
    if (openPanel === bag) renderBag();
    showToast('Added to your bag · concept preview');
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
    const trigger = event.target.closest('[data-filter]');
    if (trigger) {
      setFilter(trigger.dataset.filter);
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

  updateCount();
  applyFilters();
})();
