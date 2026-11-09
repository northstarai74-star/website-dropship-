(() => {
  const heading = document.querySelector('.ink-headline');
  const warp = document.getElementById('needverse-ink-warp');
  if (!heading || !warp) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  let characterIndex = 0;
  heading.querySelectorAll('.ink-word').forEach((word) => {
    word.setAttribute('aria-hidden', 'true');
    const letters = [...word.textContent];
    word.textContent = '';
    letters.forEach((character) => {
      const letter = document.createElement('span');
      letter.className = 'ink-letter';
      letter.setAttribute('aria-hidden', 'true');
      letter.style.setProperty('--letter-index', characterIndex++);
      letter.textContent = character;
      word.append(letter);
    });
  });

  heading.classList.add('ink-ready');
  requestAnimationFrame(() => heading.classList.add('ink-in'));

  let frame = 0;
  heading.querySelectorAll('.ink-word').forEach((word) => {
    word.addEventListener('pointerenter', () => {
      cancelAnimationFrame(frame);
      const started = performance.now();
      const duration = 680;
      word.style.filter = 'url(#needverse-ink-bleed)';
      const animate = (now) => {
        const progress = Math.min((now - started) / duration, 1);
        warp.setAttribute('scale', String((Math.sin(progress * Math.PI) * 15).toFixed(2)));
        if (progress < 1) frame = requestAnimationFrame(animate);
        else {
          warp.setAttribute('scale', '0');
          word.style.filter = '';
        }
      };
      frame = requestAnimationFrame(animate);
    });
  });
})();
