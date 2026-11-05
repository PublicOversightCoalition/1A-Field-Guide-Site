/* Functional visitor-journey checks. Complements axe checks; not WCAG certification. */
import { chromium, firefox, webkit } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.AUDIT_URL || 'http://127.0.0.1:8765/1A-Field-Guide-Site/';
const output = process.env.AUDIT_OUTPUT || 'audit-results';
mkdirSync(output, { recursive: true });
const engine = process.env.PLAYWRIGHT_BROWSER || 'chromium';
const browsers = { chromium, firefox, webkit };
if (!Object.hasOwn(browsers, engine)) throw new Error('Unsupported browser engine: ' + engine);
const browser = await browsers[engine].launch({
  headless: true,
  ...(engine === 'chromium' ? { args: ['--no-sandbox'] } : {})
});
const results = [];

async function test(name, width, journey, { route = '', reducedMotion = 'reduce' } = {}) {
  const context = await browser.newContext({
    viewport: { width, height: 844 }, reducedMotion,
    deviceScaleFactor: 1
  });
  const page = await context.newPage();
  const issues = [];
  page.on('pageerror', e => issues.push('pageerror: ' + String(e).slice(0, 350)));
  page.on('requestfailed', req => issues.push('requestfailed: ' + req.url().slice(0, 150) + ' ' + req.failure()?.errorText));
  try {
    const resp = await page.goto(new URL(route, base).href, { waitUntil: 'networkidle', timeout: 25000 });
    if (!resp?.ok()) throw new Error('Page returned HTTP ' + resp?.status());
    await journey(page);
    results.push({ name, width, route, outcome: 'pass' });
    console.log('PASS ' + name + ' ' + width + 'px');
  } catch (e) {
    const error = String(e).slice(0, 1300);
    const diagnostics = name.startsWith('Search') ? await page.evaluate(() => ({
      searchOpen: document.querySelector('#__search')?.checked,
      input: document.querySelector('.md-search__input')?.value,
      meta: document.querySelector('.md-search-result__meta')?.textContent?.trim(),
      list: document.querySelector('.md-search-result__list')?.textContent?.slice(0, 350),
      searchResults: document.querySelectorAll('.md-search-result__link').length,
      formVisible: !!document.querySelector('.md-search__form')?.getBoundingClientRect().width,
      html: document.querySelector('.md-search__output')?.innerHTML.slice(0, 500),
      stack: ['.md-header','.md-search','.md-search__inner','.md-search__output','.md-search__scrollwrap','.md-search-result__link','.beta-newswire']
        .map(sel=>{const el=document.querySelector(sel);const css=el&&getComputedStyle(el);
          return {sel,rect:el?.getBoundingClientRect()?.toJSON(),z:css?.zIndex,position:css?.position,overflow:css?.overflow};}),
      hit: (()=>{const r=document.querySelector('.md-search-result__link')?.getBoundingClientRect();
        if(!r)return null;
        const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
        return {hit:e?.outerHTML.slice(0,280),rect:r.toJSON()};
      })()
    })) : undefined;
    results.push({ name, width, route, outcome: 'fail', error, diagnostics, issues });
    if (diagnostics) console.error('SEARCH DIAGNOSTICS ' + JSON.stringify({ diagnostics, issues }));
    console.error('FAIL ' + name + ' ' + width + 'px: ' + error);
  } finally {
    await context.close();
  }
}
function assert(condition, detail) {
  if (!condition) throw new Error(detail);
}

async function drawer(page, targetHref, finalPath) {
  await page.locator('label.md-header__button[for="__drawer"]').click({ timeout: 5000 });
  await page.waitForFunction(() => {
    const sidebar = document.querySelector('.md-sidebar--primary');
    return document.querySelector('#__drawer')?.checked &&
      sidebar?.getBoundingClientRect().width > 100;
  });
  await page.locator('.md-sidebar--primary a.md-nav__link[href*="' + targetHref + '"]').first().click({ timeout: 5500 });
  await page.waitForURL(url => url.pathname.endsWith(finalPath), { timeout: 5500 });
}

for (const width of [320, 390, 768]) {
  await test('Home mobile menu opens and navigates', width, async page => {
    await drawer(page, 'jurisdictions/', '/jurisdictions/');
  });
  await test('California section menu opens and navigates', width, async page => {
    await drawer(page, 'jurisdictions/federal/', '/jurisdictions/federal/');
  }, { route: 'california/' });
  await test('Mobile drawer closes via outside overlay', width, async page => {
    await page.locator('label.md-header__button[for="__drawer"]').click();
    await page.waitForFunction(() => document.querySelector('#__drawer')?.checked);
    await page.locator('.md-overlay').click({ position: { x: 310, y: 300 }, timeout: 5500 });
    await page.waitForFunction(() => !document.querySelector('#__drawer')?.checked);
  });
}

for (const width of [390, 1440]) {
  await test('Search opens, returns results, follows a result', width, async page => {
    const opener = page.locator('label.md-header__button[for="__search"]');
    if (await opener.isVisible()) await opener.click();
    const input = page.locator('input.md-search__input');
    if (!await input.isVisible()) throw new Error('Search input is not visible at this viewport');
    await input.click();
    await input.pressSequentially('public records', { delay: 30 });
    const result = page.locator('a.md-search-result__link').first();
    await result.waitFor({ state: 'visible', timeout: 12000 });
    const url = await result.getAttribute('href');
    assert(url && url.length > 1, 'Search result has no URL');
    await result.click();
    await page.waitForURL(url => !url.pathname.endsWith('/1A-Field-Guide-Site/'), { timeout: 7000 });
  });
  await test('Dynamic investigation cards lead to research', width, async page => {
    await page.locator('#investigations-live .investigation-card').first().waitFor({ state: 'visible', timeout: 8000 });
    const link = page.locator('#investigations-live .investigation-card h2 a').first();
    const target = await link.getAttribute('href');
    assert(target && target.includes('investigations/'), 'Missing dynamic investigation link');
    await link.click();
    await page.waitForURL(url => url.pathname.includes('/investigations/') && !url.pathname.endsWith('/investigations/'));
  }, { route: 'investigations/' });
  await test('Evidence collection opens', width, async page => {
    await page.locator('a.evidence-collection').first().click();
    await page.waitForURL(url => url.pathname.includes('/cccl-pits/'));
    assert(await page.locator('h1').count() > 0, 'Evidence page has no heading');
  }, { route: 'evidence/' });
  await test('Contribution link reaches member sign-in', width, async page => {
    await page.locator('a[href="../member-pilot.html"]').first().click();
    await page.waitForURL('**/member-pilot.html');
    assert(await page.locator('form#signin').isVisible(), 'Sign-in form not visible');
  }, { route: 'contribute/' });
  await test('Member forms reject empty and malformed input locally', width, async page => {
    const form = page.locator('form#signin');
    assert(await form.isVisible(), 'Member sign-in form is not visible');
    await form.locator('button').click();
    assert(await form.evaluate(el => !el.checkValidity()), 'Empty sign-in form accepted');
    await page.locator('#signin-email').fill('invalid-email');
    await page.locator('#signin-password').fill('testpassword123');
    assert(!(await page.locator('#signin-email').evaluate(el => el.checkValidity())), 'Malformed email accepted');
  }, { route: 'member-pilot.html' });
}

for (const width of [390, 1440]) {
  await test('Ticker pause and resume is operable', width, async page => {
    const button = page.locator('.beta-newswire__pause');
    await button.waitFor({ state: 'visible', timeout: 8000 });
    const initial = await button.getAttribute('aria-pressed');
    assert(initial === 'true', 'Ticker not initially paused for reduced motion');
    await button.click();
    assert(await button.getAttribute('aria-pressed') === 'false', 'Ticker did not resume');
    await button.click();
    assert(await button.getAttribute('aria-pressed') === 'true', 'Ticker did not pause again');
  });
  await test('Keyboard activates homepage California link', width, async page => {
    const link = page.locator('a[href="california/"]').filter({ hasText: 'Open California' }).first();
    await link.focus();
    assert(await link.evaluate(e => document.activeElement === e), 'Homepage action not focusable');
    await page.keyboard.press('Enter');
    await page.waitForURL('**/california/');
  });
}

// Follow-up keyboard review: verify visible focus and remove decorative ticker duplicates from navigation.
for (const width of [390, 1440]) {
  await test('Homepage action retains visible keyboard focus', width, async page => {
    const action = page.locator('.beta-actions .beta-button--primary').first();
    await action.focus();
    const focus = await action.evaluate(el => {
      const css = getComputedStyle(el);
      return {
        active: document.activeElement === el,
        visible: el.getClientRects().length > 0,
        outlineStyle: css.outlineStyle,
        outlineWidth: parseFloat(css.outlineWidth)
      };
    });
    assert(focus.active && focus.visible, 'Primary action cannot receive visible focus');
    assert(focus.outlineStyle !== 'none' && focus.outlineWidth >= 2,
      'Primary action lacks a substantial visible focus outline: ' + JSON.stringify(focus));
  });

  await test('Decorative ticker copies are absent from keyboard sequence', width, async page => {
    await page.locator('.beta-newswire__duplicate').waitFor({ state: 'attached', timeout: 8000 });
    const duplicates = await page.locator('.beta-newswire__duplicate a').evaluateAll(links =>
      links.map(link => ({
        tabIndex: link.tabIndex,
        ariaHidden: link.closest('[aria-hidden="true"]') !== null
      }))
    );
    assert(duplicates.length > 0, 'Ticker duplicates were not rendered');
    assert(duplicates.every(link => link.tabIndex === -1 && link.ariaHidden),
      'Decorative ticker link entered keyboard or screen-reader navigation');
  });
}

// Exercise actual keyboard events, not just mouse clicks or script-driven focus.
for (const width of [390, 1440]) {
  await test('Topic cards follow DOM tab order', width, async page => {
    const first = page.locator('.beta-topic-card').first();
    const second = page.locator('.beta-topic-card').nth(1);
    await first.focus();
    await page.keyboard.press('Tab');
    assert(await second.evaluate(el => el === document.activeElement),
      'Tab did not move to the next topic card');
    await page.keyboard.press('Shift+Tab');
    assert(await first.evaluate(el => el === document.activeElement),
      'Shift+Tab did not return to the first topic card');
  });

  await test('Ticker control responds to keyboard Space', width, async page => {
    const button = page.locator('.beta-newswire__pause');
    await button.waitFor({ state: 'visible', timeout: 8000 });
    await button.focus();
    assert(await button.getAttribute('aria-pressed') === 'true',
      'Reduced-motion ticker should initially be paused');
    await page.keyboard.press('Space');
    assert(await button.getAttribute('aria-pressed') === 'false',
      'Space did not resume ticker');
    await page.keyboard.press('Space');
    assert(await button.getAttribute('aria-pressed') === 'true',
      'Space did not pause ticker again');
  });

  await test('Deep article text links show keyboard focus', width, async page => {
    const link = page.locator('.md-content__inner a[href]').first();
    await link.focus();
    const result = await link.evaluate(el => {
      const css = getComputedStyle(el);
      return { active: document.activeElement === el, outline: css.outlineStyle, width: parseFloat(css.outlineWidth) };
    });
    assert(result.active && result.outline !== 'none' && result.width >= 2,
      'Deep article link does not receive visible keyboard focus: ' + JSON.stringify(result));
  }, { route: 'california/police-encounters/' });
}

// Reported mobile readability regressions: full update text and non-bleeding headings.
for (const width of [320, 390]) {
  await test('Mobile ticker plays slow readable snap cards', width, async page => {
    const ticker = page.locator('.beta-newswire');
    await ticker.waitFor({ state: 'visible', timeout: 8000 });
    const metrics = await ticker.evaluate(el => {
      const viewport = el.querySelector('.beta-newswire__viewport');
      const item = el.querySelector('.beta-newswire__originals .beta-newswire__item');
      const style = getComputedStyle(item);
      return {
        paused: el.classList.contains('is-paused'),
        overflowX: getComputedStyle(viewport).overflowX,
        itemWidth: item.getBoundingClientRect().width,
        viewportWidth: viewport.getBoundingClientRect().width,
        whiteSpace: style.whiteSpace,
        animationName: getComputedStyle(el.querySelector('.beta-newswire__track')).animationName
      };
    });
    assert(!metrics.paused, 'Mobile ticker should begin playing by default');
    assert(metrics.overflowX === 'auto', 'Mobile updates cannot be swiped');
    assert(metrics.whiteSpace !== 'nowrap', 'Mobile update text cannot wrap');
    assert(metrics.itemWidth >= width - 35, 'Mobile ticker update is too narrow: ' + JSON.stringify(metrics));
    assert(metrics.animationName === 'none', 'Mobile ticker must advance by card, not crawl continuously');
    const control = page.locator('.beta-newswire__pause');
    assert(await control.getAttribute('aria-label') === 'Pause updates',
      'Playing icon has no descriptive accessible name');
    assert(await control.locator('[aria-hidden="true"]').count() === 1,
      'Playback icon is not hidden from screen readers');
    const size = await control.boundingBox();
    assert(size && size.width >= 44 && size.height >= 44,
      'Ticker touch target smaller than 44 CSS pixels');
    await control.click();
    assert(await control.getAttribute('aria-pressed') === 'true',
      'Pause icon did not stop card advancement');
    assert(await control.getAttribute('aria-label') === 'Resume updates',
      'Paused icon did not expose Resume updates to assistive technology');
    await control.click();
    assert(await control.getAttribute('aria-label') === 'Pause updates',
      'Play icon did not restore Pause updates');
  }, { reducedMotion: 'no-preference' });

  await test('Reduced-motion mobile reel starts paused', width, async page => {
    const ticker = page.locator('.beta-newswire');
    await ticker.waitFor({ state: 'visible', timeout: 8000 });
    assert(await ticker.evaluate(el => el.classList.contains('is-paused')),
      'Reduced-motion preference should prevent automatic card movement');
    assert(await page.locator('.beta-newswire__pause').getAttribute('aria-label') === 'Resume updates',
      'Reduced-motion playback control is not labeled');
  }, { reducedMotion: 'reduce' });

  await test('Mobile section headings do not remain sticky behind cards', width, async page => {
    const headings = await page.locator('.beta-sticky-heading').evaluateAll(nodes =>
      nodes.map(el => ({ position: getComputedStyle(el).position, text: el.textContent.trim().slice(0, 65) }))
    );
    assert(headings.length >= 2, 'Expected homepage section headings not found');
    assert(headings.every(h => h.position === 'static'),
      'Mobile heading may bleed through card gaps: ' + JSON.stringify(headings));
  }, { reducedMotion: 'no-preference' });
}

await test('Mobile research reel advances after reading interval', 390, async page => {
  const ticker = page.locator('.beta-newswire');
  await ticker.waitFor({ state: 'visible', timeout: 8000 });
  const interval = Number(await ticker.getAttribute('data-mobile-reel-interval'));
  assert(interval === 3000, 'Mobile reel does not use the three-second interval');
  await page.waitForFunction(() => {
    const element = document.querySelector('.beta-newswire__viewport');
    return element && element.scrollLeft > 25;
  }, null, { timeout: 7000 });
  const button = page.locator('.beta-newswire__pause');
  await button.click();
  assert(await button.getAttribute('aria-pressed') === 'true',
    'Automatic reel cannot be paused');
}, { reducedMotion: 'no-preference' });

await test('Desktop sticky heading treatment remains unchanged', 1440, async page => {
  const headings = await page.locator('.beta-sticky-heading').evaluateAll(nodes =>
    nodes.map(el => getComputedStyle(el).position));
  assert(headings.length >= 2 && headings.every(value => value === 'sticky'),
    'Desktop editorial sticky headings changed: ' + JSON.stringify(headings));
}, { reducedMotion: 'no-preference' });

// Keyboard-first search, drawer and sign-in checks. These exercise keyboard
// events, accessible names and focus behavior without relying on pointer clicks.
for (const width of [390, 1440]) {
  await test('Search result activates using keyboard Enter', width, async page => {
    const opener = page.locator('label.md-header__button[for="__search"]');
    if (await opener.isVisible()) await opener.click();
    const input = page.locator('.md-search__input');
    await input.fill('public records');
    const result = page.locator('.md-search-result__link').first();
    await result.waitFor({ state: 'visible', timeout: 12000 });
    await result.focus();
    assert(await result.evaluate(el => document.activeElement === el),
      'Search result cannot receive keyboard focus');
    await page.keyboard.press('Enter');
    await page.waitForURL(url => !url.pathname.endsWith('/1A-Field-Guide-Site/'),
      { timeout: 7000 });
  });

  await test('Search supports Escape to close', width, async page => {
    const opener = page.locator('label.md-header__button[for="__search"]');
    if (await opener.isVisible()) await opener.click();
    const input = page.locator('.md-search__input');
    await input.focus();
    await input.fill('public records');
    await page.keyboard.press('Escape');
    const state = await page.evaluate(() => ({
      searchChecked: document.querySelector('#__search')?.checked,
      inputValue: document.querySelector('.md-search__input')?.value,
      focused: document.activeElement?.className
    }));
    assert(!state.searchChecked || !state.inputValue,
      'Escape neither closed search nor cleared its query: ' + JSON.stringify(state));
  });

  await test('Member sign-in inputs have labels and visible keyboard focus', width, async page => {
    const email = page.locator('#signin-email');
    const password = page.locator('#signin-password');
    const labels = await page.locator('form#signin').evaluate(form =>
      [...form.querySelectorAll('input')].map(input => ({
        id: input.id,
        labeled: Boolean(input.labels?.length || input.getAttribute('aria-label')),
        required: input.required
      })));
    assert(labels.length === 2 && labels.every(x => x.labeled && x.required),
      'Member sign-in inputs have missing labels or required state: ' + JSON.stringify(labels));
    await email.focus();
    await page.keyboard.press('Tab');
    assert(await password.evaluate(el => document.activeElement === el),
      'Tab from email did not reach password field');
    const outline = await password.evaluate(el => ({
      style: getComputedStyle(el).outlineStyle,
      width: parseFloat(getComputedStyle(el).outlineWidth)
    }));
    assert(outline.style !== 'none' && outline.width >= 2,
      'Password field lacks visible keyboard focus: ' + JSON.stringify(outline));
    await page.keyboard.press('Enter');
    assert(await page.locator('form#signin').evaluate(form => !form.checkValidity()),
      'Submitting incomplete sign-in via keyboard bypassed validation');
  }, { route: 'member-pilot.html' });
}

for (const width of [320, 390]) {
  await test('Mobile drawer links are keyboard reachable', width, async page => {
    await page.locator('label.md-header__button[for="__drawer"]').click();
    await page.waitForFunction(() => document.querySelector('#__drawer')?.checked);
    const link = page.locator('.md-sidebar--primary a.md-nav__link[href*="jurisdictions/"]').first();
    await link.focus();
    assert(await link.evaluate(el => document.activeElement === el),
      'Open drawer navigation link is not keyboard focusable');
    await page.keyboard.press('Enter');
    await page.waitForURL('**/jurisdictions/', { timeout: 7000 });
  });
}

// Screen-reader-adjacent semantic checks. These inspect the browser-exposed
// roles, accessible names, labeling and focus behavior; they do not simulate
// spoken output or replace NVDA, VoiceOver or TalkBack user testing.
for (const width of [390, 1440]) {
  for (const route of ['', 'california/', 'california/police-encounters/']) {
    await test('Page exposes navigable main landmark and named primary heading', width, async page => {
      const main = page.getByRole('main');
      const heading = page.getByRole('heading', { level: 1 });
      assert(await main.count() === 1,
        'Expected exactly one browser-exposed main landmark');
      assert(await heading.count() >= 1,
        'Page has no accessible level-one heading');
      const name = (await heading.first().innerText()).trim();
      assert(name.length > 3, 'Primary heading lacks a meaningful name');
    }, { route });
  }

  await test('Member sign-in controls have browser-exposed accessible names', width, async page => {
    const form = page.locator('form#signin');
    const email = form.getByRole('textbox', { name: 'Email' });
    const password = form.getByLabel('Password', { exact: true });
    const submit = form.getByRole('button', { name: 'Sign in' });
    assert(await email.count() === 1 && await password.count() === 1 &&
      await submit.count() === 1,
      'Sign-in input or action is missing its accessible role/name');
    assert(await email.getAttribute('type') === 'email',
      'Email input lacks its expected input type');
  }, { route: 'member-pilot.html' });

  await test('Research reel is a named region with an accessible pause control', width, async page => {
    const region = page.getByRole('region', { name: 'Current 1A Field Guide research and project updates' });
    await region.waitFor({ state: 'visible', timeout: 8000 });
    const button = region.getByRole('button', { name: 'Resume updates' });
    assert(await button.count() === 1,
      'Reel pause/play control lacks an accessible name');
    assert(await region.locator('.beta-newswire__duplicate a[tabindex="-1"]').count() >= 1,
      'Decorative duplicated reel links are not excluded from keyboard focus');
  }, { reducedMotion: 'reduce' });
}

// Nonphysical zoom and focus checks. A 320px viewport is already covered in
// audit.mjs as a 400%-zoom reflow proxy; these exercise 200% text enlargement.
for (const route of ['', 'california/', 'california/police-encounters/']) {
  for (const width of [390, 1280]) {
    await test('200 percent text enlargement preserves horizontal reflow', width, async page => {
      await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
      await page.waitForTimeout(100);
      const sizes = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        visible: document.documentElement.clientWidth
      }));
      assert(sizes.scroll <= sizes.visible + 2,
        'Text enlargement requires horizontal document scrolling: ' + JSON.stringify(sizes));
    }, { route });
  }
}

// A focused control should be both visibly outlined and unobscured by
// persistent headers, tickers, or overlay layers at the viewport center.
for (const width of [390, 1440]) {
  await test('Focused homepage topic card is visible and unobscured', width, async page => {
    const card = page.locator('.beta-topic-card').first();
    await card.focus();
    const result = await card.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(innerWidth - 1, rect.left + rect.width / 2));
      const y = Math.max(0, Math.min(innerHeight - 1, rect.top + Math.min(rect.height / 2, 35)));
      const hit = document.elementFromPoint(x, y);
      const style = getComputedStyle(el);
      return {
        active: document.activeElement === el,
        inView: rect.bottom > 0 && rect.top < innerHeight,
        unobscured: hit === el || el.contains(hit),
        outline: style.outlineStyle,
        width: parseFloat(style.outlineWidth),
        hit: hit?.className?.toString().slice(0, 100)
      };
    });
    assert(result.active && result.inView && result.unobscured &&
      result.outline !== 'none' && result.width >= 2,
      'Focused topic card is obscured or missing focus indication: ' + JSON.stringify(result));
  });
}

const textSpacingRoutes = [
  '', 'california/', 'investigations/', 'evidence/', 'contribute/',
  'california/recording-public-officials/', 'california/police-encounters/',
  'california/public-libraries/', 'california/trespass-removal/',
  'national-core/complaint-driven-police-encounter/',
  'california/investigations/contra-costa-library-pits/',
  'evidence/california/cccl-pits/', 'registry/concord-library/',
  'california/public-records-evidence-preservation/'
];
for (const route of textSpacingRoutes) {
  await test('Text spacing reflow', 320, async page => {
    await page.addStyleTag({ content: `
      .md-typeset, .beta-home { line-height: 1.5 !important; }
      .md-typeset p, .beta-home p { margin-bottom: 2em !important; }
      .md-typeset, .beta-home { letter-spacing: .12em !important; word-spacing: .16em !important; }
    ` });
    const reflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    assert(reflow.scrollWidth <= reflow.clientWidth + 2,
      'Text spacing overflow ' + JSON.stringify(reflow));
  }, { route });
}

await browser.close();
const failed = results.filter(r => r.outcome === 'fail');
writeFileSync(join(output, 'functional-journeys.json'), JSON.stringify({
  generated: new Date().toISOString(), scope: 'Browser functional smoke tests, not a screen-reader certification', browser: engine,
  total: results.length, passed: results.length - failed.length, failed: failed.length, results
}, null, 2));
console.log(engine + ' functional journeys: ' + (results.length - failed.length) + '/' + results.length + ' passed');
if (failed.length) process.exitCode = 1;
