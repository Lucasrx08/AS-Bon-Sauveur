import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
page.on('console', msg => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });

try {
  await page.goto('http://127.0.0.1:8000/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForSelector('.v19-shell', { timeout: 12000 });
  await page.waitForTimeout(1200);

  const counts = await page.evaluate(() => ({
    poles: document.querySelectorAll('.v22-poles').length,
    instagram: document.querySelectorAll('.v22-instagram').length,
    width: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  if (counts.poles !== 1) throw new Error(`Expected one public poles section, got ${counts.poles}`);
  if (counts.instagram !== 1) throw new Error(`Expected one Instagram block, got ${counts.instagram}`);
  if (counts.width > counts.viewport + 2) throw new Error(`Horizontal overflow: ${counts.width}px for ${counts.viewport}px viewport`);

  const mutations = await page.evaluate(() => new Promise(resolve => {
    let count = 0;
    const observer = new MutationObserver(list => { count += list.length; });
    observer.observe(document.getElementById('app'), { childList: true, subtree: true });
    setTimeout(() => { observer.disconnect(); resolve(count); }, 900);
  }));
  if (mutations > 12) throw new Error(`DOM still mutating after settle: ${mutations} mutation records`);

  await page.locator('.v19-avatar').click();
  await page.waitForSelector('#v22-modal', { timeout: 3000 });
  const title = await page.locator('#v22-modal h2').textContent();
  if (!/Connexion|Mon espace/.test(title || '')) throw new Error(`Unexpected profile modal title: ${title}`);
  await page.locator('#v22-modal [data-close]').click();

  const calendar = page.locator('.v19-bottom-nav button').filter({ hasText: 'Calendrier' }).first();
  await calendar.click();
  await page.waitForTimeout(250);
  if (!(await page.locator('.v19-page-head').count())) throw new Error('Calendar navigation did not render');

  const home = page.locator('.v19-bottom-nav button').filter({ hasText: 'Accueil' }).first();
  await home.click();
  await page.waitForTimeout(250);
  const instagramButton = page.locator('.v21-instagram-simple-btn');
  if (!(await instagramButton.count())) throw new Error('Instagram button missing after returning home');

  if (errors.length) throw new Error(errors.join('\n'));
  console.log('V22 public/mobile smoke test passed');
} finally {
  await browser.close();
}
