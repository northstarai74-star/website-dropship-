(() => {
  'use strict';

  /* ---------- Data ---------- */
  const PRODUCTS = {
    relaxer: { name: 'Cordless Massage Gun', price: 3999, category: 'Wellness & recovery', image: 'assets/needverse-massager.webp', description: 'A compact recovery tool for easing into a slower evening or warming up after a long day.', features: ['Cordless, easy-to-store design', 'Multiple attachment heads', 'A simple everyday recovery routine'] },
    slate: { name: 'Compact Car Vacuum', price: 5499, category: 'Car cleaning', image: 'assets/needverse-vacuum.webp', description: 'A handy clean-up companion for the little crumbs, dust, and debris that collect between drives.', features: ['Compact handheld shape', 'Made for quick interior clean-ups', 'Easy to keep in the car'] },
    landing: { name: 'Shiatsu Foot Massager', price: 5999, category: 'Home comfort', image: 'assets/needverse-foot-massager.webp', description: 'A sit-back-and-unwind comfort piece for a calmer end to busy days at home.', features: ['Comfort-first home design', 'Made for a relaxed evening routine', 'A considered addition to your living space'] },
    rinse: { name: 'Portable Pressure Washer', price: 7499, category: 'Wash & care', image: 'assets/needverse-washer.webp', description: 'A portable wash-day helper for refreshing outdoor gear and giving your car a little extra care.', features: ['Portable, easy-to-handle format', 'Useful for home and car care', 'Designed for quick wash-day jobs'] }
  };
  const CATEGORY_LABELS = {
    home: 'home around the house comforts',
    auto: 'auto car care out on the road'
  };
  const HEADINGS = {
    '': ['Gear for your ', 'everyday.'],
    home: ['Reset your ', 'routine.'],
    auto: ['Ready for the ', 'road.']
  };
  const FILTER_NOTES = {
    '': 'Showing all products.',
    home: 'Showing home comfort products.',
    auto: 'Showing car care products.'
  };
  const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

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
  const productModal = $('#product-modal');
  const authModal = $('#auth-modal');
  const detailClose = $('.product-modal-close');
  const detailImage = $('#detail-image');
  const detailTitle = $('#product-modal-title');
  const detailSubtitle = $('#detail-subtitle');
  const detailCategory = $('#detail-category');
  const detailPrice = $('#detail-price');
  const detailDescription = $('#detail-description');
  const detailFeatures = $('#detail-features');
  const detailQuantity = $('#detail-quantity');
  const checkoutPage = $('#checkout-page');
  const checkoutForm = $('#checkout-form');
  const orderConfirmation = $('#order-confirmation');
  const checkoutSummaryItems = $('#checkout-summary-items');
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
      ? `Showing results for "${state.q.trim()}".`
      : FILTER_NOTES[state.cat];

    noResults.hidden = shown > 0;
    if (!shown) noResultsText.textContent = q ? `No products found for: ${state.q.trim()}` : 'Nothing here just yet.';

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
    [bag, search, productModal, authModal].forEach((panel) => {
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
      panel.inert = true;
    });
    bagBtn.setAttribute('aria-expanded', 'false');
    searchBtn.setAttribute('aria-expanded', 'false');
    $$('[data-details][aria-expanded="true"]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
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
    if (button.hasAttribute('aria-expanded')) button.setAttribute('aria-expanded', 'true');
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

  const mainContent = $('main');
  const footer = $('.footer');
  let detailId = null;
  let detailQty = 1;

  const renderCheckoutSummary = () => {
    checkoutSummaryItems.replaceChildren();
    items.forEach((qty, id) => {
      const product = PRODUCTS[id];
      checkoutSummaryItems.append(el('div', { class: 'checkout-summary-row' },
        el('img', { src: product.image, alt: '' }),
        el('span', { class: 'checkout-summary-name' }, product.name, el('small', { text: `Qty ${qty}` })),
        el('b', { text: money(product.price * qty) })
      ));
    });
    $('#checkout-subtotal').textContent = money(subtotalAmount());
    $('#checkout-total').textContent = money(subtotalAmount());
  };

  const showCheckout = () => {
    if (!items.size) { showToast('Your bag is empty'); return; }
    closePanels({ restore: false });
    mainContent.hidden = true; footer.hidden = true; checkoutPage.hidden = false;
    checkoutForm.hidden = false; orderConfirmation.hidden = true; renderCheckoutSummary();
    if (location.hash !== '#checkout') history.pushState({ checkout: true }, '', '#checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showStore = (scrollToShop = false) => {
    checkoutPage.hidden = true; mainContent.hidden = false; footer.hidden = false;
    checkoutForm.reset(); orderConfirmation.hidden = true;
    if (location.hash === '#checkout') history.replaceState({}, '', `${location.pathname}${location.search}#featured`);
    if (scrollToShop) $('#featured').scrollIntoView({ behavior: 'smooth' });
  };

  const subtotalAmount = () => [...items.entries()].reduce((sum, [id, qty]) => sum + PRODUCTS[id].price * qty, 0);
  const renderBag = () => {
    bagBody.replaceChildren();
    if (!items.size) {
      const heading = el('h3'); heading.append('A little empty', el('br'), 'in here.');
      bagBody.append(heading, el('p', { text: 'Your good finds will live here.' }), el('a', { class: 'button button-dark', href: '#featured', text: 'Browse the edit' }));
      return;
    }
    const list = el('div', { class: 'bag-items' });
    items.forEach((qty, id) => {
      const product = PRODUCTS[id];
      const thumb = el('img', { class: 'bag-thumb', src: product.image, alt: '' });
      const quantity = el('div', { class: 'bag-quantity', 'aria-label': `Quantity ${qty}` },
        el('button', { type: 'button', 'data-qty': '-1', 'data-id': id, 'aria-label': `Decrease ${product.name} quantity`, text: '-' }),
        el('span', { text: String(qty) }),
        el('button', { type: 'button', 'data-qty': '1', 'data-id': id, 'aria-label': `Increase ${product.name} quantity`, text: '+' })
      );
      const name = el('span', { class: 'bag-name' }, product.name, el('small', { text: product.category }), quantity);
      const remove = el('button', { type: 'button', 'data-remove': id, 'aria-label': `Remove ${product.name}`, text: 'Remove' });
      const side = el('span', { class: 'bag-side' }, el('span', { text: money(product.price * qty) }), remove);
      list.append(el('div', { class: 'bag-row' }, thumb, name, side));
    });
    bagBody.append(list,
      el('div', { class: 'bag-subtotal' }, el('span', { text: 'Subtotal' }), el('b', { text: money(subtotalAmount()) })),
      el('p', { class: 'bag-demo-caption', text: 'Secure checkout. Free delivery on all orders.' }),
      el('button', { class: 'bag-checkout-button', type: 'button', 'data-start-checkout': '', text: 'Continue to checkout' })
    );
  };

  bagBody.addEventListener('click', (event) => {
    if (event.target.closest('[data-start-checkout]')) { showCheckout(); return; }
    if (event.target.closest('a[href^="#"]')) { closePanels({ restore: false }); return; }
    const quantityButton = event.target.closest('[data-qty]');
    if (quantityButton) {
      const id = quantityButton.dataset.id;
      const next = (items.get(id) || 0) + Number(quantityButton.dataset.qty);
      if (next > 0) items.set(id, next); else items.delete(id);
      updateCount(); renderBag(); return;
    }
    const button = event.target.closest('[data-remove]');
    if (button) { items.delete(button.dataset.remove); updateCount(); renderBag(); }
  });

  const showProductDetail = (id, openerButton) => {
    const product = PRODUCTS[id]; if (!product) return;
    detailId = id; detailQty = 1;
    detailImage.src = product.image; detailImage.alt = product.name;
    detailTitle.textContent = product.name; detailSubtitle.textContent = product.category;
    detailCategory.textContent = product.category.toUpperCase(); detailPrice.textContent = money(product.price);
    detailDescription.textContent = product.description; detailQuantity.value = '1'; detailQuantity.textContent = '1';
    detailFeatures.replaceChildren(...product.features.map((feature) => el('li', { text: feature })));
    openPanelFor(productModal, openerButton, () => detailClose);
  };
  $$('[data-details]').forEach((button) => button.addEventListener('click', () => showProductDetail(button.closest('.product-card').dataset.id, button)));
  detailClose.addEventListener('click', () => closePanels());
  productModal.addEventListener('click', (event) => { if (event.target === productModal) closePanels(); });
  $$('[data-detail-qty]').forEach((button) => button.addEventListener('click', () => {
    detailQty = Math.max(1, detailQty + Number(button.dataset.detailQty));
    detailQuantity.value = String(detailQty); detailQuantity.textContent = String(detailQty);
  }));
  $('[data-detail-add]').addEventListener('click', () => {
    const id = detailId; const qty = detailQty;
    requireAuth(() => {
      items.set(id, (items.get(id) || 0) + qty); updateCount();
      closePanels({ restore: false }); renderBag(); openPanelFor(bag, bagBtn, () => bagClose);
      showToast('Added to your bag');
    });
  });

  let placingOrder = false;
  let razorpayLoader;
  const loadRazorpay = () => razorpayLoader || (razorpayLoader = new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = () => { razorpayLoader = null; reject(new Error('razorpay-load')); };
    document.head.append(script);
  }));

  const cfg = () => window.NEEDVERSE_SUPABASE || {};
  const configured = () => cfg().url && cfg().anonKey && !/YOUR-/.test(cfg().url + cfg().anonKey);

  /* ---------- Accounts (Supabase Auth, email + password) ---------- */
  const sb = configured() && window.supabase ? window.supabase.createClient(cfg().url, cfg().anonKey) : null;
  let session = null;
  let pendingAction = null;
  let authMode = 'signin'; // signin | signup | reset
  const authCard = $('.auth-card');
  const authForm = $('#auth-form');
  const authEmail = $('#auth-email');
  const authPassword = $('#auth-password');
  const authMessage = $('#auth-message');
  const authSubmit = $('.auth-submit');
  const authPasswordToggle = $('#auth-password-toggle');
  const authTitle = $('#auth-title');
  const authLead = $('#auth-lead');
  const bagFoot = $('.bag-foot');

  const renderAccount = () => {
    bagFoot.replaceChildren();
    if (session) {
      const out = el('button', { type: 'button', 'data-sign-out': '', text: 'Sign out' });
      bagFoot.append(el('span', { class: 'account-line' }, el('span', { text: `Signed in as ${session.user.email}` }), out));
    } else {
      bagFoot.append('Payments secured by Razorpay');
    }
  };
  bagFoot.addEventListener('click', async (event) => {
    if (!event.target.closest('[data-sign-out]') || !sb) return;
    await sb.auth.signOut();
    showToast('Signed out');
  });

  const setAuthMessage = (text, info = false) => {
    authMessage.hidden = !text; authMessage.textContent = text || '';
    authMessage.classList.toggle('is-info', info);
  };
  const setAuthMode = (mode) => {
    authMode = mode; authCard.dataset.mode = mode; setAuthMessage('');
    authPassword.type = 'password';
    authPasswordToggle.textContent = 'Show';
    authPasswordToggle.setAttribute('aria-label', 'Show password');
    authPasswordToggle.setAttribute('aria-pressed', 'false');
    $$('[data-auth-mode]').forEach((b) => {
      const on = b.dataset.authMode === mode;
      b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on));
    });
    authPassword.autocomplete = mode === 'signin' ? 'current-password' : 'new-password';
    authSubmit.firstChild.textContent = mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Save new password';
    authTitle.textContent = mode === 'reset' ? 'Choose a new password' : 'Sign in to add to bag';
    authLead.textContent = mode === 'reset' ? 'Enter a new password for your account (at least 8 characters).'
      : 'Sign in or create an account to start your bag and check out.';
  };
  const openAuth = (mode = 'signin') => {
    setAuthMode(mode);
    openPanelFor(authModal, authEmail, () => (mode === 'reset' ? authPassword : authEmail));
  };
  // Runs `action` now if signed in, otherwise after the shopper signs in.
  const requireAuth = async (action) => {
    if (!sb) { showToast('Store backend is not connected yet'); return; }
    if (!session) { const { data } = await sb.auth.getSession(); session = data.session; }
    if (session) { action(); return; }
    pendingAction = action;
    openAuth('signin');
  };
  $$('[data-auth-mode]').forEach((b) => b.addEventListener('click', () => setAuthMode(b.dataset.authMode)));
  authPasswordToggle.addEventListener('click', () => {
    const reveal = authPassword.type === 'password';
    authPassword.type = reveal ? 'text' : 'password';
    authPasswordToggle.textContent = reveal ? 'Hide' : 'Show';
    authPasswordToggle.setAttribute('aria-label', reveal ? 'Hide password' : 'Show password');
    authPasswordToggle.setAttribute('aria-pressed', String(reveal));
  });
  $('.auth-close').addEventListener('click', () => { pendingAction = null; closePanels(); });
  authModal.addEventListener('click', (event) => { if (event.target === authModal) { pendingAction = null; closePanels(); } });
  $('#auth-forgot').addEventListener('click', async () => {
    const email = authEmail.value.trim();
    if (!email) { setAuthMessage('Enter your email above first.'); return; }
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    setAuthMessage(error ? 'Could not send the email - try again later.' : 'If that email has an account, a reset link is on its way.', !error);
  });
  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!sb) return;
    const email = authEmail.value.trim(); const password = authPassword.value;
    if (authMode !== 'reset' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setAuthMessage('Enter a valid email address.'); return; }
    if (password.length < 8) { setAuthMessage('Password must be at least 8 characters.'); return; }
    authSubmit.disabled = true; setAuthMessage('');
    try {
      if (authMode === 'reset') {
        const { error } = await sb.auth.updateUser({ password });
        if (error) { setAuthMessage(error.message); return; }
        closePanels(); showToast('Password updated'); return;
      }
      const result = authMode === 'signup' ? await sb.auth.signUp({ email, password }) : await sb.auth.signInWithPassword({ email, password });
      if (result.error) {
        setAuthMessage(/invalid login/i.test(result.error.message) ? 'Incorrect email or password.' : result.error.message);
        return;
      }
      if (!result.data.session) { setAuthMessage('Check your email to confirm your account, then sign in.', true); return; }
      session = result.data.session; authForm.reset();
      const action = pendingAction; pendingAction = null;
      closePanels({ restore: false }); renderAccount();
      if (action) action();
    } catch (err) {
      setAuthMessage('Could not reach the store - try again.');
    } finally {
      authSubmit.disabled = false;
    }
  });
  if (sb) {
    sb.auth.getSession().then(({ data }) => { session = data.session; renderAccount(); });
    sb.auth.onAuthStateChange((event, next) => {
      session = next; renderAccount();
      if (event === 'PASSWORD_RECOVERY') openAuth('reset');
    });
  } else renderAccount();

  const callSupabase = async (path, body) => {
    const token = (session && session.access_token) || cfg().anonKey;
    const res = await fetch(`${cfg().url}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: cfg().anonKey, Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { const err = new Error(json.message || json.error || 'request-failed'); err.status = res.status; throw err; }
    return json;
  };

  const completeOrder = (number, message) => {
    $('#order-number').textContent = number;
    $('#confirmation-copy').textContent = message;
    checkoutForm.hidden = true; orderConfirmation.hidden = false;
    items.clear(); updateCount(); renderBag(); checkoutForm.reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const postalInput = checkoutForm.querySelector('[name="postal"]');
  const postalError = $('#postal-error');
  const validateIndianPin = () => {
    const valid = /^[1-9][0-9]{5}$/.test(postalInput.value.trim());
    postalInput.setAttribute('aria-invalid', String(!valid));
    postalError.hidden = valid;
    return valid;
  };
  postalInput.addEventListener('input', () => {
    if (postalInput.getAttribute('aria-invalid') === 'true') validateIndianPin();
  });
  checkoutForm.addEventListener('reset', () => {
    postalInput.removeAttribute('aria-invalid');
    postalError.hidden = true;
  });
  checkoutForm.addEventListener('submit', (event) => {
    if (validateIndianPin()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    postalInput.focus();
  }, true);

  // Opens Razorpay Checkout; resolves with the payment result, or null if the shopper closed it.
  const payWithRazorpay = (order) => new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: order.key_id, amount: order.amount, currency: order.currency, order_id: order.razorpay_order_id,
      name: 'Needverse', description: `Order ${order.number}`,
      prefill: { name: order.name, email: order.email },
      theme: { color: '#111111' },
      handler: (response) => resolve(response),
      modal: { ondismiss: () => resolve(null) }
    });
    rzp.on('payment.failed', () => { rzp.close(); reject(new Error('payment-failed')); });
    rzp.open();
  });

  checkoutForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (placingOrder) return;
    if (!items.size) { showStore(); showToast('Your bag is empty'); return; }
    const data = new FormData(checkoutForm);
    if (!configured()) { showToast('Store backend is not connected yet'); return; }
    if (!session) { requireAuth(() => showToast('Signed in - press Place order again')); return; }
    const payload = {
      name: data.get('name'), email: data.get('email'), address: data.get('address'),
      city: data.get('city'), postal: data.get('postal'), payment: data.get('payment'),
      items: [...items.entries()].map(([id, qty]) => ({ id, qty }))
    };
    const submitBtn = $('.place-order-button');
    placingOrder = true; submitBtn.disabled = true;
    try {
      const placed = await callSupabase('/rest/v1/rpc/place_order', { payload });
      if (payload.payment === 'delivery') {
        callSupabase('/functions/v1/order-notify', { order_id: placed.id }).catch(() => {}); // confirmation email; never blocks the order
        completeOrder(placed.number, 'Thank you. Your order is confirmed - please keep the amount ready for delivery.');
        return;
      }
      await loadRazorpay();
      const order = await callSupabase('/functions/v1/razorpay-create-order', { order_id: placed.id });
      const paid = await payWithRazorpay(order);
      if (!paid) { showToast('Payment not completed - your order is saved, you can try again'); return; }
      await callSupabase('/functions/v1/razorpay-verify', {
        order_id: placed.id,
        razorpay_order_id: paid.razorpay_order_id,
        razorpay_payment_id: paid.razorpay_payment_id,
        razorpay_signature: paid.razorpay_signature
      });
      completeOrder(placed.number, 'Payment received. Thank you - your order is confirmed.');
    } catch (err) {
      if (err.message === 'payment-failed') showToast('Payment failed - please try again');
      else if (err.message === 'razorpay-load') showToast('Could not load the payment window - check your connection');
      else if (err.status === 401 || err.message === 'not_signed_in') { session = null; showToast('Please sign in again'); requireAuth(() => showToast('Signed in - press Place order again')); }
      else if (err.status === 429) showToast('Too many attempts - try again soon');
      else if (err.status >= 400 && err.status < 500) showToast('Please check your details and try again');
      else showToast('Could not reach the store - try again');
    } finally {
      placingOrder = false; submitBtn.disabled = false;
    }
  });
  $$('[data-back-store]').forEach((button) => button.addEventListener('click', () => showStore(true)));
  window.addEventListener('popstate', () => { if (location.hash === '#checkout') showCheckout(); else if (!checkoutPage.hidden) showStore(); });

  $$('[data-add]').forEach((button) => button.addEventListener('click', () => {
    const id = button.closest('.product-card').dataset.id;
    requireAuth(() => {
      items.set(id, (items.get(id) || 0) + 1);
      updateCount();
      if (openPanel === bag) renderBag();
      showToast('Added to your bag');
    });
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
  updateCount();
  applyFilters();
})();

