/* Automated rendered-page screening. Manual assistive technology review is still required. */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.env.AUDIT_URL || 'http://127.0.0.1:8765/1A-Field-Guide-Site/';
const out = process.env.AUDIT_OUTPUT || 'audit-results';
mkdirSync(out, { recursive: true });

const routes = [
  ['', 'Home'],
  ['california/', 'California guide'],
  ['investigations/', 'Investigations'],
  ['evidence/', 'Evidence library'],
  ['open-government/public-records/', 'Public records'],
  ['contribute/', 'Contribute'],
  ['jurisdictions/', 'Jurisdictions'],
  ['member-pilot.html', 'Member sign-in']
];

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const report = [];
let errorCount = 0;

for (const [route, title] of routes) {
  for (const size of [390, 1440]) {
    const context = await browser.newContext({
      viewport: { width: size, height: 850 },
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    const target = new URL(route, root).href;
    let entry = { title, route, viewport: size, url: target };
    try {
      const response = await page.goto(target, { waitUntil: 'networkidle', timeout: 30000 });
      if (!response?.ok()) throw new Error('HTTP ' + response?.status());
      await page.evaluate(() => document.fonts?.ready);
      const findings = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze();
      const metrics = await page.evaluate(() => {
        const root = document.documentElement;
        const doc = document.body;
        return {
          documentWidth: root.scrollWidth,
          clientWidth: root.clientWidth,
          bodyWidth: doc.scrollWidth,
          title: document.title,
          lang: root.lang,
          headings: [...document.querySelectorAll('h1')].map(h => h.textContent.trim()).slice(0, 6),
          families: [...new Set([...document.querySelectorAll('h1,h2,h3,p,.beta-label')]
            .slice(0, 100).map(e => getComputedStyle(e).fontFamily))],
          weights: [...new Set([...document.querySelectorAll('h1,h2,h3,p,.beta-label')]
            .slice(0, 100).map(e => getComputedStyle(e).fontWeight))]
        };
      });
      entry = { ...entry, ...metrics,
        violations: findings.violations.map(v => ({
          id: v.id, impact: v.impact, description: v.help,
          nodes: v.nodes.slice(0, 8).map(n => ({ target: n.target, summary: n.failureSummary }))
        })),
        incomplete: findings.incomplete.map(v => ({ id: v.id, nodes: v.nodes.length })),
        passes: findings.passes.length
      };
      if (metrics.documentWidth > metrics.clientWidth + 2) {
        entry.reflowIssue = true;
      }
      if (entry.violations.length || entry.reflowIssue) errorCount++;
    } catch (error) {
      entry.error = String(error);
      errorCount++;
    }
    report.push(entry);
    await context.close();
  }
}

// Reflow at 320 CSS pixels is equivalent to 1280px desktop at 400% zoom.
for (const width of [320]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  for (const route of ['', 'investigations/', 'evidence/', 'contribute/']) {
    const p = await ctx.newPage();
    const entry = { title: 'Reflow', route, viewport: width };
    try {
      const response = await p.goto(new URL(route, root).href, { waitUntil: 'networkidle' });
      if (!response?.ok()) throw new Error('HTTP ' + response?.status());
      const metrics = await p.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }));
      Object.assign(entry, metrics);
      if (metrics.documentWidth > metrics.clientWidth + 2) {
        entry.reflowIssue = true;
        errorCount++;
      }
    } catch (e) { entry.error = String(e); errorCount++; }
    report.push(entry);
    await p.close();
  }
  await ctx.close();
}

/* Functional mobile navigation test. Static axe scans cannot detect dead menus. */
for (const route of ['', 'california/']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const entry = { title: 'Mobile drawer', route, viewport: 390 };
  try {
    await page.goto(new URL(route, root).href, { waitUntil: 'networkidle' });
    const menu = page.locator('label.md-header__button[for="__drawer"]');
    await menu.click({ timeout: 6000 });
    await page.waitForFunction(() => {
      const sidebar = document.querySelector('.md-sidebar--primary');
      return document.querySelector('#__drawer')?.checked &&
        sidebar && sidebar.getBoundingClientRect().width > 100;
    }, { timeout: 5000 });
    const target = page.locator('.md-sidebar--primary a.md-nav__link[href*="contribute/"]').first();
    await target.click({ timeout: 6000 });
    await page.waitForURL('**/contribute/', { timeout: 6000 });
    entry.passed = true;
  } catch (error) {
    entry.error = String(error);
    errorCount++;
  }
  report.push(entry);
  console.log('MOBILE NAV ' + route + ' ' + (entry.passed ? 'PASS' : entry.error));
  await ctx.close();
}

await browser.close();

writeFileSync(join(out, 'wcag-screening.json'), JSON.stringify({
  generated: new Date().toISOString(),
  standard: 'WCAG 2.2 AA automated screening; not a conformance certificate',
  totalChecks: report.length,
  flaggedChecks: errorCount,
  pages: report
}, null, 2));
for (const p of report) {
  const summary = [p.title, p.viewport + 'px',
    p.error || (p.violations?.length ? p.violations.map(v => v.id).join(', ') : 'axe clear'),
    p.reflowIssue ? 'horizontal overflow' : ''].filter(Boolean);
  process.stdout.write(summary.join(' | ') + '\n');
  for (const violation of p.violations || []) {
    for (const node of violation.nodes.slice(0, 2)) {
      process.stdout.write('  ' + violation.id + ' ' + JSON.stringify(node.target) + ' ' + String(node.summary).slice(0, 160).replace(/\\n/g, ' ') + '\n');
    }
  }
}
process.stdout.write('Flagged checks: ' + errorCount + '\n');
// The corrected baseline has zero findings. Block regressions in these tests.
if (errorCount > 0) process.exitCode = 1;
