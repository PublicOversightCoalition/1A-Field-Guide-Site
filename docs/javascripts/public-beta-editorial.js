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
    wire.setAttribute('aria-label', 'Current 1A Field Guide research and project updates');

    const label = document.createElement('div');
    label.className = 'beta-newswire__label';
    label.textContent = 'LIVE RESEARCH';

    const viewport = document.createElement('div');
    viewport.className = 'beta-newswire__viewport';
    const track = document.createElement('div');
    track.className = 'beta-newswire__track';

    const items = [
      ...state.research.map((item) => [item.status, `${item.title} — ${item.wire}`, item.href]),
      ['CALIFORNIA', `Active jurisdiction — ${state.california.counties_inventoried} counties inventoried`, 'california/'],
      ['PUBLIC RECORDS', state.public_records.wire, state.public_records.href],
      ['FEDERAL', 'Field Guide development track continues', 'jurisdictions/federal/'],
      ...state.next.map((item) => [item.label, item.text, item.href || null]),
    ];

    [...items, ...items].forEach(([k, t, h]) => track.appendChild(mkItem(k, t, h)));
    viewport.appendChild(track);
    wire.append(label, viewport);

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
      [state.california.supported_qualification_rows, 'supported qualification rows'],
      [state.california.researched_unresolved_rows, 'researched-unresolved rows'],
      [state.california.gap_rows_at_activation, 'gap rows at activation'],
      [state.california.counties_inventoried, 'counties inventoried'],
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
    sub.textContent = 'The Field Guide connects law, policy, records, and incidents so a public claim can be traced back to the authority and evidence supporting it.';

    const stats = document.createElement('div');
    stats.className = 'beta-manifesto__stats';
    const values = [
      [state.research.length, 'active public research files'],
      [state.california.counties_inventoried, 'California counties inventoried'],
      [state.california.supported_qualification_rows, 'supported qualification rows'],
      [state.california.gap_rows_at_activation, 'gap rows at California activation'],
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
