(() => {
  const hero = document.querySelector('.hero');
  const canvas = document.getElementById('hero-trail');
  if (!hero || !canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const points = [];
  const lifetime = 1500;
  const maxPoints = 95;
  let width = 0;
  let height = 0;
  let frame = 0;
  let previous = null;

  const resize = () => {
    const rect = hero.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const drawRibbon = (now, strand, config) => {
    if (points.length < 2) return;
    const shifted = points.map((point, index) => {
      const before = points[Math.max(0, index - 1)];
      const after = points[Math.min(points.length - 1, index + 1)];
      const dx = after.x - before.x;
      const dy = after.y - before.y;
      const length = Math.hypot(dx, dy) || 1;
      const nx = -dy / length;
      const ny = dx / length;
      const phase = index * .34 + now * .0014 + strand * 2.1;
      const speed = Math.min(point.speed || 0, 1.8);
      const amplitude = 2.2 + speed * 5.5;
      const wave = Math.sin(phase) * amplitude;
      const age = Math.max(0, 1 - (now - point.time) / lifetime);
      return { x: point.x + nx * wave, y: point.y + ny * wave, age };
    });

    const averageAge = shifted.reduce((sum, point) => sum + point.age, 0) / shifted.length;
    if (averageAge <= .01) return;
    ctx.beginPath();
    ctx.moveTo(shifted[0].x, shifted[0].y);
    for (let i = 1; i < shifted.length - 1; i++) {
      const midX = (shifted[i].x + shifted[i + 1].x) / 2;
      const midY = (shifted[i].y + shifted[i + 1].y) / 2;
      ctx.quadraticCurveTo(shifted[i].x, shifted[i].y, midX, midY);
    }
    const last = shifted[shifted.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.globalAlpha = config.alpha * averageAge;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = config.width;
    ctx.strokeStyle = config.color;
    ctx.shadowColor = config.color;
    ctx.shadowBlur = config.blur;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  };

  const render = (now) => {
    ctx.clearRect(0, 0, width, height);
    while (points.length && now - points[0].time > lifetime) points.shift();
    ctx.globalCompositeOperation = 'screen';
    drawRibbon(now, 0, { color: '#b8c1b1', width: 19, alpha: .07, blur: 28 });
    drawRibbon(now, 1, { color: '#d9ff35', width: 8, alpha: .12, blur: 18 });
    drawRibbon(now, 2, { color: '#eff5e6', width: 2.2, alpha: .34, blur: 8 });
    drawRibbon(now, 3, { color: '#d9ff35', width: 1, alpha: .62, blur: 5 });
    ctx.globalCompositeOperation = 'source-over';
    if (points.length > 1) frame = requestAnimationFrame(render);
    else frame = 0;
  };

  hero.addEventListener('pointermove', (event) => {
    const rect = hero.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top, time: performance.now(), speed: 0 };
    if (previous) {
      const distance = Math.hypot(point.x - previous.x, point.y - previous.y);
      const elapsed = Math.max(8, point.time - previous.time);
      point.speed = Math.min(distance / elapsed, 1.8);
    }
    previous = point;
    points.push(point);
    if (points.length > maxPoints) points.shift();
    if (!frame) frame = requestAnimationFrame(render);
  }, { passive: true });

  hero.addEventListener('pointerleave', () => { previous = null; }, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  resize();
})();
