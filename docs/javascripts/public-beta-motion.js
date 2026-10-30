(() => {
  const root = document.querySelector('[data-motion-home]');
  if (!root) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cards = [...root.querySelectorAll('[data-motion-card]')];
  const reveals = [...root.querySelectorAll('[data-motion-reveal]')];
  const sections = [...root.querySelectorAll('[data-motion-section]')];
  const evidence = [...root.querySelectorAll('[data-evidence-step]')];

  if (reduce) {
    cards.forEach(el => el.classList.add('is-visible'));
    reveals.forEach(el => el.classList.add('is-visible'));
    evidence.forEach(el => el.classList.add('is-active'));
    return;
  }

  const visibleObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

  cards.forEach((card, i) => {
    card.style.transitionDelay = `${Math.min((i % 6) * 55, 275)}ms`;
    visibleObserver.observe(card);
  });
  reveals.forEach(el => visibleObserver.observe(el));

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('is-current', entry.isIntersecting);
    });
  }, { threshold: 0.38 });
  sections.forEach(section => sectionObserver.observe(section));

  const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));

  let ticking = false;
  const update = () => {
    ticking = false;
    const doc = document.documentElement;
    const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
    const overall = clamp(window.scrollY / maxScroll);
    root.style.setProperty('--beta-scroll-progress', overall.toFixed(4));

    const viewportMid = window.innerHeight * 0.52;
    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, rect.height + window.innerHeight);
      const progress = clamp((window.innerHeight - rect.top) / travel);
      const key = section.dataset.motionSection;
      if (key) root.style.setProperty(`--beta-${key}-progress`, progress.toFixed(4));
    });

    if (evidence.length) {
      const panel = root.querySelector('[data-motion-evidence]');
      if (panel) {
        const rect = panel.getBoundingClientRect();
        const normalized = clamp((viewportMid - rect.top) / Math.max(1, rect.height));
        const activeIndex = Math.min(evidence.length - 1, Math.max(0, Math.floor(normalized * evidence.length)));
        evidence.forEach((el, i) => el.classList.toggle('is-active', i <= activeIndex));
      }
    }
  };

  const requestUpdate = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();
})();
