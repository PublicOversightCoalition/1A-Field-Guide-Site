(() => {
  const home = document.querySelector('[data-motion-home]');
  if (!home) return;

  const stateUrl = new URL('data/project-state.json', document.baseURI);

  const mkItem = (label, text, href) => {
    const item = document.createElement(href ? 'a' : 'span');
    item.className = 'beta-newswire__item';
    if (href) item.href = href;

    const strong = document.createElement('strong');
    strong.textContent = label;
    const span = document.createElement('span');
    span.textContent = text;
    item.append(strong, span);
    return item;
  };

  const buildWire = (state) => {
    const wire = document.createElement('div');
    wire.className = 'beta-newswire';
    wire.setAttribute('role', 'region');
    wire.setAttribute('aria-label', 'Current 1A Field Guide research and project updates');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const compactViewport = window.matchMedia('(max-width: 48em)');
    // Mobile advances one readable update at a time. Reduced-motion starts paused.
    const initiallyPaused = reducedMotion;
    if (initiallyPaused) wire.classList.add('is-paused');

    const label = document.createElement('div');
    label.className = 'beta-newswire__label';
    label.textContent = 'LIVE RESEARCH';

    const viewport = document.createElement('div');
    viewport.className = 'beta-newswire__viewport';
    const track = document.createElement('div');
    track.className = 'beta-newswire__track';

    const items = [
      ...state.research.map((item) => [item.status, `${item.title}; ${item.wire}`, item.href]),
      ['CALIFORNIA', `Active jurisdiction; ${state.california.counties_inventoried} counties inventoried`, 'california/'],
      ['PUBLIC RECORDS', state.public_records.wire, state.public_records.href],
      ['FEDERAL', 'Field Guide development track continues', 'jurisdictions/federal/'],
      ...state.next.map((item) => [item.label, item.text, item.href || null]),
    ];

    items.forEach(([k, t, h]) => track.appendChild(mkItem(k, t, h)));
    // A visual duplicate makes the animation seamless but must not create
    // duplicate screen-reader announcements or keyboard tab stops.
    const duplicate = document.createElement('div');
    duplicate.className = 'beta-newswire__duplicate';
    duplicate.setAttribute('aria-hidden', 'true');
    items.forEach(([k, t, h]) => {
      const item = mkItem(k, t, h);
      if (item.matches('a')) item.tabIndex = -1;
      duplicate.appendChild(item);
    });
    // Keep original items together as the first half of the scrolling track.
    const originals = document.createElement('div');
    originals.className = 'beta-newswire__originals';
    while (track.firstChild) originals.appendChild(track.firstChild);
    track.append(originals, duplicate);
    viewport.appendChild(track);

    const pause = document.createElement('button');
    pause.type = 'button';
    pause.className = 'beta-newswire__pause';
    const playbackSymbol = document.createElement('span');
    playbackSymbol.className = 'beta-newswire__playback-symbol';
    playbackSymbol.setAttribute('aria-hidden', 'true');
    pause.appendChild(playbackSymbol);
    const updatePlaybackControl = (paused) => {
      const action = paused ? 'Resume updates' : 'Pause updates';
      pause.setAttribute('aria-pressed', String(paused));
      pause.setAttribute('aria-label', action);
      pause.title = action;
      playbackSymbol.textContent = paused ? '▶' : '⏸';
    };
    updatePlaybackControl(initiallyPaused);
    pause.addEventListener('click', () => {
      updatePlaybackControl(wire.classList.toggle('is-paused'));
    });

    // Deliberate card-by-card movement on narrow screens, not continuous text
    // crawling. Each update is stationary for nine seconds before advancing.
    // Users can swipe at any time. Focus, an open menu, or a backgrounded page
    // suspends automatic advancement without changing their pause preference.
    const mobileItems = [...originals.querySelectorAll('.beta-newswire__item')];
    const reelDelay = 9000;
    wire.dataset.mobileReelInterval = String(reelDelay);
    const advanceMobileReel = () => {
      if (!compactViewport.matches || wire.classList.contains('is-paused') ||
          document.hidden || wire.matches(':focus-within, :hover') ||
          document.querySelector('#__drawer')?.checked ||
          document.querySelector('#__search')?.checked) return;
      if (mobileItems.length < 2) return;
      const position = viewport.scrollLeft;
      const following = mobileItems.find(item => item.offsetLeft > position + 8);
      viewport.scrollTo({
        left: following ? following.offsetLeft : 0,
        behavior: following ? 'smooth' : 'instant'
      });
    };
    window.setInterval(advanceMobileReel, reelDelay);

    wire.append(label, viewport, pause);

    const header = document.querySelector('.md-header');
    if (header) header.insertAdjacentElement('afterend', wire);
    else document.body.prepend(wire);
  };

  const applyStatus = (state) => {
    const line = home.querySelector('.beta-statusline');
    if (!line) return;
    line.replaceChildren();

    const entries = [
      [`${state.jurisdictions.active} Active`, null],
      [`${state.jurisdictions.development} Field Guide Development:`, state.jurisdictions.development_name],
      [`${state.jurisdictions.not_yet_qualified} Not yet qualified`, null],
    ];

    entries.forEach(([strongText, tail]) => {
      const span = document.createElement('span');
      const strong = document.createElement('strong');
      strong.textContent = strongText;
      span.appendChild(strong);
      if (tail) span.append(` ${tail}`);
      line.appendChild(span);
    });
  };

  const applyResearch = (state) => {
    const cards = [...home.querySelectorAll('.beta-case-card')];
    const research = [...state.research].sort((a, b) => Number(b.lead) - Number(a.lead));

    cards.forEach((card, index) => {
      const item = research[index];
      if (!item) {
        card.hidden = true;
        return;
      }

      card.hidden = false;
      card.href = item.href;
      const meta = card.querySelector('.beta-case-card__meta');
      const title = card.querySelector('h3');
      const summary = card.querySelector('p');

      if (meta) {
        meta.replaceChildren();
        const dot = document.createElement('span');
        dot.className = 'beta-live-dot';
        meta.append(dot, ` ${item.status} · ${item.region}`);
      }
      if (title) title.textContent = item.title;
      if (summary) summary.textContent = item.summary;
    });
  };

  const applyCaliforniaMetrics = (state) => {
    const stats = [...home.querySelectorAll('.beta-california__stats > div')];
    const values = [
      [state.california.supported_qualification_rows, 'research checks with supporting sources'],
      [state.california.researched_unresolved_rows, 'questions still under review'],
      [state.california.gap_rows_at_activation, 'unfilled research gaps at launch'],
      [state.california.counties_inventoried, 'California counties inventoried'],
    ];

    stats.forEach((stat, index) => {
      if (!values[index]) return;
      const [value, label] = values[index];
      const strong = stat.querySelector('strong');
      const span = stat.querySelector('span');
      if (strong) strong.textContent = value;
      if (span) span.textContent = label;
    });
  };

  const buildManifesto = (state) => {
    const records = [...home.querySelectorAll('.beta-section')].find((section) =>
      section.textContent.includes('The source material matters.')
    );
    if (!records) return;

    records.classList.add('beta-records');

    const manifesto = document.createElement('section');
    manifesto.className = 'beta-manifesto';

    const headline = document.createElement('h2');
    headline.className = 'beta-manifesto__headline';
    headline.textContent = 'Public power leaves a paper trail.';

    const sub = document.createElement('p');
    sub.className = 'beta-manifesto__sub';
    sub.textContent = 'When a public agency makes a claim, we look for the law, policy, and records behind it. You should be able to follow that trail too.';

    const stats = document.createElement('div');
    stats.className = 'beta-manifesto__stats';
    const values = [
      [state.research.length, 'active public research files'],
      [state.california.counties_inventoried, 'California counties inventoried'],
      [state.california.supported_qualification_rows, 'research checks with supporting sources'],
      [state.california.gap_rows_at_activation, 'unfilled research gaps at launch'],
    ];

    values.forEach(([value, label]) => {
      const stat = document.createElement('div');
      stat.className = 'beta-manifesto__stat';
      const strong = document.createElement('strong');
      strong.textContent = value;
      const span = document.createElement('span');
      span.textContent = label;
      stat.append(strong, span);
      stats.appendChild(stat);
    });

    manifesto.append(headline, sub, stats);
    records.insertAdjacentElement('beforebegin', manifesto);
  };

  const initialize = async () => {
    try {
      const response = await fetch(stateUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Project state request failed: ${response.status}`);
      const state = await response.json();

      home.dataset.projectStateUpdated = state.updated || '';
      buildWire(state);
      applyStatus(state);
      applyResearch(state);
      applyCaliforniaMetrics(state);
      buildManifesto(state);
    } catch (error) {
      console.error('Unable to load public project state.', error);
    }
  };

  initialize();
})();
