// サムネイル一括撮影スクリプト。1280x800で開き、幅640・品質80のjpgに縮小して保存する。
// 失敗したURLはスキップしてログに残す（1件の失敗で全体を落とさない）。
import { chromium } from '/Users/ryoseiworld/omnilist/node_modules/playwright/index.mjs';
import sharp from '/Users/ryoseiworld/omnilist/node_modules/sharp/lib/index.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'assets', 'thumbs');
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  ['links', 'https://imai-design.github.io/links/'],
  ['adhd-mura', 'https://imai-design.github.io/adhd-mura/'],
  ['narabe', 'https://imai-design.github.io/narabe/'],
  ['claude-kyoso', 'https://imai-design.github.io/claude-kyoso/'],
  ['hp-shindan', 'https://imai-design.github.io/hp-shindan/'],
  ['nenshu-shindan', 'https://imai-design.github.io/nenshu-shindan/'],
  ['keitai', 'https://imai-design.github.io/keitai/'],
  ['sheets-gemini', 'https://imai-design.github.io/sheets-gemini-function/'],
  ['mayonaka-cake', 'https://imai-design.github.io/mayonaka-cake/'],
  ['okane-mieru-kun', 'https://imai-design.github.io/okane-mieru-kun/'],
  ['insta-card-kit', 'https://imai-design.github.io/insta-card-kit/'],
  ['freehp', 'https://freehp.jp/'],
  ['freehp-jidoka', 'https://freehp.jp/jidoka.html'],
  ['butler-demo', 'https://Ryoseiimai.github.io/butler-delivery-demo/'],
  ['hostelden-checklist', 'https://imai-design.github.io/hostelden-checklist/'],
  ['ryoseiworld', 'https://ryoseiworld.co.jp/'],
  ['ryosei-galaxy', 'https://ryoseiimai.github.io/ryosei-galaxy/'],
  ['freehp-ai-team', 'https://ryoseiimai.github.io/freehp-ai-team/'],
  ['ryoseiworld-game', 'https://ryoseiimai.github.io/ryoseiworld-game/'],
  ['one-image-pachi', 'https://ryoseiimai.github.io/one-image-pachi/'],
  ['nissaro-ranking', 'https://ryoseiimai.github.io/nissaro-ranking/'],
  ['fb-profile-kit', 'https://ryoseiimai.github.io/fb-profile-kit/'],
  ['chosei-kun', 'https://ryoseiimai.github.io/chosei-kun/'],
  ['camp-setup-kun', 'https://ryoseiimai.github.io/camp-setup-kun/'],
  ['otoshimono-navi', 'https://ryoseiimai.github.io/otoshimono-navi/'],
  ['round-robin-scoreboard', 'https://ryoseiimai.github.io/round-robin-scoreboard/'],
  ['ygo-1103-sim', 'https://ryoseiimai.github.io/ygo-1103-sim/'],
  ['event-calendar-kun', 'https://ryoseiimai.github.io/event-calendar-kun/'],
  ['slide-chapter-splitter', 'https://ryoseiimai.github.io/slide-chapter-splitter/'],
  ['tsukuyomi-saryo', 'https://ryoseiimai.github.io/tsukuyomi-saryo/'],
  ['ryosei-cart', 'https://ryoseiimai.github.io/ryosei-cart/'],
  ['pachinko-store-tools', 'https://ryoseiimai.github.io/pachinko-store-tools/'],
  ['ai-pachinko-maker', 'https://ryoseiimai.github.io/ai-pachinko-maker/'],
  ['gaibu-kioku-statusline', 'https://ryoseiimai.github.io/gaibu-kioku-statusline/'],
  ['ai-pachinko-sim', 'https://ryoseiimai.github.io/ai-pachinko-sim/'],
];

const results = [];

const browser = await chromium.launch();
for (const [slug, url] of targets) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(500);
    const title = await page.title().catch(() => '');
    const rawBuffer = await page.screenshot();
    const jpgPath = path.join(outDir, `${slug}.jpg`);
    await sharp(rawBuffer).resize({ width: 640 }).jpeg({ quality: 80 }).toFile(jpgPath);
    results.push({ slug, url, title, ok: true, jpgPath });
  } catch (err) {
    console.error(`[FAIL] ${slug} (${url}): ${err.message}`);
    results.push({ slug, url, title: '', ok: false, error: err.message });
  } finally {
    await page.close();
  }
}
await browser.close();

fs.writeFileSync(path.join(__dirname, 'capture-results.json'), JSON.stringify(results, null, 2));
console.log('---撮影結果---');
for (const r of results) {
  console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.slug} ${r.ok ? `title="${r.title}"` : r.error}`);
}
