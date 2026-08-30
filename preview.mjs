// index.html を1280px/375pxでスクショし横スクロールの有無を確認する（仕上げ確認用の使い捨てスクリプト）。
import { chromium } from '/Users/ryoseiworld/omnilist/node_modules/playwright/index.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.json': 'application/json' };
const server = createServer((req, res) => {
  let filePath = path.join(__dirname, decodeURIComponent(req.url.split('?')[0]));
  if (req.url === '/') filePath = path.join(__dirname, 'index.html');
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    res.writeHead(404); res.end('not found'); return;
  }
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
  createReadStream(filePath).pipe(res);
});
await new Promise((resolve) => server.listen(8971, resolve));

const browser = await chromium.launch();

for (const [name, width, height] of [['preview-1280', 1280, 900], ['preview-375', 375, 900]]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto('http://localhost:8971/index.html', { waitUntil: 'networkidle' });
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  console.log(`${name}: scrollWidth=${scrollWidth} clientWidth=${clientWidth} 横スクロール=${scrollWidth > clientWidth ? 'あり(NG)' : 'なし(OK)'}`);
  await page.screenshot({ path: path.join(__dirname, `${name}.png`), fullPage: true });
  await page.close();
}

// live.html も一応確認
const livePage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await livePage.goto('http://localhost:8971/live.html', { waitUntil: 'networkidle' });
await livePage.screenshot({ path: path.join(__dirname, 'preview-live.png'), fullPage: true });
await livePage.close();

await browser.close();
server.close();
