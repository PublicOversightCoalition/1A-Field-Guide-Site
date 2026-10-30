(() => {
  const home = document.querySelector('[data-motion-home]');
  if (!home) return;

  const mkItem = (label, text, href) => {
    const a = document.createElement(href ? 'a' : 'span');
    a.className = 'beta-newswire__item';
    if (href) a.href = href;
    a.innerHTML = `<strong>${label}</strong><span>${text}</span>`;
    return a;
  };

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
    ['ACTIVE', 'Concord Library — PITS records follow-up', 'registry/concord-library/'],
    ['RESEARCHING', 'Healdsburg Police Department — policy and identification rules', 'registry/healdsburg-police/'],
    ['CALIFORNIA', 'Active jurisdiction — 58 counties inventoried', 'california/'],
    ['PUBLIC RECORDS', 'Evidence preservation and records-request field guide', 'open-government/public-records/'],
    ['FEDERAL', 'Field Guide development track continues', 'jurisdictions/federal/'],
    ['NEXT', 'Public evidence library and investigation-page system', null],
  ];

  [...items, ...items].forEach(([k, t, h]) => track.appendChild(mkItem(k, t, h)));
  viewport.appendChild(track);
  wire.append(label, viewport);

  const header = document.querySelector('.md-header');
  if (header) header.insertAdjacentElement('afterend', wire);
  else document.body.prepend(wire);

  const records = [...home.querySelectorAll('.beta-section')].find((section) =>
    section.textContent.includes('The source material matters.')
  );

  if (records) {
    records.classList.add('beta-records');

    const manifesto = document.createElement('section');
    manifesto.className = 'beta-manifesto';
    manifesto.innerHTML = `
      <h2 class="beta-manifesto__headline">Public power leaves a paper trail.</h2>
      <p class="beta-manifesto__sub">The Field Guide connects law, policy, records, and incidents so a public claim can be traced back to the authority and evidence supporting it.</p>
      <div class="beta-manifesto__stats">
        <div class="beta-manifesto__stat"><strong>2</strong><span>active public research files</span></div>
        <div class="beta-manifesto__stat"><strong>58</strong><span>California counties inventoried</span></div>
        <div class="beta-manifesto__stat"><strong>69</strong><span>supported qualification rows</span></div>
        <div class="beta-manifesto__stat"><strong>0</strong><span>gap rows at California activation</span></div>
      </div>`;
    records.insertAdjacentElement('beforebegin', manifesto);
  }
})();
