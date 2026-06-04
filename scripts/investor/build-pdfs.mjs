import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const investorDir = path.join(root, 'docs/investor');
const outDir = path.join(investorDir, 'pdf');

const docs = [
  { html: 'product-overview.html', pdf: 'product-overview.pdf' },
  { html: 'competitive-analysis.html', pdf: 'competitive-analysis.pdf' },
  { html: 'brand-naming-options.html', pdf: 'brand-naming-options.pdf' },
];

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });

for (const { html, pdf } of docs) {
  const filePath = path.join(investorDir, html);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing ${filePath}`);
    process.exitCode = 1;
    continue;
  }
  await page.goto(`file://${filePath}`, { waitUntil: 'networkidle' });
  await page.pdf({
    path: path.join(outDir, pdf),
    format: 'A4',
    printBackground: true,
    margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' },
  });
  console.log(`Wrote ${pdf}`);
}

await browser.close();
