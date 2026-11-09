(() => {
  const header = document.querySelector('.header');
  const nav = document.querySelector('.island-nav');
  const highlight = nav?.querySelector('.island-highlight');
  const items = [...(nav?.querySelectorAll('[data-island-item]') || [])];
  if (!header || !nav || !highlight || !items.length) return;

  let active = nav.querySelector('[aria-current="page"]') || items[0];
  let hovered = null;
  let resizeFrame = 0;

  const moveHighlight = (item) => {
    if (!item || !nav.contains(item) || window.matchMedia('(max-width: 900px)').matches) return;
    const navRect = nav.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    nav.style.setProperty('--island-x', `${itemRect.left - navRect.left}px`);
    nav.style.setProperty('--island-width', `${itemRect.width}px`);
  };
  const setActive = (item) => {
    if (!item) return;
    if (item.matches('a[href]')) {
      active = item;
      items.forEach((entry) => {
        if (entry.matches('a[href]')) entry.removeAttribute('aria-current');
      });
      item.setAttribute('aria-current', 'page');
    }
    moveHighlight(item);
  };

  items.forEach((item) => {
    item.addEventListener('pointerenter', () => { hovered = item; moveHighlight(item); });
    item.addEventListener('focus', () => moveHighlight(item));
    item.addEventListener('click', () => setActive(item));
  });
  nav.addEventListener('pointerleave', () => { hovered = null; moveHighlight(active); });
  nav.addEventListener('focusout', (event) => {
    if (!nav.contains(event.relatedTarget)) moveHighlight(active);
  });

  const syncScroll = () => {
    header.classList.toggle('island-scrolled', window.scrollY > 60);
    nav.classList.toggle('compact', window.scrollY > 60);
  };
  window.addEventListener('scroll', syncScroll, { passive: true });
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => moveHighlight(hovered || active));
  });
  const observer = new ResizeObserver(() => moveHighlight(hovered || active));
  observer.observe(nav);
  requestAnimationFrame(() => moveHighlight(active));
  syncScroll();
})();
