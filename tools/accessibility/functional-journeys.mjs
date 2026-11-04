/* Functional visitor-journey checks. Complements axe checks; not WCAG certification. */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.AUDIT_URL || 'http://127.0.0.1:8765/1A-Field-Guide-Site/';
const output = process.env.AUDIT_OUTPUT || 'audit-results';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
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
  generated: new Date().toISOString(), scope: 'Browser functional smoke tests, not a screen-reader certification',
  total: results.length, passed: results.length - failed.length, failed: failed.length, results
}, null, 2));
console.log('Functional journeys: ' + (results.length - failed.length) + '/' + results.length + ' passed');
if (failed.length) process.exitCode = 1;
