(() => {
  const stage = document.querySelector('[data-nudge-stage]');
  if (!stage || !matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const items = [...stage.querySelectorAll('[data-nudge-item]')].map((element, index) => ({
    element, x: 0, y: 0, vx: 0, vy: 0, seed: index * 2.4
  }));
  let pointer = null;
  let frame = 0;
  let last = 0;

  const reset = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    items.forEach((item) => {
      item.x = item.y = item.vx = item.vy = 0;
      item.element.style.transform = '';
    });
  };

  const animate = (time) => {
    frame = 0;
    const dt = last ? Math.min((time - last) / 1000, 1 / 30) : 1 / 60;
    last = time;
    const rect = stage.getBoundingClientRect();
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    let moving = false;
    items.forEach((item) => {
      let tx = 0;
      let ty = 0;
      if (pointer) {
        const style = getComputedStyle(item.element);
        const x = parseFloat(style.left) / 100 * width;
        const y = parseFloat(style.top) / 100 * height;
        let dx = x - pointer.x;
        let dy = y - pointer.y;
        const distance = Math.hypot(dx, dy);
        const radius = Math.min(180, width * .19);
        if (distance < radius) {
          if (distance < .1) { dx = Math.cos(item.seed); dy = Math.sin(item.seed); }
          const divisor = distance < .1 ? 1 : distance;
          const force = Math.pow(1 - distance / radius, 1.35) * Math.min(45, width * .055);
          tx = dx / divisor * force;
          ty = dy / divisor * force;
        }
      }
      item.vx = (item.vx + (tx - item.x) * 115 * dt) * Math.exp(-15 * dt);
      item.vy = (item.vy + (ty - item.y) * 115 * dt) * Math.exp(-15 * dt);
      item.x += item.vx * dt;
      item.y += item.vy * dt;
      item.element.style.transform = `translate(-50%,-50%) translate3d(${item.x.toFixed(2)}px,${item.y.toFixed(2)}px,0)`;
      if (Math.abs(tx - item.x) + Math.abs(ty - item.y) + Math.abs(item.vx) + Math.abs(item.vy) > .08) moving = true;
      else { item.x = tx; item.y = ty; item.vx = item.vy = 0; }
    });
    if (moving) frame = requestAnimationFrame(animate);
    else last = 0;
  };
  const wake = () => { if (!frame) { last = 0; frame = requestAnimationFrame(animate); } };
  stage.addEventListener('pointermove', (event) => {
    const rect = stage.getBoundingClientRect();
    pointer = { x: (event.clientX - rect.left) * stage.clientWidth / rect.width, y: (event.clientY - rect.top) * stage.clientHeight / rect.height };
    wake();
  });
  stage.addEventListener('pointerleave', () => { pointer = null; wake(); });
  window.addEventListener('blur', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
})();
